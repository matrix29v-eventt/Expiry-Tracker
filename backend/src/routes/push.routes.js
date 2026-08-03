import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import User from "../models/User.js";

const router = express.Router();

/* Register a browser push subscription for the logged-in user */
router.post("/subscribe", protect, async (req, res) => {
  try {
    const { endpoint, keys, userAgent } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ message: "Invalid push subscription" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const alreadySaved = user.pushSubscriptions.some((sub) => sub.endpoint === endpoint);
    if (alreadySaved) {
      return res.json({ message: "Subscription already saved" });
    }

    user.pushSubscriptions.push({ endpoint, keys, userAgent });
    await user.save();

    res.status(201).json({ message: "Subscribed to push notifications" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* Remove a browser push subscription */
router.delete("/unsubscribe", protect, async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ message: "Endpoint is required" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.pushSubscriptions.pull({ endpoint });
    await user.save();

    res.json({ message: "Unsubscribed from push notifications" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
