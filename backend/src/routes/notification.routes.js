import express from "express";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/auth.middleware.js";
import { getPagination, paginateResponse } from "../utils/pagination.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query, 20);
    const filter = { user: req.userId };

    const [notifications, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
    ]);

    res.json(paginateResponse(notifications, total, page, limit));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/read", protect, async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  res.json({ success: true });
});

export default router;
