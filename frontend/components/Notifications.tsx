"use client";

import { useEffect, useState } from "react";

interface Notification {
  _id: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
          credentials: "include",
        });
        
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setNotifications(data);
          }
        }
      } catch {
        // Silently fail if notifications can't be fetched
      }
    };

    fetchNotifications();
  }, []);

  if (notifications.length === 0) return null;

  const getNotificationStyles = (type: string = 'info') => {
    switch (type) {
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm mb-6 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-white text-lg">🔔</span>
          <h3 className="font-semibold text-white">Notifications</h3>
          <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
            {notifications.length}
          </span>
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {notifications.map((n, index) => (
          <div 
            key={n._id || index} 
            className={`p-4 border-l-4 ${getNotificationStyles(n.type)} transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50`}
          >
            <div className="flex items-start gap-3">
              <span className="text-sm font-medium">
                {n.type === 'warning' && '⚠️'}
                {n.type === 'error' && '❌'}
                {n.type === 'success' && '✅'}
                {(!n.type || n.type === 'info') && 'ℹ️'}
              </span>
              <p className="text-sm flex-1 leading-relaxed">{n.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
