import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getMe, updateMe } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);

export default router;
