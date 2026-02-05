import cron from "node-cron";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js";

export const startExpiryChecker = () => {
  cron.schedule("* * * * *", async () => {
    console.log("🔔 Running expiry checker...");

    const today = new Date();
    const warningDate = new Date();
    warningDate.setDate(today.getDate() + 7);

    const products = await Product.find({
      expiryDate: { $lte: warningDate },
    });

    for (const product of products) {
      const message =
        product.expiryDate < today
          ? `❌ ${product.name} has expired`
          : `⚠️ ${product.name} will expire soon`;

      const exists = await Notification.findOne({
        user: product.user,
        product: product._id,
      });

      if (!exists) {
        await Notification.create({
          user: product.user,
          product: product._id,
          message,
        });

        console.log("🔔 Notification created:", message);
      }
    }
  });
};
