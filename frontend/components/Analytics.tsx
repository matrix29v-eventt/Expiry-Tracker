"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Product {
  _id: string;
  name: string;
  expiryDate: string;
  category?: string;
  createdAt?: string;
}

interface AnalyticsProps {
  products: Product[];
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];

export default function Analytics({ products }: AnalyticsProps) {
  const stats = useMemo(() => {
    const today = new Date();
    const expired = products.filter(
      (p) => new Date(p.expiryDate).getTime() < today.getTime()
    ).length;
    const expiringSoon = products.filter((p) => {
      const days = Math.ceil(
        (new Date(p.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return days >= 0 && days <= 7;
    }).length;
    const active = products.length - expired;

    return { expired, expiringSoon, active, total: products.length };
  }, [products]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category || "Uncategorized";
      categories[cat] = (categories[cat] || 0) + 1;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [products]);

  const expiryTimeline = useMemo(() => {
    const now = new Date();
    const days = ["Expired", "0-7 days", "8-14 days", "15-30 days", "30+ days"];
    const counts = [0, 0, 0, 0, 0];

    products.forEach((p) => {
      const diff = Math.ceil(
        (new Date(p.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diff < 0) counts[0]++;
      else if (diff <= 7) counts[1]++;
      else if (diff <= 14) counts[2]++;
      else if (diff <= 30) counts[3]++;
      else counts[4]++;
    });

    return days.map((name, i) => ({ name, count: counts[i] }));
  }, [products]);

  if (products.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Status Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Active", value: stats.active },
                    { name: "Expiring Soon", value: stats.expiringSoon },
                    { name: "Expired", value: stats.expired },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {[0, 1, 2].map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={["#10B981", "#F59E0B", "#EF4444"][index]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        {categoryData.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">By Category</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    label={({ name }) => name}
                  >
                    {categoryData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Expiry Timeline */}
        <div className="md:col-span-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Expiry Timeline</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expiryTimeline}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
