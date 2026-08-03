"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";

interface Product {
  _id: string;
  name: string;
  expiryDate: string;
  category?: string;
  imageUrl?: string;
  createdAt?: string;
}

type StatusFilter = "all" | "expiring" | "expired" | "active";
type WeekFilter = "all" | "this" | "next" | "last";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const getWeekRange = (week: WeekFilter): { start: Date; end: Date } | null => {
  if (week === "all") return null;
  const start = startOfToday();
  const end = addDays(start, 6);
  end.setHours(23, 59, 59, 999);
  if (week === "next") {
    start.setDate(start.getDate() + 7);
    end.setDate(end.getDate() + 7);
  } else if (week === "last") {
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() - 7);
  }
  return { start, end };
};

const STATUS_OPTIONS: { value: StatusFilter; label: string; activeClass: string }[] = [
  { value: "all", label: "All products", activeClass: "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" },
  { value: "expiring", label: "Expiring", activeClass: "bg-amber-500 text-white" },
  { value: "expired", label: "Expired", activeClass: "bg-red-500 text-white" },
  { value: "active", label: "Active", activeClass: "bg-emerald-500 text-white" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [week, setWeek] = useState<WeekFilter>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const [bulking, setBulking] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products/list?limit=100`, {
          credentials: "include",
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (data && Array.isArray(data.data)) {
          setProducts(data.data);
        } else {
          setProducts([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filtered = useMemo(() => {
    const today = startOfToday();
    const weekRange = getWeekRange(week);

    return products.filter((p) => {
      const exp = new Date(p.expiryDate);

      if (status === "expired" && exp >= today) return false;
      if (status === "expiring" && (exp < today || exp > addDays(today, 30))) return false;
      if (status === "active" && exp < today) return false;

      if (weekRange && (exp < weekRange.start || exp > weekRange.end)) return false;

      if (from && exp < new Date(`${from}T00:00:00`)) return false;
      if (to && exp > new Date(`${to}T23:59:59.999`)) return false;

      return true;
    });
  }, [products, status, week, from, to]);

  const hasFilters = status !== "all" || week !== "all" || !!from || !!to;

  const expiredCount = useMemo(
    () => products.filter((p) => new Date(p.expiryDate) < startOfToday()).length,
    [products]
  );

  const clearFilters = () => {
    setStatus("all");
    setWeek("all");
    setFrom("");
    setTo("");
  };

  const exportToCSV = async () => {
    setExporting(true);
    setExportError("");
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (week !== "all") params.set("week", week);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const qs = params.toString();

      const res = await fetch(`${API_URL}/api/products/export${qs ? `?${qs}` : ""}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Export failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "products.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
    await fetch(`${API_URL}/api/products/${id}`, { method: "DELETE", credentials: "include" });
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  const refreshProducts = async () => {
    const res = await fetch(`${API_URL}/api/products/list?limit=100`, {
      credentials: "include",
    });
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
  };

  const runBulk = async (action: "expire" | "delete") => {
    const confirmMsg =
      action === "expire"
        ? `Mark ${expiredCount} past-expiry product${expiredCount !== 1 ? "s" : ""} as expired?`
        : `Permanently delete ${expiredCount} expired product${expiredCount !== 1 ? "s" : ""}?`;
    if (!window.confirm(confirmMsg)) return;

    setBulking(true);
    setBulkError("");
    setBulkMessage("");
    try {
      const res = await fetch(
        `${API_URL}/api/products/${action === "expire" ? "bulk/expire" : "bulk/expired"}`,
        {
          method: action === "expire" ? "POST" : "DELETE",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Bulk action failed");
      setBulkMessage(data.message);
      await refreshProducts();
    } catch (error) {
      setBulkError(error instanceof Error ? error.message : "Bulk action failed");
    } finally {
      setBulking(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="skeleton rounded-2xl h-48 relative overflow-hidden">
              <div className="absolute top-4 left-4 w-10 h-10 skeleton rounded-lg"></div>
              <div className="absolute bottom-4 left-4 right-4 space-y-2">
                <div className="h-4 w-3/4 skeleton rounded"></div>
                <div className="h-3 w-1/2 skeleton rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">
            Inventory
          </p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">All Products</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            View, filter and export your tracked products
          </p>
        </div>
        <Link
          href="/add-product"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm transition-all"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mr-1">
              Status
            </span>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  status === opt.value
                    ? opt.activeClass
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Week
              </label>
              <select
                value={week}
                onChange={(e) => setWeek(e.target.value as WeekFilter)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All time</option>
                <option value="this">This week</option>
                <option value="next">Next week</option>
                <option value="last">Last week</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                From
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                To
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "product" : "products"}
            {hasFilters ? " match your filters" : " tracked"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {expiredCount > 0 && (
              <>
                <button
                  onClick={() => runBulk("expire")}
                  disabled={bulking}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-700/40 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mark {expiredCount} expired
                </button>
                <button
                  onClick={() => runBulk("delete")}
                  disabled={bulking}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 dark:text-red-300 dark:bg-red-900/20 dark:border-red-700/40 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {bulking ? "Working..." : `Delete ${expiredCount} expired`}
                </button>
              </>
            )}
            <button
              onClick={exportToCSV}
              disabled={exporting || filtered.length === 0}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        </div>

        {exportError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{exportError}</p>
        )}
        {bulkError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{bulkError}</p>
        )}
        {bulkMessage && (
          <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{bulkMessage}</p>
        )}
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {hasFilters ? "No products match your filters" : "No products found"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {hasFilters
              ? "Try widening the date range or resetting the filters."
              : "Get started by adding your first product."}
          </p>
          {hasFilters ? (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              Reset filters
            </button>
          ) : (
            <Link
              href="/add-product"
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Product
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onDelete={deleteProduct}
              onEdit={(id) => {
                window.location.href = `/edit-product/${id}`;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
