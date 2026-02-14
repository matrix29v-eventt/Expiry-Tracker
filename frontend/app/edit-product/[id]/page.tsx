"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();

  const [name, setName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/list`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((products) => {
        const product = products.find((p: { _id: string }) => p._id === id);
        if (product) {
          setName(product.name);
          setExpiryDate(product.expiryDate.split("T")[0]);
          setImageUrl(product.imageUrl || null);
          setImagePreview(product.imageUrl || null);
        }
      });
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : imageUrl);
  };

const updateProduct = async () => {
    if (!name || !expiryDate) {
      toast.error("All fields are required!");
      return;
    }
    setLoading(true);
    try {
      let newImageUrl = imageUrl;
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
          newImageUrl = data.imageUrl;
        } else {
          toast.error("Image upload failed");
          setLoading(false);
          return;
        }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          expiryDate,
          imageUrl: newImageUrl,
        }),
      });

      if (!res.ok) {
        toast.error("Failed to update product");
        return;
      }

      toast.success("Product updated! 🎉");
      router.push("/dashboard");
    } catch {
      toast.error("Error updating product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Edit Product</h1>
          <p className="text-gray-600 dark:text-gray-400">Update your product information</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 sm:p-8">

      {/* Product Name Field */}
            <div className="mb-6">
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Name
              </label>
              <input
                required
                id="edit-name"
                type="text"
                className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700"
                placeholder="Enter product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Expiry Date Field */}
            <div className="mb-6">
              <label htmlFor="edit-expiry-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expiry Date
              </label>
              <div className="relative">
                <input
                  required
                  id="edit-expiry-date"
                  type="date"
                  className="block w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Product Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Image (optional)
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/50 dark:file:text-blue-300 hover:file:bg-blue-100"
                  />
                </div>
                {imagePreview && (
                  <div className="flex-shrink-0">
                    <div className="h-20 w-20 rounded-lg object-cover border border-gray-300 dark:border-gray-600 shadow-sm relative">
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
                onClick={updateProduct}
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
                    Updating Product...
                  </>
                ) : (
                  "Update Product"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
