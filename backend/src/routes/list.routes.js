import express from "express";
import List from "../models/List.js";
import Product from "../models/Product.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/* CREATE LIST */
router.post("/", protect, async (req, res) => {
  try {
    const list = await List.create({
      name: req.body.name,
      user: req.userId,
    });
    res.status(201).json(list);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* GET ALL LISTS */
router.get("/", protect, async (req, res) => {
  try {
    const lists = await List.find({ user: req.userId });
    res.json(lists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* DELETE LIST */
router.delete("/:id", protect, async (req, res) => {
  try {
    const list = await List.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    await Product.deleteMany({ list: req.params.id });
    await list.deleteOne();
    res.json({ message: "List deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ADD PRODUCT TO LIST */
router.post("/:id/products", protect, async (req, res) => {
  try {
    const list = await List.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    const product = await Product.create({
      ...req.body,
      user: req.userId,
      list: list._id,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* GET PRODUCTS IN LIST */
router.get("/:id/products", protect, async (req, res) => {
  try {
    const list = await List.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    const products = await Product.find({ 
      user: req.userId,
      list: list._id 
    }).sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
