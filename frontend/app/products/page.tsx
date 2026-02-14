"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";

interface Product {
  _id: string;
  name: string;
  expiryDate: string;
  category?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/list`,
        {
          credentials: "include", // 🔴 JWT cookie
        }
      );

      const data = await res.json();

      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }

      setLoading(false);
    };

    fetchProducts();
  }, []);

  if (loading) return <div className="p-6"><p className="text-slate-600 dark:text-slate-400">Loading products...</p></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">All Products</h1>
        <p className="text-slate-600 dark:text-slate-400">View and manage all your tracked products</p>
      </div>

      {products.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No products found</h3>
          <p className="text-slate-600 dark:text-slate-400">Get started by adding your first product.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onDelete={() => {}} // no delete here
            />
          ))}
        </div>
      )}
    </div>
  );
}
