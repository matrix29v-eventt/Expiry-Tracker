import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import ocrRoutes from "./routes/ocr.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import listRoutes from "./routes/list.routes.js";
import path from "path";

const app = express(); // ✅ APP MUST COME FIRST

// ✅ Middlewares
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ✅ Serve uploaded images static
app.use("/uploads", express.static(path.resolve("uploads")));

// ✅ Routes (AFTER app is created)
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/lists", listRoutes);

// ✅ Health check (optional)
app.get("/", (req, res) => {
  res.send("API is running");
});

export default app;

