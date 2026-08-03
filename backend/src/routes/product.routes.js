import express from "express";
import Product from "../models/Product.js";
import History from "../models/History.js";
import { protect } from "../middleware/auth.middleware.js";
import { getPagination, paginateResponse } from "../utils/pagination.js";
import { startOfToday, addDays } from "../utils/expiryLogic.js";

const router = express.Router();

/* Max products a single user can track (overridable via MAX_PRODUCTS env) */
const MAX_PRODUCTS = parseInt(process.env.MAX_PRODUCTS, 10) || 500;

const productCount = (userId) => Product.countDocuments({ user: userId });

const getWeekRange = (week) => {
  const start = startOfToday();
  const end = addDays(start, 6);
  end.setHours(23, 59, 59, 999);

  if (week === "next") {
    start.setDate(start.getDate() + 7);
    end.setDate(end.getDate() + 7);
  } else if (week === "last") {
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() - 7);
  }

  return { start, end };
};

/* ADD PRODUCT */
router.post("/add", protect, async (req, res) => {
  try {
    const count = await productCount(req.userId);
    if (count >= MAX_PRODUCTS) {
      return res
        .status(400)
        .json({ message: `Product limit reached (${MAX_PRODUCTS}). Delete some products to add more.` });
    }

    const product = await Product.create({
      ...req.body,
      user: req.userId,
    });

    await History.create({
      user: req.userId,
      productName: product.name,
      action: "added",
      category: product.category,
      expiryDate: product.expiryDate,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* LIST USER PRODUCTS */
router.get("/list", protect, async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query, 12);
    const filter = { user: req.userId };

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json(paginateResponse(products, total, page, limit));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* DELETE PRODUCT */
router.delete("/:id", protect, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await History.create({
      user: req.userId,
      productName: product.name,
      action: "deleted",
      category: product.category,
      expiryDate: product.expiryDate,
    });

    await product.deleteOne();
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* MARK PRODUCT AS EXPIRED */
router.put("/:id/expire", protect, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isExpired = true;
    await product.save();

    await History.create({
      user: req.userId,
      productName: product.name,
      action: "expired",
      category: product.category,
      expiryDate: product.expiryDate,
    });

    res.json({ message: "Product marked as expired", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* EXPORT PRODUCTS AS CSV (filters: status, week, from, to) */
router.get("/export", protect, async (req, res) => {
  try {
    const { status, week, from, to } = req.query;

    const conditions = [];

    if (status === "expired") {
      conditions.push({ expiryDate: { $lt: startOfToday() } });
    } else if (status === "expiring") {
      conditions.push({ expiryDate: { $gte: startOfToday(), $lte: addDays(startOfToday(), 30) } });
    } else if (status === "active") {
      conditions.push({ expiryDate: { $gte: startOfToday() } });
    }

    if (week && ["this", "next", "last"].includes(week)) {
      const { start, end } = getWeekRange(week);
      conditions.push({ expiryDate: { $gte: start, $lte: end } });
    }

    if (from) conditions.push({ expiryDate: { $gte: new Date(`${from}T00:00:00.000`) } });
    if (to) conditions.push({ expiryDate: { $lte: new Date(`${to}T23:59:59.999`) } });

    const filter = { user: req.userId };
    if (conditions.length === 1) Object.assign(filter, conditions[0]);
    else if (conditions.length > 1) filter.$and = conditions;

    const products = await Product.find(filter).sort({ expiryDate: 1 });

    const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csvHeader = "Name,Category,Quantity,Unit,Expiry Date,Status,Days Left,Created At\n";
    const today = startOfToday();
    const csvRows = products.map((p) => {
      const expiryDate = new Date(p.expiryDate).toISOString().slice(0, 10);
      const createdAt = new Date(p.createdAt).toISOString().slice(0, 10);
      const daysLeft = Math.ceil((new Date(p.expiryDate) - today) / (1000 * 60 * 60 * 24));
      const status = daysLeft < 0 ? "Expired" : daysLeft <= 3 ? "Expiring Soon" : "Active";
      const quantity = p.quantity ? `${p.quantity}${p.unit ? ` ${p.unit}` : ""}` : "1";
      return [
        csvEscape(p.name),
        csvEscape(p.category || ""),
        csvEscape(quantity),
        csvEscape(p.unit || ""),
        csvEscape(expiryDate),
        csvEscape(status),
        csvEscape(daysLeft),
        csvEscape(createdAt),
      ].join(",");
    }).join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=products.csv");
    res.send(csvHeader + csvRows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* IMPORT PRODUCTS FROM CSV (BATCH) */
router.post("/import", protect, async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "No products provided" });
    }

    const count = await productCount(req.userId);
    const available = MAX_PRODUCTS - count;
    if (products.length > available) {
      return res.status(400).json({
        message: `Import would exceed the ${MAX_PRODUCTS} product limit (${available} slot${available !== 1 ? "s" : ""} available).`,
      });
    }

    const productsToCreate = products.map(p => ({
      name: p.name,
      expiryDate: p.expiryDate,
      category: p.category || "",
      quantity: p.quantity || 1,
      unit: p.unit || "",
      user: req.userId,
    }));

    const createdProducts = await Product.insertMany(productsToCreate);
    
    res.status(201).json({ 
      message: `Successfully imported ${createdProducts.length} products`,
      count: createdProducts.length 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* FULL DATA BACKUP */
router.get("/backup", protect, async (req, res) => {
  try {
    const products = await Product.find({ user: req.userId });
    const backup = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      products: products.map(p => ({
        name: p.name,
        expiryDate: p.expiryDate,
        category: p.category,
        quantity: p.quantity,
        unit: p.unit,
        isExpired: p.isExpired,
        createdAt: p.createdAt,
      })),
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", "attachment; filename=expiry-tracker-backup.json");
    res.json(backup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* RESTORE DATA FROM BACKUP */
router.post("/restore", protect, async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Invalid backup data" });
    }

    if (products.length > MAX_PRODUCTS) {
      return res.status(400).json({
        message: `Backup contains more than the ${MAX_PRODUCTS} product limit.`,
      });
    }

    // Delete existing products
    await Product.deleteMany({ user: req.userId });

    // Create new products
    const productsToCreate = products.map(p => ({
      name: p.name,
      expiryDate: p.expiryDate,
      category: p.category || "",
      quantity: p.quantity || 1,
      unit: p.unit || "",
      isExpired: p.isExpired || false,
      user: req.userId,
    }));

    await Product.insertMany(productsToCreate);
    
    res.json({ message: `Successfully restored ${productsToCreate.length} products` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


export default router;
