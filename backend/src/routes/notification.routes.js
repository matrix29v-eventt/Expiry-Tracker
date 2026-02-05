import express from "express";
import Notification from "../models/Notification.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const notifications = await Notification.find({
    user: req.userId,
  }).sort({ createdAt: -1 });

  res.json(notifications);
});

router.post("/:id/read", protect, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, {
    isRead: true,
  });
  res.json({ success: true });
});

export default router;
