"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/app/types/auth";
import { ApiResponse } from "@/app/types/api";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: ""
  });

  const [passwordError, setPasswordError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    
    // Validate password when it changes
    if (e.target.name === 'password') {
      const password = e.target.value;
      if (password && password.length < 8) {
        setPasswordError("Password must be at least 8 characters long");
      } else {
        setPasswordError("");
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }
    
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    if (!form.email.includes('@') || !form.email.includes('.')) {
      setError("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include"
      });

      const data: ApiResponse = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 p-4">
      <div className="w-full max-w-md">
        {/* Theme Toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => document.documentElement.classList.toggle('dark')}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 group"
            title="Toggle theme"
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 0018 6.646l-1.647-1.647a.5.5 0 00-.708-.708L4.293 4.293a.5.5 0 00.707.293l6.646 6.647a.5.5 0 00.708.708l-1.647 1.647zm-1.646 5.646l-6.647-6.647a.5.5 0 00-.707-.293l-9-9a.5.5 0 00-.707.293L7.05 7.05a.5.5 0 00.708-.294l3 3.001a.5.5 0 00.708-.708z" />
            </svg>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Welcome back
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Sign in to your account to continue tracking expiry dates
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-xl mb-6 glass">
                <p className="text-sm text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 9h4.01m-4.01 0H4a2 2 0 00-2 2v12c0 1.11.89 2 2h12a2 2 0 002-2V10a2 2 0 00-2-2H6a2 2 0 00-2 2v12c0 1.11.89 2 2z" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Email address
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-3 pl-12 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white text-slate-900 dark:text-white transition-all duration-200 placeholder-slate-500 dark:placeholder-slate-400 hover:border-blue-400 dark:hover:border-blue-500 focus:scale-105 transform"
                    placeholder="you@example.com"
                    onChange={handleChange}
                    value={form.email}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    minLength={8}
                    className={`w-full px-4 py-3 pl-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white text-slate-900 dark:text-white transition-all duration-200 placeholder-slate-500 dark:placeholder-slate-400 hover:border-blue-400 dark:hover:border-blue-500 focus:scale-105 transform ${
                      passwordError 
                        ? 'border-red-500 dark:border-red-400 focus:ring-red-500' 
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                    placeholder="Enter your password (min 8 characters)"
                    onChange={handleChange}
                    value={form.password}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 00-2v6a2 2 0 00-2 2v12a2.2.5 0 00-.708-.708L4.293 4.293a.5.5 0 00-.708-.708z" />
                    </svg>
                  </div>
                </div>
                {passwordError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M12 9h4.01m-4.01 0H4a2 2 0 00-2 2v12c0 1.11.89 2 2h12a2 2 0 002-2V10a2 2 0 00-2-2H6a2 2 0 00-2 2v12c0 1.11.89 2 2z" />
                    </svg>
                    {passwordError}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Must be at least 8 characters long
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded dark:focus:ring-offset-2"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors">
                    Forgot password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:scale-105 transform"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    "Sign in to ExpiryTracker"
                  )}
                </button>
              </div>
            </form>

            <div className="text-center mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors ml-1">
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
