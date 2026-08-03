import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import mongoose from "mongoose";

const PORT = process.env.PORT || 5000;
import { startExpiryChecker } from "./utils/expiryChecker.js";
import { startWeeklyDigest } from "./utils/weeklyDigest.js";

startExpiryChecker();
startWeeklyDigest();


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });
