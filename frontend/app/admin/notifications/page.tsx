"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AdminNotification } from "@/app/types/admin";
import { apiFetch } from "@/app/lib/api";
import Pagination from "@/components/Pagination";

const channelStyles: Record<string, string> = {
  inapp: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  email: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300",
  whatsapp: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  push: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
};

const typeStyles: Record<string, string> = {
  warning: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  error: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  expiry: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
  info: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (channel) query.set("channel", channel);
        query.set("page", String(page));
        query.set("limit", "20");
        const data = await apiFetch(`/api/admin/notifications?${query}`);
        setNotifications(data.data || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      } catch {
        toast.error("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [channel, page]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} delivery records</p>
        </div>
        <div className="flex gap-2">
          {["", "inapp", "email", "whatsapp", "push"].map((c) => (
            <button
              key={c}
              onClick={() => {
                setChannel(c);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                channel === c
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {c === "" ? "All" : c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 p-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[640px] overflow-y-auto">
          {notifications.map((n) => (
            <div key={n._id} className="px-6 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white break-words">{n.message}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {n.user?.name || "Unknown"} · {n.createdAt ? new Date(n.createdAt).toLocaleString() : "—"}
                </p>
                {n.product && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Product: {n.product.name}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <div className="flex gap-1.5">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${channelStyles[n.channel] || channelStyles.inapp}`}>
                    {n.channel}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${typeStyles[n.type] || typeStyles.info}`}>
                    {n.type}
                  </span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                    n.deliveryStatus === "sent"
                      ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                      : n.deliveryStatus === "failed"
                      ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {n.deliveryStatus}
                </span>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No notifications found</p>
          )}
        </div>
      )}

      <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
    </div>
  );
}
