"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { User } from "@/app/types/auth";
import { apiFetch } from "@/app/lib/api";

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
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

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
        }),
      });
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
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
