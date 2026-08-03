import cron from "node-cron";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { deliverExpiryNotification } from "../services/notification.service.js";
import { classifyExpiry, daysUntil } from "./expiryLogic.js";

const THREE_HOURS = 3 * 60 * 60 * 1000;
const MAX_WARNING_DAYS = 30; // matches reminderPreferences.warningDays max

export const startExpiryChecker = () => {
  cron.schedule("0 */3 * * *", async () => {
    console.log("🔔 Running expiry checker (every 3 hours)...");

    const now = new Date();
    const maxWarningWindow = new Date();
    maxWarningWindow.setDate(now.getDate() + MAX_WARNING_DAYS);

    const products = await Product.find({
      isExpired: false,
      expiryDate: { $lte: maxWarningWindow },
    });

    for (const product of products) {
      const user = await User.findById(product.user);

      // Per-user reminder schedule.
      const warningDays = user?.reminderPreferences?.warningDays ?? 7;
      const notifyOnExpiryDay = user?.reminderPreferences?.notifyOnExpiryDay ?? true;

      const status = classifyExpiry(product.expiryDate, now);
      const isAlreadyExpired = status === "expired";
      const expiringToday = status === "expiringToday";
      const daysLeft = daysUntil(product.expiryDate, now);

      let message;
      let notificationType;

      if (isAlreadyExpired) {
        message = `❌ ${product.name} has expired`;
        notificationType = "error";
      } else if (expiringToday) {
        message = `⚠️ ${product.name} expires today`;
        notificationType = "expiry";
      } else {
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

      // Only create the in-app warning once we're inside the user's window.
      const insideWarningWindow =
        expiringToday || isAlreadyExpired || daysLeft <= warningDays;

      if (shouldNotify && insideWarningWindow) {
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

      /* ----- Single day-of-expiry delivery (email / WhatsApp / push) ----- */
      const shouldDeliverExternally =
        (expiringToday || isAlreadyExpired) &&
        notifyOnExpiryDay &&
        !product.expiryNotificationSent;

      if (shouldDeliverExternally) {
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
