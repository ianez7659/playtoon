"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlass, X, Clock } from '@phosphor-icons/react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: (query: string) => void;
}

export default function SearchModal({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  onSearch,
}: SearchModalProps) {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('webtoon-search-history');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {
        console.error('Failed to parse search history', e);
      }
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Save search to history
  const handleSearch = (query: string) => {
    if (query.trim()) {
      const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem('webtoon-search-history', JSON.stringify(newHistory));
      onSearch(query);
      onClose();
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  // Clear search history
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('webtoon-search-history');
  };

  // Remove single history item
  const removeHistoryItem = (item: string) => {
    const newHistory = searchHistory.filter(historyItem => historyItem !== item);
    setSearchHistory(newHistory);
    localStorage.setItem('webtoon-search-history', JSON.stringify(newHistory));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
        {/* Search Input */}
        <div className="flex-1 relative">
          <MagnifyingGlass 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            size={20} 
            weight="bold"
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search webtoons..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            autoFocus
          />
        </div>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span className="text-sm font-medium">Cancel</span>
        </button>
      </div>

      {/* Search Content */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery.trim() ? (
          /* Search Results - Placeholder for future implementation */
          <div className="p-4">
            <p className="text-gray-500 text-sm">Search results for &quot;{searchQuery}&quot;</p>
            <p className="text-gray-400 text-xs mt-2">Search functionality will be implemented here</p>
          </div>
        ) : (
          /* Search Suggestions */
          <div className="p-4">
            {/* Search History */}
            {searchHistory.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={18} weight="regular" className="text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-900">Recent Searches</h3>
                  </div>
                  <button
                    onClick={clearHistory}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-2">
                  {searchHistory.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group"
                    >
                      <button
                        onClick={() => handleSearch(item)}
                        className="flex-1 text-left text-sm text-gray-700 flex items-center gap-2"
                      >
                        <Clock size={16} weight="regular" className="text-gray-400" />
                        <span>{item}</span>
                      </button>
                      <button
                        onClick={() => removeHistoryItem(item)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                      >
                        <X size={16} weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

