"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminStats } from "@/app/types/admin";
import { apiFetch } from "@/app/lib/api";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setStats(await apiFetch("/api/admin/stats"));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      }
    };
    load();
  }, []);

  if (error) {
    return <p className="text-red-500 font-semibold text-center py-16">{error}</p>;
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-xl"></div>
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Total Users", value: stats.users, icon: "👥", color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30" },
    { label: "Total Products", value: stats.products, icon: "📦", color: "text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30" },
    { label: "Expired Products", value: stats.expired, icon: "⚠️", color: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30" },
    { label: "Notifications", value: stats.notifications, icon: "🔔", color: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30" },
  ];

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-3">
              <div className={`flex-shrink-0 p-3 rounded-lg ${card.color}`}>
                <span className="text-xl">{card.icon}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Health row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Notifications (7d)</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.notificationsWeek}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Unread in-app</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unread}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-900/40 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Failed deliveries</p>
          <p className={`text-2xl font-bold ${stats.failedDeliveries > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
            {stats.failedDeliveries}
          </p>
        </div>
      </div>

      {/* Recent users & products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Users</h2>
            <Link href="/admin/users" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {stats.recentUsers.map((user) => (
              <div key={user.id} className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
                {user.role === "admin" && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                    ADMIN
                  </span>
                )}
              </div>
            ))}
            {stats.recentUsers.length === 0 && (
              <p className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">No users yet</p>
            )}
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recently Added Products</h2>
            <Link href="/admin/products" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {stats.recentProducts.map((product) => (
              <div key={product._id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    by {product.user?.name || "Unknown"} · {new Date(product.expiryDate).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                    new Date(product.expiryDate) < new Date()
                      ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                      : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                  }`}
                >
                  {new Date(product.expiryDate) < new Date() ? "Expired" : "Active"}
                </span>
              </div>
            ))}
            {stats.recentProducts.length === 0 && (
              <p className="px-6 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">No products yet</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
