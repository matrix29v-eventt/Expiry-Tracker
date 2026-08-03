"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AdminUser } from "@/app/types/admin";
import { apiFetch } from "@/app/lib/api";
import Pagination from "@/components/Pagination";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (p: number) => {
    try {
      const data = await apiFetch(`/api/admin/users?page=${p}&limit=20`);
      setUsers(data.data || []);
      setTotal(data.total || 0);
      setPage(data.page || p);
      setPages(data.pages || 1);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const changeRole = async (user: AdminUser, role: "user" | "admin") => {
    try {
      await apiFetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      });
      toast.success(`${user.name} is now ${role}`);
      load(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update role");
    }
  };

  const deleteUser = async (user: AdminUser) => {
    if (!confirm(`Delete ${user.name} and all their data? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      toast.success("User deleted");
      load(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Users</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} registered</p>
        </div>
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-3 font-medium">User</th>
              <th className="px-6 py-3 font-medium">Phone</th>
              <th className="px-6 py-3 font-medium">Products</th>
              <th className="px-6 py-3 font-medium">Joined</th>
              <th className="px-6 py-3 font-medium">Role</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3 text-gray-600 dark:text-gray-300">
                  {user.phone ? `+${user.countryCode || ""} ${user.phone}` : "—"}
                </td>
                <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{user.productCount}</td>
                <td className="px-6 py-3 text-gray-600 dark:text-gray-300">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-6 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => changeRole(user, e.target.value as "user" | "admin")}
                    className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-medium"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-3 text-right">
                  <button
                    onClick={() => deleteUser(user)}
                    className="px-3 py-1.5 rounded-lg text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pages={pages} total={total} onPageChange={load} />
    </div>
  );
}
