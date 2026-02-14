"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import UploadExpiryImage from "@/components/UploadExpiryImage";
import toast from "react-hot-toast";

export default function AddProductPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showManualDate, setShowManualDate] = useState(true);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

const handleExpiryDetected = (detectedDate: string, confidence?: number, method?: string) => {
    setExpiryDate(detectedDate);
    setShowManualDate(false);
    
    const conf = confidence || 0;
    const methodName = method || 'unknown';
    
    if (conf >= 0.9) {
      toast.success(`🎯 Perfect match! ${methodName.toUpperCase()} method detected expiry date`);
    } else if (conf >= 0.8) {
      toast.success(`✅ High confidence expiry date detected (${methodName.toUpperCase()})`);
    } else if (conf >= 0.7) {
      toast.success(`⚠️ Moderate confidence - please verify (${methodName.toUpperCase()})`);
    } else if (conf >= 0.6) {
      toast.success(`❓ Low confidence detected - manual verification recommended`);
    } else {
      toast.success(`🤔 Very low confidence - please verify manually`);
    }
  };

  const submit = async () => {
    if (!name || !expiryDate) {
      toast.error("Please fill all required fields!");
      return;
    }

    let imageUrl = undefined;

    try {
      setLoading(true);
      // Upload image first (if any)
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          imageUrl = data.imageUrl;
        } else {
          toast.error("Image upload failed");
          setLoading(false);
          return;
        }
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name,
            expiryDate,
            ...(imageUrl ? { imageUrl } : {}),
          }),
        }
      );

      if (!res.ok) {
        toast.error("Failed to add product 😞");
        return;
      }

      toast.success("Product added! 🎉");
      router.push("/dashboard");
    } catch {
      toast.error("Error adding product");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Add New Product</h1>
          <p className="text-slate-600 dark:text-slate-300">Track your product expiry dates with ease</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Product Name Field */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Product Name
              </label>
              <input
                required
                id="name"
                type="text"
                className="block w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 bg-white dark:bg-slate-700"
                placeholder="Enter product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Expiry Date Detection Section */}
            <UploadExpiryImage onExtract={handleExpiryDetected} />

            {/* Date field - show only if OCR didn't detect or user wants to override */}
            {showManualDate && (
              <div className="mb-6">
                <label htmlFor="expiry-date" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Expiry Date
                </label>
                <div className="relative">
                  <input
                    required
                    id="expiry-date"
                    type="date"
                    className="block w-full px-4 py-3 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-slate-900 dark:text-white bg-white dark:bg-slate-700 placeholder-slate-400 dark:placeholder-slate-500"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Show detected date and allow override */}
            {!showManualDate && expiryDate && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Detected Expiry Date</p>
                    <p className="text-lg font-bold text-green-900 dark:text-green-100">{new Date(expiryDate).toLocaleDateString()}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualDate(true)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
                  >
                    Edit Date
                  </button>
                </div>
              </div>
            )}

      {/* Product Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Product Image (optional)
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/50 dark:file:text-blue-300 hover:file:bg-blue-100"
                  />
                </div>
                {imagePreview && (
                  <div className="flex-shrink-0">
                    <div className="h-20 w-20 rounded-lg object-cover border border-slate-300 dark:border-slate-600 shadow-sm relative">
                      <Image
                        src={imagePreview}
                        alt="Product preview"
                        fill
                        className="rounded-lg object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                onClick={submit}
                disabled={loading || !name || !expiryDate}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding Product...
                  </>
                ) : (
                  "Add Product"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}