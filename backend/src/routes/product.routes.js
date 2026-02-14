import express from "express";
import Product from "../models/Product.js";
import History from "../models/History.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ADD PRODUCT */
router.post("/add", protect, async (req, res) => {
  try {
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
    const products = await Product.find({ user: req.userId }).sort({
      createdAt: -1,
    });

    res.json(products);
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

/* EXPORT PRODUCTS AS CSV */
router.get("/export", protect, async (req, res) => {
  try {
    const products = await Product.find({ user: req.userId });
    
    const csvHeader = "Name,Category,Expiry Date,Expired,Created At\n";
    const csvRows = products.map(p => {
      const expiryDate = new Date(p.expiryDate).toLocaleDateString();
      const createdAt = new Date(p.createdAt).toLocaleDateString();
      return `"${p.name}","${p.category || ''}","${expiryDate}","${p.isExpired ? 'Yes' : 'No'}","${createdAt}"`;
    }).join("\n");

    res.setHeader("Content-Type", "text/csv");
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

    const productsToCreate = products.map(p => ({
      name: p.name,
      expiryDate: p.expiryDate,
      category: p.category || "",
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

    // Delete existing products
    await Product.deleteMany({ user: req.userId });

    // Create new products
    const productsToCreate = products.map(p => ({
      name: p.name,
      expiryDate: p.expiryDate,
      category: p.category || "",
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
