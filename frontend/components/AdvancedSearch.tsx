"use client";

import { useState, useEffect, useRef } from "react";

interface SearchSuggestionsProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

interface Suggestion {
  id: string;
  text: string;
  type: 'product' | 'category' | 'date';
  highlight?: string;
}

export default function AdvancedSearch({ onSearch, placeholder = "Search products...", className = "" }: SearchSuggestionsProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock suggestions data (in real app, this would come from API)
  const generateSuggestions = async (searchQuery: string): Promise<Suggestion[]> => {
    if (searchQuery.length < 2) return [];
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const allProducts = [
      "Milk", "Bread", "Cheese", "Yogurt", "Eggs", "Butter", "Cream", "Sour Cream",
      "Chicken", "Beef", "Pork", "Fish", "Turkey", "Bacon", "Sausage"
    ];
    
    const categories = ["Dairy", "Meat", "Bakery", "Vegetables", "Fruits"];
    
    const productMatches = allProducts
      .filter(product => product.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(product => ({
        id: `product-${product}`,
        text: product,
        type: 'product' as const,
        highlight: searchQuery
      }));
    
    const categoryMatches = categories
      .filter(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(cat => ({
        id: `category-${cat}`,
        text: cat,
        type: 'category' as const,
        highlight: searchQuery
      }));
    
    return [...productMatches.slice(0, 3), ...categoryMatches.slice(0, 2)];
  };

  useEffect(() => {
    if (query.length < 2) {
      return;
    }

    let cancelled = false;

    const fetchSuggestions = async () => {
      setIsLoading(true);
      const results = await generateSuggestions(query);
      if (!cancelled) {
        setSuggestions(results);
        setIsLoading(false);
        setIsOpen(true);
        setSelectedIndex(-1);
      }
    };

    fetchSuggestions();

    return () => {
      cancelled = true;
    };
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          onSearch(query);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setQuery(suggestion.text);
    onSearch(suggestion.text);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() ? 
        <mark key={index} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-1 rounded">
          {part}
        </mark> : part
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden glass">
            <div className="max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0 flex items-center gap-3 ${
                    index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {suggestion.type === 'product' && (
                      <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs">
                        📦
                      </div>
                    )}
                    {suggestion.type === 'category' && (
                      <div className="w-6 h-6 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xs">
                        📁
                      </div>
                    )}
                    <span className="text-slate-900 dark:text-white">
                      {highlightText(suggestion.text, suggestion.highlight || "")}
                    </span>
                  </div>
                  <div className="ml-auto text-xs text-slate-500 dark:text-slate-400 capitalize">
                    {suggestion.type}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Show all results */}
            {query && (
              <button
                onClick={() => {
                  onSearch(query);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-t border-slate-200 dark:border-slate-700 text-sm text-blue-600 dark:text-blue-400 font-medium"
              >
                Search for &quot;{query}&quot; →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}