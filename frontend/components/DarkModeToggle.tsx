"use client";

import { useEffect, useState, useRef } from "react";

// Enhanced theme management hook
export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        isDark: false,
        systemPreference: "light" as "light" | "dark",
        isTransitioning: false
      };
    }
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "auto";
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const systemPref = systemPrefersDark ? "dark" : "light";
    const effectiveTheme = savedTheme || systemPref;
    const shouldBeDark = effectiveTheme === "dark" || (effectiveTheme === "auto" && systemPrefersDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    }
    
    return {
      isDark: shouldBeDark,
      systemPreference: systemPref,
      isTransitioning: false
    };
  });
  const mediaQueryRef = useRef<MediaQueryList | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "auto";
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const effectiveTheme = savedTheme || (systemPrefersDark ? "dark" : "light");
    const shouldBeDark = effectiveTheme === "dark";
    
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  useEffect(() => {
    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemPref = e.matches ? "dark" : "light";
      setIsDarkMode(prev => {
        if (prev.systemPreference !== newSystemPref) {
          return {
            ...prev,
            systemPreference: newSystemPref,
            isTransitioning: true
          };
        }
        return prev;
      });
    };

    mediaQueryRef.current = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQueryRef.current?.addEventListener("change", handleChange);

    return () => {
      if (mediaQueryRef.current) {
        mediaQueryRef.current.removeEventListener("change", handleChange);
      }
    };
  }, []);

  const toggleTheme = (newTheme?: "light" | "dark") => {
    setIsDarkMode(prev => ({ ...prev, isTransitioning: true }));
    
    setTimeout(() => {
      const resolvedTheme = newTheme || (!isDarkMode.isDark ? "dark" : "light");
      setIsDarkMode(prev => ({
        ...prev,
        isDark: resolvedTheme === "dark",
        isTransitioning: false
      }));
      
      if (resolvedTheme === "dark") {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    }, 300);
  };

  const cleanup = () => {
    if (mediaQueryRef.current) {
      // The cleanup is already handled in the useEffect return
    }
  };

  return {
    isDarkMode: isDarkMode.isDark,
    isTransitioning: isDarkMode.isTransitioning,
    systemPreference: isDarkMode.systemPreference,
    toggleTheme,
    cleanup
  };
}

// Enhanced DarkModeToggle component
export default function DarkModeToggle() {
  const { isDarkMode, isTransitioning, toggleTheme } = useTheme();

  return (
    <button
      onClick={() => toggleTheme()}
      className="group relative p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
      aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
      title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
    >
      <div className="relative w-6 h-6 overflow-hidden">
        <svg
          className={`w-6 h-6 transition-all duration-500 ${
            isTransitioning ? "opacity-50" : "opacity-100"
          } ${isDarkMode ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          {/* Sun icon */}
          <path
            className={`transition-all duration-500 ${
              isDarkMode ? "stroke-slate-400" : "stroke-yellow-500"
            }`}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 4l-2.5 -2.5 0 0 -2.5 0 -2.5 0m6 4l2.5 2.5 0 0 2.5 0 2.5M6 4l2.5 2.5 0 0 2.5 2.5 6"
          />
          
          {/* Moon icon */}
          <path
            className={`transition-all duration-500 absolute inset-0 ${
              isDarkMode ? "stroke-blue-500 opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-180"
            } ${!isDarkMode ? "stroke-slate-400 opacity-0 scale-50 rotate-180" : "opacity-100 scale-0 rotate-0"}
            }`}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"
            strokeWidth={2}
            fill="none"
          />
        </svg>
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-slate-900 dark:bg-slate-100 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        {isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      </div>
    </button>
  );
}