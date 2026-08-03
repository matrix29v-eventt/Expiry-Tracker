"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { User } from "@/app/types/auth";
import { apiFetch } from "@/app/lib/api";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("91");
  const [prefEmail, setPrefEmail] = useState(true);
  const [prefWhatsApp, setPrefWhatsApp] = useState(false);
  const [warningDays, setWarningDays] = useState(7);
  const [notifyOnExpiryDay, setNotifyOnExpiryDay] = useState(true);

  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState("");

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch("/api/users/me");
        setUser(data);
        setName(data.name);
        setPhone(data.phone || "");
        setCountryCode(data.countryCode || "91");
        setPrefEmail(data.notificationPreferences?.email ?? true);
        setPrefWhatsApp(data.notificationPreferences?.whatsapp ?? false);
        setWarningDays(data.reminderPreferences?.warningDays ?? 7);
        setNotifyOnExpiryDay(data.reminderPreferences?.notifyOnExpiryDay ?? true);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }
    setPushSupported(true);
    navigator.serviceWorker
      .getRegistration("/sw.js")
      .then((reg) => {
        if (!reg) return;
        return reg.pushManager.getSubscription();
      })
      .then((sub) => {
        if (sub) setPushEnabled(true);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (prefWhatsApp) {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 7) {
        toast.error("Enter a valid phone number to receive WhatsApp alerts");
        return;
      }
    }

    setSaving(true);
    try {
      await apiFetch("/api/users/me", {
        method: "PUT",
        body: JSON.stringify({
          name,
          phone,
          countryCode,
          notificationPreferences: { email: prefEmail, whatsapp: prefWhatsApp },
          reminderPreferences: { warningDays, notifyOnExpiryDay },
        }),
      });
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePush = async () => {
    if (!pushSupported) return;
    setPushBusy(true);
    setPushError("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushError("Notification permission denied");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setPushError("VAPID public key not configured");
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await apiFetch("/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify(subscription),
      });

      setPushEnabled(true);
      toast.success("Push notifications enabled");
    } catch (error) {
      setPushError(error instanceof Error ? error.message : "Failed to enable push");
    } finally {
      setPushBusy(false);
    }
  };

  const handleDisablePush = async () => {
    setPushBusy(true);
    setPushError("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await apiFetch("/api/push/unsubscribe", {
          method: "DELETE",
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setPushEnabled(false);
      toast.success("Push notifications disabled");
    } catch (error) {
      setPushError(error instanceof Error ? error.message : "Failed to disable push");
    } finally {
      setPushBusy(false);
    }
  };

  const handleTestNotification = async () => {
    setTesting(true);
    setTestResult("");
    try {
      const data = await apiFetch("/api/users/me/test-notification", {
        method: "POST",
      });
      const results = (data.results || []) as { channel: string; ok: boolean; error?: string }[];
      if (results.length === 0) {
        setTestResult("No delivery channels enabled. Enable email, WhatsApp or push first.");
        return;
      }
      const okCount = results.filter((r) => r.ok).length;
      const failed = results.filter((r) => !r.ok);
      if (failed.length === 0) {
        setTestResult(`Test notification sent successfully on ${results.map((r) => r.channel).join(", ")}.`);
      } else {
        setTestResult(
          `${okCount} of ${results.length} channel${results.length !== 1 ? "s" : ""} delivered. ${failed
            .map((f) => `${f.channel}: ${f.error || "failed"}`)
            .join(" · ")}`
        );
      }
    } catch (error) {
      setTestResult(error instanceof Error ? error.message : "Failed to send test notification");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">Settings</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">
          Manage your profile and how you receive expiry alerts.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Country code</label>
              <input
                type="text"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.replace(/[^\d+]/g, ""))}
                placeholder="91"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Phone number <span className="text-gray-400 font-normal">(for WhatsApp)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </section>

        {/* Notification preferences */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Expiry Alerts</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            You&apos;ll receive a single notification on the day a product expires, through every channel you enable.
          </p>

          <div className="space-y-4">
            <label className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div>
                <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email notification
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sent to {user?.email || "your email"}</p>
              </div>
              <input
                type="checkbox"
                checked={prefEmail}
                onChange={(e) => setPrefEmail(e.target.checked)}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
            </label>

            <label className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div>
                <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h13a2 2 0 012 2v10a2 2 0 01-2 2h-7.5L6 21v-4H5a2 2 0 01-2-2V5z" />
                  </svg>
                  WhatsApp notification
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {prefWhatsApp
                    ? phone
                      ? `Sent to +${countryCode.replace(/\D/g, "")} ${phone}`
                      : "Add a phone number above to enable"
                    : "Get an instant WhatsApp message on expiry day"}
                </p>
              </div>
              <input
                type="checkbox"
                checked={prefWhatsApp}
                onChange={(e) => setPrefWhatsApp(e.target.checked)}
                className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
              />
            </label>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleTestNotification}
              disabled={testing}
              className="inline-flex items-center px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {testing ? "Sending..." : "Send test notification"}
            </button>
            {testResult && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{testResult}</p>
            )}
          </div>
        </section>

        {/* Reminder schedule */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Reminder Schedule</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Choose how early you want to be warned before a product expires.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="warningDays" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Warn me before expiry
              </label>
              <select
                id="warningDays"
                value={warningDays}
                onChange={(e) => setWarningDays(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[1, 3, 7, 14, 30].map((days) => (
                  <option key={days} value={days}>
                    {days} day{days !== 1 ? "s" : ""} before
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center justify-between gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors sm:self-end">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Notify on expiry day</div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Email / WhatsApp / push on the day itself</p>
              </div>
              <input
                type="checkbox"
                checked={notifyOnExpiryDay}
                onChange={(e) => setNotifyOnExpiryDay(e.target.checked)}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
            </label>
          </div>
        </section>

        {/* Browser push */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Browser Notifications</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Get alerts right in your browser, even when the app is closed.
          </p>

          {pushSupported ? (
            <div>
              {pushEnabled ? (
                <button
                  onClick={handleDisablePush}
                  disabled={pushBusy}
                  className="inline-flex items-center px-4 py-2.5 rounded-lg border border-red-200 dark:border-red-900/50 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  {pushBusy ? "Working..." : "Disable browser notifications"}
                </button>
              ) : (
                <button
                  onClick={handleEnablePush}
                  disabled={pushBusy}
                  className="inline-flex items-center px-4 py-2.5 rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-sm font-semibold shadow-sm disabled:opacity-50"
                >
                  {pushBusy ? "Working..." : "Enable browser notifications"}
                </button>
              )}
              {pushError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{pushError}</p>}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your browser doesn&apos;t support web push notifications.
            </p>
          )}
        </section>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-6 py-3 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
