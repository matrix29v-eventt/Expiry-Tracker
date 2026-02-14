"use client";

import { useEffect, useState, useRef } from "react";

interface Notification {
  _id: string;
  message: string;
  type?: "info" | "warning" | "error" | "success";
  createdAt?: string;
}

interface Toast {
  id: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const previousCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleScVZK3a27FmIRlTqt3iuoMrCE+r3+3EejcQZrLk7b5zKxFVrOPvxH44DGGx5e7EeTgOUrDn8cR9Og1gsebxvoE8E1qw6fK/gkITVrHt8sCDPBRasO3ywYM9FVmw7vPBhD4WWbDv9MKFPhZZsPD1w4Y+F1qw8ffEiD8XWbDy+MWIPxdZsPP5xog/F1mw8/rGiD8XWbD0+8aIPxdZsPT7xog/F1mw9PvGiD8XWbD0+8aIPxdZsPT7xog/F1mw9PvGiD8XWbD0+8aIPxdZsPT7xog/F1mw9PvGiD8XWbD0+8aIPxdZsPT7xog/F1mw9PvGiD8XWbD0+8aIPxdZsPT7xog/F1mw9PvGiD8XWbD0+8aIPxdZsPT7xog/F1mw9PvGiD8XWbD0+8aIPxdZsPT7xIg=");

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        setPermissionGranted(true);
      }
    }

    const fetchNotifications = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/notifications`,
          { credentials: "include" }
        );

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const newCount = data.length;
            if (previousCountRef.current > 0 && newCount > previousCountRef.current) {
              const newNotifications = data.slice(0, newCount - previousCountRef.current);
              newNotifications.forEach((n: Notification) => {
                showToast(n);
                if (permissionGranted) {
                  sendBrowserNotification(n.message);
                }
              });
            }
            previousCountRef.current = newCount;
            setNotifications(data);
          }
        }
      } catch {
        // Silently fail
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [permissionGranted]);

  const requestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setPermissionGranted(permission === "granted");
    }
  };

  const sendBrowserNotification = (message: string) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification("Expiry Tracker", {
        body: message,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "expiry-notification",
        requireInteraction: true,
      });
    }
  };

  const showToast = (notification: Notification) => {
    const type = notification.type || "info";
    const id = notification._id || Date.now().toString();
    
    setToasts((prev) => [...prev, { id, message: notification.message, type }]);

    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const getToastStyles = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400";
      case "error":
        return "bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-400";
      case "success":
        return "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400";
      default:
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-400";
    }
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case "warning":
        return "⚠️";
      case "error":
        return "🚨";
      case "success":
        return "✅";
      default:
        return "🔔";
    }
  };

  const getNotificationStyles = (type: string = "info") => {
    switch (type) {
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-200";
      case "error":
        return "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-700 dark:text-red-200";
      case "success":
        return "bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-700 dark:text-green-200";
      default:
        return "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-200";
    }
  };

  if (notifications.length === 0 && !showPanel) return null;

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 animate-slide-in ${getToastStyles(toast.type)}`}
            style={{
              animation: "slideIn 0.3s ease-out",
            }}
          >
            <span className="text-xl animate-bounce">{getToastIcon(toast.type)}</span>
            <p className="font-medium text-sm max-w-xs">{toast.message}</p>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="ml-2 text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Notification Panel */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg mb-6 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 cursor-pointer hover:from-blue-600 hover:to-indigo-700 transition-all"
          onClick={() => setShowPanel(!showPanel)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white text-lg animate-pulse">🔔</span>
              <h3 className="font-semibold text-white">Notifications</h3>
              <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                {notifications.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!permissionGranted && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    requestPermission();
                  }}
                  className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded transition-colors"
                >
                  Enable Alerts
                </button>
              )}
              <svg
                className={`w-5 h-5 text-white transition-transform ${showPanel ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {showPanel && (
          <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <span className="text-4xl mb-2 block">🎉</span>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((n, index) => (
                <div
                  key={n._id || index}
                  className={`p-4 border-l-4 hover:scale-[1.01] transition-transform cursor-pointer ${getNotificationStyles(n.type)}`}
                  onClick={() => showToast(n)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">
                      {n.type === "warning" && "⚠️"}
                      {n.type === "error" && "🚨"}
                      {n.type === "success" && "✅"}
                      {(!n.type || n.type === "info") && "🔔"}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{n.message}</p>
                      {n.createdAt && (
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </>
  );
}
