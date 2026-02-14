"use client";

import { useState, useEffect } from "react";

export default function AccessibilityPanel() {
  const [highContrast, setHighContrast] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('highContrast') === 'true';
  });
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('reducedMotion') === 'true';
  });
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window === 'undefined') return 'medium';
    return localStorage.getItem('fontSize') || 'medium';
  });

  const applyPreferences = (contrast: boolean, motion: boolean, size: string) => {
    const root = document.documentElement;
    
    if (contrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (motion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    root.setAttribute('data-font-size', size);
  };

  useEffect(() => {
    applyPreferences(highContrast, reducedMotion, fontSize);
  }, [highContrast, reducedMotion, fontSize]);

  useEffect(() => {
    const savedHighContrast = localStorage.getItem('highContrast') === 'true';
    const savedReducedMotion = localStorage.getItem('reducedMotion') === 'true';
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    
    applyPreferences(savedHighContrast, savedReducedMotion, savedFontSize);
  }, []);

  const handleHighContrast = (value: boolean) => {
    setHighContrast(value);
    localStorage.setItem('highContrast', value.toString());
    applyPreferences(value, reducedMotion, fontSize);
  };

  const handleReducedMotion = (value: boolean) => {
    setReducedMotion(value);
    localStorage.setItem('reducedMotion', value.toString());
    applyPreferences(highContrast, value, fontSize);
  };

  const handleFontSize = (size: string) => {
    setFontSize(size);
    localStorage.setItem('fontSize', size);
    applyPreferences(highContrast, reducedMotion, size);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-4 glass">
      <div className="space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">
          ♿ Accessibility
        </h3>
        
        {/* High Contrast Toggle */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-300">High Contrast</span>
          <button
            onClick={() => handleHighContrast(!highContrast)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              highContrast ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                highContrast ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        {/* Reduced Motion Toggle */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-300">Reduce Motion</span>
          <button
            onClick={() => handleReducedMotion(!reducedMotion)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              reducedMotion ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                reducedMotion ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        {/* Font Size Controls */}
        <div className="space-y-2">
          <span className="text-sm text-slate-600 dark:text-slate-300">Text Size</span>
          <div className="flex gap-1">
            {[
              { value: 'small', label: 'S' },
              { value: 'normal', label: 'A' },
              { value: 'large', label: 'L' },
              { value: 'xlarge', label: 'XL' }
            ].map(size => (
              <button
                key={size.value}
                onClick={() => handleFontSize(size.value)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  fontSize === size.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Keyboard Shortcuts Info */}
        <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
          <p className="font-medium mb-1">Keyboard Shortcuts:</p>
          <div className="space-y-1">
            <p>• Tab: Navigate forward</p>
            <p>• Shift+Tab: Navigate backward</p>
            <p>• Enter/Space: Activate</p>
            <p>• Escape: Close modals</p>
          </div>
        </div>
      </div>
    </div>
  );
}