"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TopNavigation from '@/components/TopNavigation';
import BottomNavigation from '@/components/BottomNavigation';
import SeriesCard from '@/components/SeriesCard';
import { SeriesData, getSeries, getViewCounts24h } from '@/utils/webtoonStorage';

type TabType = 'trending' | 'popular';

export default function PopularPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMainNav, setActiveMainNav] = useState<'home' | 'genre' | 'originals' | 'my' | 'more'>('home');
  const [allSeries, setAllSeries] = useState<SeriesData[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<SeriesData[]>([]);
  const [viewCounts24h, setViewCounts24h] = useState<Record<string, number>>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const tabDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tabDropdownRef.current && !tabDropdownRef.current.contains(event.target as Node)) {
        setIsTabDropdownOpen(false);
      }
    };

    if (isTabDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTabDropdownOpen]);

  // Load all series and 24h view counts
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Loading data for popular page...');
        setIsDataLoaded(false);
        const [series, counts24h] = await Promise.all([
          getSeries(),
          getViewCounts24h()
        ]);
        // console.log('✅ Loaded series:', series.length);
        // console.log('✅ 24h view counts object:', counts24h);
        // console.log('✅ 24h view counts entries:', Object.entries(counts24h));
        // console.log('✅ Sample series IDs:', series.slice(0, 5).map(s => ({ id: s.id, title: s.title })));
        
        setAllSeries(series);
        setViewCounts24h(counts24h);
        setIsDataLoaded(true);
      } catch (error) {
        console.error('❌ Failed to load data:', error);
        setIsDataLoaded(true); // Still set to true to show data even if there's an error
      }
    };
    loadData();
  }, []);

  // Filter and sort series based on active tab
  useEffect(() => {
    // Don't sort until data is loaded
    if (!isDataLoaded) {
      return;
    }

    let filtered = [...allSeries];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(series =>
        series.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        series.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply tab-specific filtering and sorting
    if (activeTab === 'trending') {
    //   console.log('Trending tab - Sorting by 24h view counts');
    //   console.log('viewCounts24h state:', viewCounts24h);
    //   console.log('Total series to sort:', filtered.length);
      
      // Trending: Sort by 24-hour view count (highest first)
      // Show all series, but prioritize those with 24h views
      filtered = filtered.sort((a, b) => {
        const countA = viewCounts24h[a.id] || 0;
        const countB = viewCounts24h[b.id] || 0;
        const diff = countB - countA;
        
        // console.log(`Comparing: ${a.title} (24h: ${countA}, total: ${a.viewCount || 0}) vs ${b.title} (24h: ${countB}, total: ${b.viewCount || 0}) = ${diff}`);
        
        if (diff !== 0) {
          return diff;
        }
        // If 24h view counts are equal, sort by total view count
        return (b.viewCount || 0) - (a.viewCount || 0);
      });
      
    //   console.log('✅ Trending sorted series (top 10):', filtered.slice(0, 10).map((s, idx) => ({ 
    //     rank: idx + 1,
    //     title: s.title, 
    //     count24h: viewCounts24h[s.id] || 0,
    //     totalViews: s.viewCount || 0,
    //     seriesId: s.id
    //   })));
    } else if (activeTab === 'popular') {
      // Popular: Sort all series by total view count (highest first), no date filter
      filtered = filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }

    setFilteredSeries(filtered);
  }, [activeTab, searchQuery, allSeries, viewCounts24h, isDataLoaded]);

  const handleCreateWebtoon = () => {
    const seriesId = crypto.randomUUID();
    router.push(`/series/${seriesId}?create=true&type=regular`);
  };

  const handleStartBattle = () => {
    router.push('/dashboard');
  };

  const handleMainNavChange = (nav: 'home' | 'genre' | 'originals' | 'my' | 'more') => {
    setActiveMainNav(nav);
    if (nav === 'home') {
      router.push('/dashboard');
    } else if (nav === 'originals') {
      router.push('/originals');
    } else if (nav === 'genre') {
      router.push('/genre');
    }
  };


  const genreLabels: Record<string, string> = {
    'action': 'Action',
    'romance': 'Romance',
    'comedy': 'Comedy',
    'drama': 'Drama',
    'fantasy': 'Fantasy',
    'horror': 'Horror',
    'sci-fi': 'Sci-Fi',
  };


  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <TopNavigation
        activeCategory="all"
        onCategoryChange={() => {}}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateWebtoon={handleCreateWebtoon}
        onStartBattle={handleStartBattle}
        activeMainNav={activeMainNav}
        onMainNavChange={handleMainNavChange}
        onSearchOpen={() => setIsSearchOpen(true)}
      />

      {/* Tabs - Fixed below top navigation */}
      <div className="fixed top-[135px] md:top-[73px] left-0 right-0 bg-white border-b border-gray-200 z-[60]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {activeTab === 'trending' ? 'Trending' : 'Popular'}
            </h1>
            
            {/* Tab Dropdown */}
            <div className="relative" ref={tabDropdownRef}>
              <button
                onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">
                  {activeTab === 'trending' ? 'Trending' : 'Popular'}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${isTabDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {isTabDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => {
                      setActiveTab('trending');
                      setIsTabDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      activeTab === 'trending'
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Trending
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('popular');
                      setIsTabDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      activeTab === 'popular'
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Popular
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-[190px] md:pt-[120px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Series Grid */}
          <div className="bg-white rounded-lg shadow">
            {filteredSeries.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {activeTab === 'trending' 
                  ? 'No series viewed in the last 24 hours'
                  : searchQuery 
                    ? 'No series found matching your search'
                    : 'No series found'}
              </div>
            ) : (
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                  {filteredSeries.map((series) => (
                    <SeriesCard
                      key={series.id}
                      series={series}
                      genreLabels={genreLabels}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNavigation
        activeCategory="all"
        onCategoryChange={() => {}}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearchOpen={isSearchOpen}
        onSearchToggle={setIsSearchOpen}
        onCreateWebtoon={handleCreateWebtoon}
        onStartBattle={handleStartBattle}
      />
    </div>
  );
}

