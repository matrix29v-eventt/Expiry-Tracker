import express from "express";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me", protect, (req, res) => {
  res.json({ message: "Authorized", userId: req.userId });
});

export default router;
