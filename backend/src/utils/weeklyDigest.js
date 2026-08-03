import cron from "node-cron";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { sendEmail } from "../services/email.service.js";
import { startOfToday, addDays } from "./expiryLogic.js";
import { buildDigestHtml } from "./weeklyDigestContent.js";

const DIGEST_WINDOW_DAYS = 7;

export const startWeeklyDigest = () => {
  cron.schedule("0 8 * * 1", async () => {
    console.log("📧 Running weekly expiry digest (Monday 8am)...");

    const start = startOfToday();
    const end = addDays(start, DIGEST_WINDOW_DAYS);
    end.setHours(23, 59, 59, 999);

    const users = await User.find({ "notificationPreferences.email": true });

    for (const user of users) {
      const products = await Product.find({
        user: user._id,
        isExpired: false,
        expiryDate: { $gte: start, $lte: end },
      }).sort({ expiryDate: 1 });

      if (products.length === 0) continue;

      const result = await sendEmail({
        to: user.email,
        subject: "Your weekly ExpiryTracker digest",
        html: buildDigestHtml({
          userName: user.name,
          products,
        }),
      });

      console.log(
        `📧 Weekly digest for ${user.email}: ${result.ok ? "sent" : "failed"} (${products.length} products)${result.error ? ` - ${result.error}` : ""}`
      );
    }
  });
};
