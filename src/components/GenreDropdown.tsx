"use client";

import { useState, useEffect, useRef } from 'react';

type Genre = 'all' | 'action' | 'romance' | 'comedy' | 'drama' | 'fantasy' | 'horror' | 'sci-fi';

interface GenreDropdownProps {
  activeGenre: Genre;
  onGenreChange: (genre: Genre) => void;
  genreLabels: Record<Genre, string>;
  align?: 'left' | 'right';
}

export default function GenreDropdown({ 
  activeGenre, 
  onGenreChange, 
  genreLabels,
  align = 'right'
}: GenreDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const genres: Genre[] = ['all', 'action', 'romance', 'comedy', 'drama', 'fantasy', 'horror', 'sci-fi'];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">{genreLabels[activeGenre]}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto`}>
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => {
                onGenreChange(genre);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                activeGenre === genre
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {genreLabels[genre]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

