"use client";

import { useEffect, useState } from "react";
import AdvancedExpiryDetector, { DetectionResult } from "@/lib/expiryDetector";

interface ExpiryDetectionResult {
  expiryDate?: string;
  confidence?: number;
  extractedText?: string;
  method?: string;
  allResults?: DetectionResult[];
  autoSet?: boolean;
}

/* ------------------ HELPER: SIMPLE REGEX FALLBACK ------------------ */
function extractDateFromText(
  text: string
): { date: string | null; confidence: number } {
  const datePatterns = [
    /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/g, // DD/MM/YYYY
    /(\d{4})[\/\-](\d{2})[\/\-](\d{2})/g, // YYYY/MM/DD
    /(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[\s\-]*(\d{2})[\s\-]*(\d{2,4})/gi,
  ];

  const monthMap: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };

  for (const pattern of datePatterns) {
    const matches = Array.from(text.matchAll(pattern));

    for (const match of matches) {
      let day: string, month: string, year: string;

      if (isNaN(parseInt(match[1]))) {
        month = monthMap[match[1].toLowerCase()] || "01";
        day = match[2].padStart(2, "0");
        year = match[3].length === 2 ? "20" + match[3] : match[3];
      } else if (match[3].length === 4) {
        day = match[1].padStart(2, "0");
        month = match[2].padStart(2, "0");
        year = match[3];
      } else {
        year = match[1];
        month = match[2].padStart(2, "0");
        day = match[3].padStart(2, "0");
      }

      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return { date: `${year}-${month}-${day}`, confidence: 0.9 };
      }
    }
  }

  return { date: null, confidence: 0 };
}

/* ------------------ MAIN COMPONENT ------------------ */
export default function UploadExpiryImage({
  onExtract,
}: {
  onExtract: (
    date: string,
    confidence?: number,
    method?: string,
    allResults?: DetectionResult[]
  ) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastResult, setLastResult] =
    useState<ExpiryDetectionResult | null>(null);
  const [detector, setDetector] =
    useState<AdvancedExpiryDetector | null>(null);

  useEffect(() => {
    const detectorInstance = new AdvancedExpiryDetector({
      enablePreprocessing: true,
      enableMultipleStrategies: true,
      minConfidence: 0.6,
      maxDateRange: 10,
    });
    setDetector(detectorInstance);
  }, []);

const processFile = async (file: File) => {
    if (!detector) return;

    setLoading(true);
    setLastResult(null);

    try {
      // First try backend OCR
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ocr/expiry`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const data = await res.json();
      let finalResults: DetectionResult[] = [];

      if (data.expiryDate) {
        // Backend successfully detected date
        finalResults = [{
          date: data.expiryDate,
          confidence: data.confidence || 0.8,
          method: "hybrid",
          rawText: data.extractedText,
        }];
      } else if (data.extractedText) {
        // Use advanced client-side detection
        finalResults = await detector.detectExpiryDate(file);
        
        // Fallback to simple regex if advanced detection fails
        if (finalResults.length === 0) {
          const simple = extractDateFromText(data.extractedText);
          if (simple.date) {
            finalResults = [{
              date: simple.date,
              confidence: simple.confidence,
              method: "regex",
              rawText: data.extractedText,
            }];
          }
        }
      }

      if (finalResults.length > 0) {
        const best = finalResults[0];
        
        // Determine if we should auto-set based on confidence
        const shouldAutoSet = best.confidence >= 0.75; // Can be configured
        
        onExtract(best.date, best.confidence, best.method, finalResults);
        setLastResult({
          expiryDate: best.date,
          confidence: best.confidence,
          method: best.method,
          extractedText: data.extractedText,
          allResults: finalResults,
          autoSet: shouldAutoSet,
        });
      } else {
        setLastResult({
          extractedText: data.extractedText,
          confidence: 0,
          allResults: [],
          autoSet: false,
        });
      }
    } catch (err) {
      console.error("OCR Error:", err);
      setLastResult({
        confidence: 0,
        allResults: [],
        autoSet: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      await processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

const getStatusMessage = () => {
    if (loading) return { text: "🔍 Advanced analysis in progress...", type: "loading" };
    if (!lastResult) return null;
    
    if (lastResult.expiryDate) {
      const confidence = lastResult.confidence || 0;
      const method = lastResult.method || 'unknown';
      
      if (confidence >= 0.9) {
        return { 
          text: `🎯 Perfect! Auto-set expiry date using ${method.toUpperCase()} method`, 
          type: "success" 
        };
      } else if (confidence >= 0.85) {
        return { 
          text: `✅ High confidence! Auto-set expiry date using ${method.toUpperCase()} method`, 
          type: "success" 
        };
      } else if (confidence >= 0.75) {
        return { 
          text: `⚠️ Good confidence! Auto-set expiry date using ${method.toUpperCase()} method`, 
          type: "success" 
        };
      } else if (confidence >= 0.6) {
        return { 
          text: `❓ Moderate confidence! Auto-set expiry date using ${method.toUpperCase()} method`, 
          type: "warning" 
        };
      } else {
        return { 
          text: `🤔 Low confidence! Auto-set expiry date using ${method.toUpperCase()} method`, 
          type: "info" 
        };
      }
    }
    
    return { 
      text: `❌ No expiry date detected (analyzed ${lastResult.allResults?.length || 0} patterns)`, 
      type: "error" 
    };
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="mb-6 p-5 rounded-xl border bg-blue-50 dark:bg-blue-900/20">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
        📸 Upload Expiry Date Image
      </h3>
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-100 dark:bg-blue-800/30"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          id="image-upload"
          disabled={loading}
        />
        
        <label
          htmlFor="image-upload"
          className="cursor-pointer inline-block"
        >
          <div className="text-4xl mb-3">
            {loading ? "⏳" : "📷"}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {loading
              ? "Processing image..."
              : "Click to upload or drag & drop an image"
            }
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Supports: JPG, PNG, WEBP
          </p>
        </label>
      </div>

      {statusMessage && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm ${
            statusMessage.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300"
              : statusMessage.type === "warning"
              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300"
              : statusMessage.type === "error"
              ? "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300"
              : statusMessage.type === "loading"
              ? "bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300"
              : "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300"
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {lastResult?.allResults && lastResult.allResults.length > 1 && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            📊 All detected dates:
          </p>
          <div className="space-y-1">
            {lastResult.allResults.map((result, index) => (
              <div
                key={index}
                className="text-xs text-gray-600 dark:text-gray-400 flex justify-between"
              >
                <span>{result.date}</span>
                <span className="text-gray-500">
                  {(result.confidence * 100).toFixed(1)}% ({result.method})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
