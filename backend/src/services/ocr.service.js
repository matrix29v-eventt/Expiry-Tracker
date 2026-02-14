import Tesseract from "tesseract.js";
import sharp from "sharp";
import fs from "fs";

class OCRService {
  async extractExpiryDate(imagePath, filename) {
    try {
      // 1️⃣ Preprocess image for better OCR
      const processedPath = `uploads/processed-${filename}.png`;

      await sharp(imagePath)
        .resize({ width: 1200 })
        .grayscale()
        .blur(1)
        .linear(1.5, -50)
        .sharpen()
        .threshold(120)
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

      // YYYYMMMDD support
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
      fs.unlinkSync(imagePath);
      fs.unlinkSync(processedPath);

      return {
        rawText: text,
        expiryDate,
        mfgDate,
        allDates
      };
    } catch (error) {
      console.error("OCR Service Error:", error);
      throw new Error("OCR processing failed");
    }
  }
}

export default new OCRService();