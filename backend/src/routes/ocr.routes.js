import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.middleware.js";
import { extractExpiryDate } from "../controllers/ocr.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/expiry", protect, upload.single("image"), extractExpiryDate);

export default router;
