import express from "express";
import History from "../models/History.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/* GET USER HISTORY */
router.get("/", protect, async (req, res) => {
  try {
    const history = await History.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ADD HISTORY ENTRY */
router.post("/", protect, async (req, res) => {
  try {
    const entry = await History.create({
      ...req.body,
      user: req.userId,
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
