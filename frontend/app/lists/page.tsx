"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/app/lib/api";
import type { PantryList, ListInvite } from "@/app/types/list";

const ROLE_STYLES: Record<string, string> = {
  owner: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50",
  editor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50",
  viewer: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600",
};

export default function ListsPage() {
  const [lists, setLists] = useState<PantryList[]>([]);
  const [invites, setInvites] = useState<ListInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const [listsData, invitesData] = await Promise.all([
        apiFetch("/api/lists"),
        apiFetch("/api/lists/me/invites"),
      ]);
      setLists(Array.isArray(listsData) ? listsData : []);
      setInvites(Array.isArray(invitesData) ? invitesData : []);
    } catch {
      setLists([]);
      setInvites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createList = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setMessage("");
    try {
      await apiFetch("/api/lists", {
        method: "POST",
        body: JSON.stringify({ name: newName.trim() }),
      });
      setNewName("");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create list");
    } finally {
      setCreating(false);
    }
  };

  const acceptInvite = async (token: string) => {
    try {
      await apiFetch("/api/lists/accept-invite", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to accept invite");
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="skeleton rounded-2xl h-32 relative overflow-hidden"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">
          Pantry
        </p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Shared Lists</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">
          Share product lists with family and friends
        </p>
      </div>

      {invites.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl p-5 mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-3">
            Pending invites
          </h2>
          <div className="space-y-3">
            {invites.map((inv) => (
              <div
                key={inv.token}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {inv.listName}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Invited by {inv.invitedBy} as{" "}
                    <span className="font-semibold capitalize">{inv.role}</span>
                  </p>
                </div>
                <button
                  onClick={() => acceptInvite(inv.token)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  Accept Invite
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
          Create a new list
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="e.g. Family pantry, Medicine cabinet"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createList()}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={createList}
            disabled={creating || !newName.trim()}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Creating..." : "Create List"}
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{message}</p>}
      </div>

      {lists.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No shared lists yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Create a list above to start sharing products with family and friends.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lists.map((list) => (
            <Link
              key={list._id}
              href={`/lists/${list._id}`}
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {list.name}
                </h3>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize border ${ROLE_STYLES[list.role] || ROLE_STYLES.viewer}`}
                >
                  {list.role}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {(list.members?.length || 0) + 1} member
                {(list.members?.length || 0) !== 0 ? "s" : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
