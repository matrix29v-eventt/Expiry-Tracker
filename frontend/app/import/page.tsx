"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ImportPage() {
  const router = useRouter();
  const [products, setProducts] = useState<{ name: string; expiryDate: string; category: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").slice(1); // Skip header
      const parsed = lines
        .map((line) => {
          const [name, category, expiryDate] = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
          if (name && expiryDate) {
            return { name, category, expiryDate: new Date(expiryDate).toISOString().split("T")[0] };
          }
          return null;
        })
        .filter(Boolean) as { name: string; expiryDate: string; category: string }[];
      setProducts(parsed);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (products.length === 0) {
      toast.error("No products to import");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ products }),
      });

      if (res.ok) {
        toast.success(`Imported ${products.length} products!`);
        router.push("/dashboard");
      } else {
        toast.error("Import failed");
      }
    } catch {
      toast.error("Error importing products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Import Products</h1>
          <p className="text-slate-600 dark:text-slate-300">Import products from a CSV file</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-300 dark:border-slate-600"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Drag and drop a CSV file here, or
            </p>
            <label className="mt-4 inline-block">
              <span className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                Browse Files
              </span>
              <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </label>
          </div>

          {products.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                {products.length} products ready to import:
              </h3>
              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Category</th>
                      <th className="px-4 py-2 text-left">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {products.slice(0, 10).map((p, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2">{p.name}</td>
                        <td className="px-4 py-2">{p.category}</td>
                        <td className="px-4 py-2">{p.expiryDate}</td>
                      </tr>
                    ))}
                    {products.length > 10 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-center text-slate-500">
                          ...and {products.length - 10} more
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleImport}
                disabled={loading}
                className="mt-4 w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? "Importing..." : `Import ${products.length} Products`}
              </button>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">CSV Format</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Name,Category,Expiry Date<br />
              Milk,Food,2025-12-31<br />
              Medicine,Medicine,2025-06-15
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
