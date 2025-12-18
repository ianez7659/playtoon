"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { MagnifyingGlass, Fire, Sword, Plus, House, Tag, Images, User, DotsThree, CaretDown } from '@phosphor-icons/react';

type Category = 'all' | 'recent' | 'popular';
type MainNav = 'home' | 'genre' | 'originals' | 'my' | 'more';
type Genre = 'all' | 'action' | 'romance' | 'comedy' | 'drama' | 'fantasy' | 'horror' | 'sci-fi';

interface TopNavigationProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateWebtoon: () => void;
  onStartBattle: () => void;
  activeMainNav?: MainNav;
  onMainNavChange?: (nav: MainNav) => void;
  onSearchOpen?: () => void;
  activeGenre?: Genre;
  onGenreChange?: (genre: Genre) => void;
}

export default function TopNavigation({
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  onCreateWebtoon,
  onStartBattle,
  activeMainNav = 'home',
  onMainNavChange,
  onSearchOpen,
  activeGenre = 'all',
  onGenreChange,
}: TopNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const genres: { value: Genre; label: string }[] = [
    { value: 'all', label: 'All Genres' },
    { value: 'action', label: 'Action' },
    { value: 'romance', label: 'Romance' },
    { value: 'comedy', label: 'Comedy' },
    { value: 'drama', label: 'Drama' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'horror', label: 'Horror' },
    { value: 'sci-fi', label: 'Sci-Fi' },
  ];

  const handleMainNavClick = (nav: MainNav) => {
    if (onMainNavChange) {
      onMainNavChange(nav);
    }
    
    // Handle navigation
    if (nav === 'home') {
      router.push('/dashboard');
    } else if (nav === 'originals') {
      router.push('/originals');
    } else if (nav === 'genre') {
      router.push('/genre');
    }
  };

  return (
    <>
      {/* Mobile Top Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        {/* Top Row: Logo and Search */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">playtoon</h1>
          {onSearchOpen && (
            <button
              onClick={onSearchOpen}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <MagnifyingGlass size={20} weight="bold" />
            </button>
          )}
        </div>
        
        {/* Main Navigation Bar */}
        <div className="flex items-center justify-around px-2 py-2 border-b border-gray-100">
          <button
            onClick={() => handleMainNavClick('home')}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              activeMainNav === 'home' && pathname !== '/popular'
                ? 'text-blue-600'
                : 'text-gray-600'
            }`}
          >
            <House size={24} weight={activeMainNav === 'home' && pathname !== '/popular' ? 'fill' : 'regular'} />
            <span className="text-xs font-medium">Home</span>
          </button>
          
          <button
            onClick={() => handleMainNavClick('genre')}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              activeMainNav === 'genre' && pathname !== '/popular'
                ? 'text-blue-600'
                : 'text-gray-600'
            }`}
          >
            <Tag size={24} weight={activeMainNav === 'genre' && pathname !== '/popular' ? 'fill' : 'regular'} />
            <span className="text-xs font-medium">Genre</span>
          </button>
          
          <button
            onClick={() => {
              router.push('/popular');
            }}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              pathname === '/popular'
                ? 'text-blue-600'
                : 'text-gray-600'
            }`}
          >
            <Fire size={24} weight={pathname === '/popular' ? 'fill' : 'regular'} />
            <span className="text-xs font-medium">Popular</span>
          </button>
          
          <button
            onClick={() => handleMainNavClick('originals')}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              activeMainNav === 'originals'
                ? 'text-blue-600'
                : 'text-gray-600'
            }`}
          >
            <Images size={24} weight={activeMainNav === 'originals' ? 'fill' : 'regular'} />
            <span className="text-xs font-medium">Amateur</span>
          </button>
          
          <button
            onClick={() => handleMainNavClick('more')}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              activeMainNav === 'more' || activeMainNav === 'my'
                ? 'text-blue-600'
                : 'text-gray-600'
            }`}
          >
            <DotsThree size={24} weight={activeMainNav === 'more' || activeMainNav === 'my' ? 'fill' : 'regular'} />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </div>

      {/* Desktop Top Navigation */}
      <div className="hidden md:block fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Top Row: Logo/Title, Main Navigation, and Actions */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold text-gray-900">Playtoon</h1>
              
              {/* Main Navigation - Desktop */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMainNavClick('home')}
                  className={`px-4 py-2 text-sm font-semibold transition-colors rounded-lg flex items-center gap-2 ${
                    activeMainNav === 'home' && pathname !== '/popular'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <House size={18} weight={activeMainNav === 'home' && pathname !== '/popular' ? 'fill' : 'regular'} />
                  <span>Home</span>
                </button>
                <button
                  onClick={() => handleMainNavClick('genre')}
                  className={`px-4 py-2 text-sm font-semibold transition-colors rounded-lg flex items-center gap-2 ${
                    activeMainNav === 'genre' && pathname !== '/popular'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Tag size={18} weight={activeMainNav === 'genre' && pathname !== '/popular' ? 'fill' : 'regular'} />
                  <span>Genre</span>
                </button>
                <button
                  onClick={() => {
                    router.push('/popular');
                  }}
                  className={`px-4 py-2 text-sm font-semibold transition-colors rounded-lg flex items-center gap-2 ${
                    pathname === '/popular'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Fire size={18} weight={pathname === '/popular' ? 'fill' : 'regular'} />
                  <span>Popular</span>
                </button>
                <button
                  onClick={() => handleMainNavClick('originals')}
                  className={`px-4 py-2 text-sm font-semibold transition-colors rounded-lg flex items-center gap-2 ${
                    activeMainNav === 'originals'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Images size={18} weight={activeMainNav === 'originals' ? 'fill' : 'regular'} />
                  <span>Amateur</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search Icon Button - Desktop */}
              {onSearchOpen && (
                <button
                  onClick={onSearchOpen}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <MagnifyingGlass size={20} weight="bold" />
                </button>
              )}
              <button
                onClick={onStartBattle}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Sword size={18} weight="regular" />
                <span>Battle</span>
              </button>
              <button
                onClick={onCreateWebtoon}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Plus size={18} weight="bold" />
                <span>Create</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

