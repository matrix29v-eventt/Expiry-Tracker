import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.middleware.js";
import { getMe, updateMe } from "../controllers/user.controller.js";
import { sendTestNotification } from "../services/notification.service.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);

/* Send a test notification through the user's enabled channels */
router.post("/me/test-notification", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const results = await sendTestNotification({ user });
    res.json({ results });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
