"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { lazyLoad, preloadImage } from "@/lib/performance";

export interface Product {
  _id: string;
  name: string;
  expiryDate: string;
  category?: string;
  imageUrl?: string; // ✅ added
  expiryConfidence?: number; // OCR confidence score
  expiryMethod?: string; // Method used to detect date
  autoDetected?: boolean; // Whether date was auto-set
}

// Simple category to emoji/icon mapping
const categoryIcon: Record<string, string> = {
  "Food & Beverages": "🍎",
  "Food & beverage": "🍎",
  food: "🍎",
  Medicine: "💊",
  medicine: "💊",
  Cosmetics: "💄",
  cosmetics: "💄",
  Household: "🏠",
  household: "🏠",
  Electronics: "📱",
  electronics: "📱",
  Clothing: "👕",
  clothing: "👕",
  "Other": "📦",
  other: "📦",
};

function getExpiryStatus(expiryDate: string, confidence?: number, autoDetected?: boolean) {
  const today = new Date();
  const exp = new Date(expiryDate);
  const msPerDay = 86400000;
  const diffDays = Math.ceil((exp.getTime() - today.getTime()) / msPerDay);

  const isAutoDetected = autoDetected || (confidence && confidence >= 0.75);

  if (diffDays < 0) return { 
    label: "Expired", 
    color: "bg-red-600 text-white",
    bgColor: "bg-red-50 dark:bg-red-900/20", 
    textColor: "text-red-700 dark:text-red-300",
    borderColor: "border-red-200 dark:border-red-800/50",
    showConfidence: isAutoDetected
  };
  if (diffDays <= 3)
    return { 
      label: `${diffDays} day${diffDays !== 1 ? 's' : ''} left`, 
      color: "bg-amber-600 text-white",
      bgColor: "bg-amber-50 dark:bg-amber-900/20", 
      textColor: "text-amber-700 dark:text-amber-300",
      borderColor: "border-amber-200 dark:border-amber-800/50",
      showConfidence: isAutoDetected
    };
  return { 
    label: `${diffDays} day${diffDays !== 1 ? 's' : ''} left`, 
    color: "bg-emerald-500 text-white",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    textColor: "text-emerald-700 dark:text-emerald-300", 
    borderColor: "border-emerald-200 dark:border-emerald-800/50",
    showConfidence: isAutoDetected
  };
}

// Utility function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function ProductCard({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  
  const expiryStatus = getExpiryStatus(
    product.expiryDate, 
    product.expiryConfidence, 
    product.autoDetected
  );
  const { bgColor, textColor, borderColor } = expiryStatus;
  
  const imageUrl = product.imageUrl;
  
  const icon = categoryIcon[product.category || "other"] || "📦";

  const fullImageUrl = product.imageUrl
    ? product.imageUrl.startsWith("/uploads/")
      ? `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")}${product.imageUrl}`
      : product.imageUrl
    : null;

  // Lazy loading for image
  useEffect(() => {
    if (cardRef.current && fullImageUrl) {
      lazyLoad(cardRef.current, () => {
        setIsVisible(true);
        preloadImage(fullImageUrl).then(() => setImageLoaded(true));
      });
    }
  }, [fullImageUrl]);

  // Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    if (diff < 0) {
      setSwipeX(Math.max(diff, -100));
    }
  };

  const handleTouchEnd = () => {
    if (swipeX < -50) {
      onDelete(product._id);
    }
    setSwipeX(0);
    setIsSwiping(false);
  };

  return (
    <div 
      ref={cardRef}
      className={`relative overflow-hidden rounded-2xl glass card-hover ${bgColor} border ${borderColor} transition-all duration-500 group`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe to delete indicator */}
      {swipeX < 0 && (
        <div className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-center px-4 rounded-2xl">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
      )}
      
      <div style={{ transform: `translateX(${swipeX}px)`, transition: isSwiping ? 'none' : 'transform 0.3s ease' }}>
        {/* Product Image */}
        {imageUrl && isVisible && (
        <div className="aspect-video relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          {/* Placeholder while loading */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
          )}
          {imageLoaded && fullImageUrl && (
            <Image
              src={fullImageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-all duration-700"
            />
          )}
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-2xl group-hover:from-blue-100 group-hover:to-blue-200 dark:group-hover:from-blue-900/50 dark:group-hover:to-blue-800/50 group-hover:scale-110 transition-all duration-500">
              {icon}
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
              {product.name}
            </h3>
          </div>
          {expiryStatus.showConfidence && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800/50 group-hover:scale-110 transition-transform duration-300">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                {Math.round((product.expiryConfidence || 0) * 100)}%
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm ${textColor} mb-2 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300`}>
              Expires: {formatDate(product.expiryDate)}
            </p>
            <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold ${expiryStatus.color} shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300`}>
              {expiryStatus.label}
            </div>
          </div>

          <button
            onClick={() => onDelete(product._id)}
            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all duration-200 hover:scale-110 transform p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
