import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import ocrRoutes from "./routes/ocr.routes.js";

const app = express(); // ✅ APP MUST COME FIRST

// ✅ Middlewares
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ✅ Routes (AFTER app is created)
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ocr", ocrRoutes);

// ✅ Health check (optional)
app.get("/", (req, res) => {
  res.send("API is running");
});

export default app;
