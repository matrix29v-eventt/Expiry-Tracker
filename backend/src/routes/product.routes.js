import express from "express";
import Product from "../models/Product.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ADD PRODUCT */
router.post("/add", protect, async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      user: req.userId, // 🔑 attach logged-in user
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
      user: req.userId, // 🔒 ownership check
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

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


export default router;
