import cron from "node-cron";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js";

const THREE_HOURS = 3 * 60 * 60 * 1000;

export const startExpiryChecker = () => {
  cron.schedule("0 */3 * * *", async () => {
    console.log("🔔 Running expiry checker (every 3 hours)...");

    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(now.getDate() + 7);

    const products = await Product.find({
      isExpired: false,
      expiryDate: { $lte: warningDate },
    });

    for (const product of products) {
      const isAlreadyExpired = product.expiryDate < now;
      let message;
      let notificationType;

      if (isAlreadyExpired) {
        message = `❌ ${product.name} has expired`;
        notificationType = "expired";
      } else {
        const daysLeft = Math.ceil(
          (product.expiryDate - now) / (1000 * 60 * 60 * 24)
        );
        message = `⚠️ ${product.name} will expire in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
        notificationType = "warning";
      }

      const lastNotification = await Notification.findOne({
        user: product.user,
        product: product._id,
      })
        .sort({ createdAt: -1 })
        .limit(1);

      let shouldNotify = true;

      if (lastNotification) {
        const hoursSinceLastNotification =
          (now - lastNotification.createdAt) / THREE_HOURS;
        if (hoursSinceLastNotification < 3) {
          shouldNotify = false;
        }
      }

      if (shouldNotify) {
        await Notification.create({
          user: product.user,
          product: product._id,
          message,
        });

        console.log("🔔 Notification created:", message);
      }

      if (isAlreadyExpired && !product.isExpired) {
        product.isExpired = true;
        await product.save();
        console.log(`📦 Product marked as expired: ${product.name}`);
      }
    }
  });
};
