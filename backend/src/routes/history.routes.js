import express from "express";
import History from "../models/History.js";
import { protect } from "../middleware/auth.middleware.js";
import { getPagination, paginateResponse } from "../utils/pagination.js";

const router = express.Router();

/* GET USER HISTORY */
router.get("/", protect, async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query, 20);
    const filter = { user: req.userId };

    const [history, total] = await Promise.all([
      History.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      History.countDocuments(filter),
    ]);

    res.json(paginateResponse(history, total, page, limit));
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
