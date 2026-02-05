import express from "express";
import multer from "multer";
import Tesseract from "tesseract.js";
import sharp from "sharp";
import fs from "fs";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/expiry",
  protect,
  upload.single("image"),
  async (req, res) => {
    try {
      // 1️⃣ Preprocess image for better OCR
      const processedPath = `uploads/processed-${req.file.filename}.png`;

     // ✅ STRONG IMAGE PREPROCESSING (IMPORTANT)
await sharp(req.file.path)
  .resize({ width: 1200 })   // makes text bigger for OCR
  .grayscale()               // removes color noise
  .blur(1)                   // smooths dot-matrix ink
  .linear(1.5, -50)          // increases contrast
  .sharpen()                 // sharpens characters
  .threshold(120)            // removes background
  .toFile(processedPath);

      // 2️⃣ OCR
     const result = await Tesseract.recognize(
  processedPath,
  "eng",
  {
    tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/-",
  }
);

      // 3️⃣ Normalize text
      let text = result.data.text.toUpperCase();
      text = text
        .replace(/\n+/g, " ")
        .replace(/[^A-Z0-9\/\-\s:.]/g, " ")
        .replace(/\s+/g, " ");

      // 4️⃣ Date extraction
      const dateRegex =
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{1,2}\s[A-Z]{3}\s\d{4})|(\d{2}[\/\-]\d{4})/g;
const specialDateRegex =
  /(\d{4})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})/;
      const allDates = text.match(dateRegex) || [];

      const expiryKeywords = [
        "EXP",
        "EXPIRY",
        "EXPIRES",
        "BEST BEFORE",
        "BEST BEFORE END",
        "USE BY"
      ];

      let expiryDate = null;
      let mfgDate = null;

      // 5️⃣ Context-based detection
    if (text.includes("EXP")) {
  const expIndex = text.indexOf("EXP");
  const nearby = text.slice(expIndex, expIndex + 80);

  const match =
    nearby.match(dateRegex) || nearby.match(specialDateRegex);

  if (match) {
    expiryDate = match[0];
  }
}

// 🔥 LAYER 3: YYYYMMMDD support (e.g. 2025MAY11)
if (!expiryDate) {
  const specialMatch = text.match(specialDateRegex);
  if (specialMatch) {
    const year = specialMatch[1];
    const month = specialMatch[2];
    const day = specialMatch[3];
    expiryDate = `${day} ${month} ${year}`;
  }
}

      if (text.includes("MFG") || text.includes("MANUFACTURED")) {
        const idx = text.indexOf("MFG");
        const nearby = text.substring(idx, idx + 50);
        const match = nearby.match(dateRegex);
        if (match) mfgDate = match[0];
      }

      // 6️⃣ Fallback rule
      if (!expiryDate && allDates.length > 0) {
        expiryDate = allDates[allDates.length - 1];
      }

      // Cleanup files
      fs.unlinkSync(req.file.path);
      fs.unlinkSync(processedPath);

      res.json({
        rawText: text,
        expiryDate,
        mfgDate,
        allDates
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "OCR failed" });
    }
  }
);

export default router;
