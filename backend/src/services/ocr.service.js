import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OCRService {
  async extractExpiryDate(imagePath, filename) {
    try {
      const apiKey = process.env.OCR_SPACE_API_KEY;
      
      if (!apiKey) {
        throw new Error("OCR_SPACE_API_KEY not configured");
      }

      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString("base64");

      const formData = new FormData();
      formData.append("base64Image", `data:image/png;base64,${base64Image}`);
      formData.append("language", "eng");
      formData.append("isOverlayRequired", "false");
      formData.append("detectOrientation", "true");
      formData.append("scale", "true");
      formData.append("OCREngine", "2");

      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: {
          apikey: apiKey,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.IsErroredOnProcessing) {
        throw new Error(data.ErrorMessage[0] || "OCR API error");
      }

      if (!data.ParsedResults || data.ParsedResults.length === 0) {
        throw new Error("No text found in image");
      }

      const rawText = data.ParsedResults[0].ParsedText;

      let text = rawText.toUpperCase();
      text = text
        .replace(/\n+/g, " ")
        .replace(/[^A-Z0-9\/\-\s:.]/g, " ")
        .replace(/\s+/g, " ");

      const dateRegex =
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{1,2}\s[A-Z]{3}\s\d{4})|(\d{2}[\/\-]\d{4})/g;
      const specialDateRegex =
        /(\d{4})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})/;
      const allDates = text.match(dateRegex) || [];

      let expiryDate = null;
      let mfgDate = null;

      if (text.includes("EXP")) {
        const expIndex = text.indexOf("EXP");
        const nearby = text.slice(expIndex, expIndex + 80);

        const match =
          nearby.match(dateRegex) || nearby.match(specialDateRegex);

        if (match) {
          expiryDate = match[0];
        }
      }

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

      if (!expiryDate && allDates.length > 0) {
        expiryDate = allDates[allDates.length - 1];
      }

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

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
