import ocrService from "../services/ocr.service.js";

export const extractExpiryDate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const result = await ocrService.extractExpiryDate(
      req.file.path,
      req.file.filename
    );

    res.json(result);
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ message: "OCR failed" });
  }
};