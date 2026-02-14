"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const DarkModeToggle = dynamic(
  () => import("./DarkModeToggle"),
  { ssr: false }
);

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check token on client side
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = document.cookie
          .split("; ")
          .find(row => row.startsWith("token="));
        setIsLoggedIn(!!token);
      } catch {
        setIsLoggedIn(false);
      }
    };

    // Use setTimeout to avoid setState in effect
    const timeoutId = setTimeout(checkAuth, 0);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const avatar = (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-blue-300 text-white font-bold text-lg shadow border-2 border-white ml-3">
      ET
    </span>
  );

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-gray-100">
              ExpiryTracker
            </span>
          </Link>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center space-x-1">
          <Link 
            href="/dashboard" 
            className="px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Dashboard
          </Link>

          <Link 
            href="/products" 
            className="px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Products
          </Link>

          <Link
            href="/add-product"
            className="px-3 py-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all font-medium flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {!isLoggedIn ? (
            <>
              <Link 
                href="/login" 
                className="px-4 py-2 rounded-lg text-blue-600 bg-blue-50 dark:bg-blue-900/50 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/70 transition-colors font-medium"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors font-medium"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <Link 
                href="/logout" 
                className="px-4 py-2 rounded-lg text-red-600 bg-red-50 dark:bg-red-900/50 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/70 transition-colors font-medium"
              >
                Logout
              </Link>
              {avatar}
            </>
          )}

          <DarkModeToggle />
        </div>
      </div>
        </div>
      </div>
    </nav>
  );
}
