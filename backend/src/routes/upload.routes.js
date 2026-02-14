import express from "express";
import multer from "multer";
import path from "path";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve("uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.post("/", protect, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  // Construct a public URL
  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({ imageUrl: url });
});

export default router;
