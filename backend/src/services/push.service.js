import webpush from "web-push";

let vapidConfigured = false;

const ensureVapid = () => {
  if (vapidConfigured) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    console.warn("[push.service] VAPID keys not configured. Set VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY.");
    return false;
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:no-reply@expirytracker.app",
    publicKey,
    privateKey
  );
  vapidConfigured = true;
  return true;
};

/**
 * Sends a push notification to every subscription registered by the user.
 * Dead subscriptions (404/410) are dropped from the user record.
 * Resolves `{ ok }` where ok is true if at least one device received it.
 */
export const sendPushNotification = async ({ user, title, body, url }) => {
  if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) {
    return { ok: false, error: "No push subscriptions" };
  }

  if (!ensureVapid()) {
    return { ok: false, error: "VAPID not configured" };
  }

  const payload = JSON.stringify({ title, body, url });
  const results = [];
  let delivered = false;

  for (const sub of user.pushSubscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
        },
        payload,
        { TTL: 60 * 60 * 24 }
      );
      results.push({ ok: true });
      delivered = true;
    } catch (error) {
      const isGone = error.statusCode === 404 || error.statusCode === 410;
      if (isGone) {
        user.pushSubscriptions.pull({ endpoint: sub.endpoint });
        await user.save();
        results.push({ ok: false, error: "subscription removed" });
      } else {
        console.error("[push.service] Push send failed:", error.message);
        results.push({ ok: false, error: error.message });
      }
    }
  }

  return { ok: delivered, results, error: delivered ? undefined : "All push deliveries failed" };
};
