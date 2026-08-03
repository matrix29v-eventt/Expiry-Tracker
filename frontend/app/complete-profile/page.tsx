"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { apiFetch } from "@/app/lib/api";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("91");
  const [prefWhatsApp, setPrefWhatsApp] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch("/api/users/me");
        setName(data.name);
        setEmail(data.email);
        setPhone(data.phone || "");
        setCountryCode(data.countryCode || "91");
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
    const digits = phone.replace(/\D/g, "");
    if (prefWhatsApp && digits.length < 7) {
      toast.error("Enter a valid phone number to enable WhatsApp alerts");
      return;
    }

    setSaving(true);
    try {
      await apiFetch("/api/users/me", {
        method: "PUT",
        body: JSON.stringify({
          phone,
          countryCode,
          notificationPreferences: { email: true, whatsapp: prefWhatsApp },
        }),
      });
      toast.success("Profile completed. Welcome aboard!");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
      setSaving(false);
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
        <div className="text-center mb-6">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h13a2 2 0 012 2v10a2 2 0 01-2 2h-7.5L6 21v-4H5a2 2 0 01-2-2V5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Complete your profile, {name.split(" ")[0]}!
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Add your phone number to receive expiry reminders on WhatsApp.
            You can skip this and set it up later in Settings.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Phone number</label>
            <div className="grid grid-cols-[100px_1fr] gap-3">
              <input
                type="text"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.replace(/[^\d+]/g, ""))}
                placeholder="+91"
                className="w-full px-3 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white text-center"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-slate-700 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 cursor-pointer">
            <input
              type="checkbox"
              checked={prefWhatsApp}
              onChange={(e) => setPrefWhatsApp(e.target.checked)}
              className="h-5 w-5 text-green-600 focus:ring-green-500 border-slate-300 dark:border-slate-600 rounded"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Send me a WhatsApp reminder on the day a product expires
            </span>
          </label>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 px-4 rounded-xl text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 font-semibold shadow-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save & continue"}
          </button>

          <div className="text-center">
            <button onClick={handleSkip} className="text-sm text-slate-500 dark:text-slate-400 hover:underline">
              Skip for now
            </button>
          </div>

          <p className="text-xs text-center text-slate-400 dark:text-slate-500">
            WhatsApp alerts use the official Meta WhatsApp Cloud API. Standard rates may apply.
          </p>
        </div>
      </div>
    </div>
  );
}
