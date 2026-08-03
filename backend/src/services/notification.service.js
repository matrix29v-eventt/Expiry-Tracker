import Notification from "../models/Notification.js";
import { sendEmail } from "./email.service.js";
import { sendPushNotification } from "./push.service.js";

/* ------------------------------------------------------------------ */
/*  Email (Gmail app password via SMTP)                                 */
/* ------------------------------------------------------------------ */

const buildEmailHtml = ({ productName, expiryDate, category }) => {
  const date = expiryDate
    ? new Date(expiryDate).toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f6fb;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:24px 32px;">
          <h1 style="color:#ffffff;margin:0;font-size:22px;">⏰ Expiry Reminder</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:#374151;font-size:15px;line-height:1.6;">Hi there,</p>
          <p style="color:#374151;font-size:15px;line-height:1.6;">
            This is a one-time reminder that one of your tracked items is expiring today.
          </p>
          <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:8px;padding:16px 20px;margin:24px 0;">
            <p style="margin:0 0 4px;font-size:13px;color:#92400e;font-weight:bold;">EXPIRING TODAY</p>
            <p style="margin:0;font-size:18px;color:#111827;font-weight:bold;">${productName}</p>
            ${category ? `<p style="margin:8px 0 0;font-size:13px;color:#78350f;">Category: ${category}</p>` : ""}
            ${date ? `<p style="margin:4px 0 0;font-size:14px;color:#78350f;">Expiry date: ${date}</p>` : ""}
          </div>
          <p style="color:#6b7280;font-size:13px;line-height:1.6;">
            Log in to ExpiryTracker to use or dispose of this item before it goes bad.
          </p>
          <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard"
             style="display:inline-block;margin-top:8px;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:bold;">
            Open Dashboard
          </a>
        </div>
        <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">You received this because your notification preferences are set to email. Manage them anytime in Settings.</p>
        </div>
      </div>
    </div>
  `;
};

export const sendExpiryEmail = async ({ to, productName, expiryDate, category }) => {
  return sendEmail({
    to,
    subject: `⚠️ ${productName} expires today!`,
    html: buildEmailHtml({ productName, expiryDate, category }),
  });
};

/* ------------------------------------------------------------------ */
/*  WhatsApp (Meta WhatsApp Cloud API)                                  */
/* ------------------------------------------------------------------ */

export const normalizePhone = (phone, countryCode) => {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (!digits) return "";

  const cc = String(countryCode || "").replace(/\D/g, "");
  if (cc && !digits.startsWith(cc)) {
    digits = cc + digits;
  }
  return digits;
};

export const sendExpiryWhatsApp = async ({ to, productName, expiryDate }) => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { ok: false, error: "WhatsApp API not configured" };
  }

  const date = expiryDate
    ? new Date(expiryDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const text = [
    "⚠️ *EXPIRY REMINDER*",
    "",
    `*${productName}* expires today${date ? ` (${date})` : ""}.`,
    "Please use or dispose of it before it goes bad.",
    "",
    "— ExpiryTracker",
  ].join("\n");

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text },
        }),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error("[notification.service] WhatsApp send failed:", body);
      return { ok: false, error: `WhatsApp API error ${response.status}` };
    }

    return { ok: true };
  } catch (error) {
    console.error("[notification.service] WhatsApp send failed:", error.message);
    return { ok: false, error: error.message };
  }
};

/* ------------------------------------------------------------------ */
/*  Orchestration                                                       */
/* ------------------------------------------------------------------ */

export const userChannels = (user) => {
  const prefs = user.notificationPreferences || { email: true, whatsapp: false };
  const channels = [];

  if (prefs.email && user.email) channels.push("email");
  if (prefs.whatsapp && user.phone) {
    if (normalizePhone(user.phone, user.countryCode)) channels.push("whatsapp");
  }
  if (user.pushSubscriptions && user.pushSubscriptions.length > 0) channels.push("push");

  return channels;
};

/**
 * Sends the day-of-expiry notification through every channel the user
 * enabled. Records one Notification row per channel with delivery status.
 * Returns [{ channel, ok, error }].
 */
export const deliverExpiryNotification = async ({ user, product, message }) => {
  const channels = userChannels(user);
  if (channels.length === 0) {
    return [{ channel: "none", ok: false, error: "No delivery channel enabled" }];
  }

  const results = [];
  const waNumber = normalizePhone(user.phone, user.countryCode);
  const dashboardUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard`;

  for (const channel of channels) {
    let result;

    if (channel === "email") {
      result = await sendExpiryEmail({
        to: user.email,
        productName: product.name,
        expiryDate: product.expiryDate,
        category: product.category,
      });
    } else if (channel === "whatsapp") {
      result = await sendExpiryWhatsApp({
        to: waNumber,
        productName: product.name,
        expiryDate: product.expiryDate,
      });
    } else {
      result = await sendPushNotification({
        user,
        title: message,
        body: product.category
          ? `Category: ${product.category}. Tap to open ExpiryTracker.`
          : "Tap to open ExpiryTracker.",
        url: dashboardUrl,
      });
    }

    results.push({ channel, ok: result.ok, error: result.error });

    await Notification.create({
      user: user._id,
      product: product._id,
      message,
      type: "expiry",
      channel,
      deliveryStatus: result.ok ? "sent" : "failed",
      deliveredAt: result.ok ? new Date() : undefined,
    });
  }

  return results;
};
