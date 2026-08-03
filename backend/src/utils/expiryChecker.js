import cron from "node-cron";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { deliverExpiryNotification } from "../services/notification.service.js";

const THREE_HOURS = 3 * 60 * 60 * 1000;

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfToday = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

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
      const isAlreadyExpired = product.expiryDate < startOfToday();
      const expiringToday =
        product.expiryDate >= startOfToday() && product.expiryDate <= endOfToday();

      let message;
      let notificationType;

      if (isAlreadyExpired) {
        message = `❌ ${product.name} has expired`;
        notificationType = "error";
      } else if (expiringToday) {
        message = `⚠️ ${product.name} expires today`;
        notificationType = "expiry";
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
        channel: "inapp",
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
          type: notificationType,
          channel: "inapp",
          deliveryStatus: "sent",
          deliveredAt: now,
        });

        console.log("🔔 In-app notification created:", message);
      }

      /* ----- Single day-of-expiry delivery (email / WhatsApp) ----- */
      const shouldDeliverExternally = (expiringToday || isAlreadyExpired) && !product.expiryNotificationSent;

      if (shouldDeliverExternally) {
        const user = await User.findById(product.user);

        if (user) {
          const results = await deliverExpiryNotification({
            user,
            product,
            message: `📦 ${product.name} ${isAlreadyExpired ? "has expired" : "expires today"}`,
          });

          for (const result of results) {
            console.log(
              `📤 ${result.channel} delivery ${result.ok ? "sent" : "failed"} for "${product.name}": ${result.error || "ok"}`
            );
          }
        }

        product.expiryNotificationSent = true;
        await product.save();
      }

      if (isAlreadyExpired && !product.isExpired) {
        product.isExpired = true;
        await product.save();
        console.log(`📦 Product marked as expired: ${product.name}`);
      }
    }
  });
};
