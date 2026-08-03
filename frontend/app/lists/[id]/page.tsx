"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { apiFetch } from "@/app/lib/api";
import type { PantryList, ListRole } from "@/app/types/list";

interface Product {
  _id: string;
  name: string;
  expiryDate: string;
  category?: string;
  quantity?: number;
  unit?: string;
  imageUrl?: string;
  createdAt?: string;
}

const CATEGORIES = [
  "Food & Beverages",
  "Medicine",
  "Cosmetics",
  "Household",
  "Electronics",
  "Clothing",
  "Other",
];

const ROLE_STYLES: Record<ListRole, string> = {
  owner: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50",
  editor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50",
  viewer: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600",
};

export default function ListDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [list, setList] = useState<PantryList | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Add product form
  const [name, setName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [saving, setSaving] = useState(false);

  // Share controls
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviting, setInviting] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const [listData, productsData] = await Promise.all([
        apiFetch(`/api/lists/${id}`),
        apiFetch(`/api/lists/${id}/products`),
      ]);
      setList(listData);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load list");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const join = new URLSearchParams(window.location.search).get("join");
    (async () => {
      try {
        if (join) {
          await apiFetch(`/api/lists/${id}/join`, {
            method: "POST",
            body: JSON.stringify({ token: join }),
          });
          window.history.replaceState({}, "", window.location.pathname);
        }
      } catch {
        // fall through to load; join errors will surface there
      }
      await load();
    })();
  }, [id, load]);

  const canEdit = list && (list.role === "owner" || list.role === "editor");
  const isOwner = list?.role === "owner";

  const addProduct = async () => {
    if (!name || !expiryDate) return;
    setSaving(true);
    setMessage("");
    try {
      await apiFetch(`/api/lists/${id}/products`, {
        method: "POST",
        body: JSON.stringify({
          name,
          expiryDate,
          category,
          quantity: parseInt(quantity, 10) || 1,
          unit,
        }),
      });
      setName("");
      setExpiryDate("");
      setCategory("");
      setQuantity("1");
      setUnit("");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to add product");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!window.confirm("Delete this product from the list?")) return;
    try {
      await apiFetch(`/api/lists/${id}/products/${productId}`, {
        method: "DELETE",
      });
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to delete product");
    }
  };

  const inviteMember = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setMessage("");
    try {
      await apiFetch(`/api/lists/${id}/invite`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      setInviteEmail("");
      setMessage("Invite sent");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const copyShareLink = async () => {
    try {
      const data = await apiFetch(`/api/lists/${id}/share-link`, {
        method: "POST",
      });
      setShareUrl(data.shareUrl);
      await navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to create share link");
    }
  };

  const changeRole = async (userId: string, role: string) => {
    try {
      await apiFetch(`/api/lists/${id}/members/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      });
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to update role");
    }
  };

  const removeMember = async (userId: string) => {
    if (!window.confirm("Remove this member from the list?")) return;
    try {
      await apiFetch(`/api/lists/${id}/members/${userId}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to remove member");
    }
  };

  const cancelInvite = async (email: string) => {
    try {
      await apiFetch(`/api/lists/${id}/invites/${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to cancel invite");
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="skeleton rounded-2xl h-40 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton rounded-2xl h-48"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">List unavailable</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || "List not found"}</p>
          <Link
            href="/lists"
            className="inline-flex px-4 py-2 rounded-lg text-sm font-semibold text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          >
            Back to Lists
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/lists" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{list.name}</h1>
            <span className={`inline-flex mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${ROLE_STYLES[list.role]}`}>
              {list.role}
            </span>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={async () => {
              if (!window.confirm("Delete this list and all its products?")) return;
              await apiFetch(`/api/lists/${id}`, { method: "DELETE" });
              window.location.href = "/lists";
            }}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 dark:text-red-300 dark:bg-red-900/20 dark:border-red-700/40 transition-colors"
          >
            Delete List
          </button>
        )}
      </div>

      {message && (
        <p className="mb-4 text-sm text-emerald-600 dark:text-emerald-400">{message}</p>
      )}

      {isOwner && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
            Share this list
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Invite by email
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="family@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  onClick={inviteMember}
                  disabled={inviting || !inviteEmail.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviting ? "Sending..." : "Invite"}
                </button>
              </div>

              {list.invites && list.invites.length > 0 && (
                <div className="mt-4 space-y-2">
                  {list.invites.map((inv) => (
                    <div key={inv.email} className="flex items-center justify-between text-sm bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                      <span className="text-gray-700 dark:text-gray-300">
                        {inv.email}{" "}
                        <span className="text-gray-400 capitalize">({inv.role})</span>
                      </span>
                      <button
                        onClick={() => cancelInvite(inv.email)}
                        className="text-red-600 dark:text-red-400 hover:underline text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                Share link (anyone with the link can join as viewer)
              </label>
              <button
                onClick={copyShareLink}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/30 dark:border-indigo-800/50 transition-colors"
              >
                {copied ? "Copied!" : "Copy share link"}
              </button>
              {shareUrl && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 break-all">{shareUrl}</p>
              )}
            </div>
          </div>

          {list.members && list.members.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                Members
              </h3>
              <div className="space-y-2">
                {list.members.map((m) => (
                  <div key={m.user._id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{m.user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.user.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={m.role}
                        onChange={(e) => changeRole(m.user._id, e.target.value)}
                        className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => removeMember(m.user._id)}
                        className="text-red-600 dark:text-red-400 hover:underline text-xs font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {canEdit && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
            Add product to list
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                placeholder="Qty"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={addProduct}
            disabled={saving || !name || !expiryDate}
            className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Adding..." : "Add Product"}
          </button>
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No products yet</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {canEdit ? "Add the first product to this list." : "The owner hasn't added products to this list yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              readOnly={!canEdit}
              onDelete={deleteProduct}
              onEdit={(productId) => {
                window.location.href = `/edit-product/${productId}`;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
