"use client";

import React from 'react';
import { MagnifyingGlass, Plus, List } from '@phosphor-icons/react';
import SearchModal from './SearchModal';

type Category = 'all' | 'recent' | 'popular';

interface BottomNavigationProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearchOpen: boolean;
  onSearchToggle: (isOpen: boolean) => void;
  onCreateWebtoon: () => void;
  onStartBattle: () => void;
}

export default function BottomNavigation({
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  isSearchOpen,
  onSearchToggle,
  onCreateWebtoon,
  onStartBattle,
}: BottomNavigationProps) {
  const handleSearch = (query: string) => {
    onSearchChange(query);
  };

  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="flex items-center justify-around px-2 py-2">
          {/* Search */}
          <button
            onClick={() => onSearchToggle(!isSearchOpen)}
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              isSearchOpen ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <MagnifyingGlass size={24} weight={isSearchOpen ? 'fill' : 'regular'} />
            <span className="text-xs font-medium">Search</span>
          </button>

          {/* Create */}
          <button
            onClick={onCreateWebtoon}
            className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg text-gray-600 transition-colors hover:text-green-600"
          >
            <Plus size={24} weight="bold" />
            <span className="text-xs font-medium">Create</span>
          </button>

          {/* Library/List */}
          <button
            onClick={() => onCategoryChange('recent')}
            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              activeCategory === 'recent' ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <List size={24} weight={activeCategory === 'recent' ? 'fill' : 'regular'} />
            <span className="text-xs font-medium">Library</span>
          </button>
        </div>
      </div>

      {/* Full Screen Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => onSearchToggle(false)}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onSearch={handleSearch}
      />
    </>
  );
}

