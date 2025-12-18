"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopNavigation from '@/components/TopNavigation';
import BottomNavigation from '@/components/BottomNavigation';
import SeriesCard from '@/components/SeriesCard';
import GenreDropdown from '@/components/GenreDropdown';
import { SeriesData, getSeries } from '@/utils/webtoonStorage';

type Genre = 'all' | 'action' | 'romance' | 'comedy' | 'drama' | 'fantasy' | 'horror' | 'sci-fi';

export default function OriginalsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<'all' | 'recent' | 'popular'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMainNav, setActiveMainNav] = useState<'home' | 'genre' | 'originals' | 'my' | 'more'>('originals');
  const [activeGenre, setActiveGenre] = useState<Genre>('all');
  const [amateurSeries, setAmateurSeries] = useState<SeriesData[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<SeriesData[]>([]);

  // Load amateur series
  useEffect(() => {
    const loadAmateurSeries = async () => {
      try {
        const allSeries = await getSeries();
        // Filter only amateur series: only include those explicitly marked as 'amateur'
        // Exclude 'regular' type and those with no type (legacy dashboard series)
        const amateur = allSeries.filter(series => series.type === 'amateur');
        setAmateurSeries(amateur);
        setFilteredSeries(amateur);
      } catch (error) {
        console.error('Failed to load amateur series:', error);
      }
    };
    loadAmateurSeries();
  }, []);

  // Filter series by genre and search query
  useEffect(() => {
    let filtered = [...amateurSeries];

    // Filter by genre
    if (activeGenre !== 'all') {
      filtered = filtered.filter(series => series.genre === activeGenre);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(series =>
        series.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        series.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredSeries(filtered);
  }, [activeGenre, searchQuery, amateurSeries]);

  const handleCreateSeries = () => {
    const seriesId = crypto.randomUUID();
    router.push(`/series/${seriesId}?create=true&type=amateur`);
  };


  const handleStartBattle = () => {
    router.push('/dashboard');
  };

  const handleMainNavChange = (nav: 'home' | 'genre' | 'originals' | 'my' | 'more') => {
    setActiveMainNav(nav);
    if (nav === 'home') {
      router.push('/dashboard');
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <TopNavigation
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateWebtoon={handleCreateSeries}
        onStartBattle={handleStartBattle}
        activeMainNav={activeMainNav}
        onMainNavChange={handleMainNavChange}
        onSearchOpen={() => setIsSearchOpen(true)}
        activeGenre={activeGenre}
        onGenreChange={setActiveGenre}
      />

      {/* Title and Genre Dropdown - Fixed below top navigation */}
      <div className="fixed top-[135px] md:top-[73px] left-0 right-0 bg-white border-b border-gray-200 z-[60]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Amateur Works</h1>
            <GenreDropdown
              activeGenre={activeGenre}
              onGenreChange={setActiveGenre}
              genreLabels={{
                'all': 'All Genres',
                'action': 'Action',
                'romance': 'Romance',
                'comedy': 'Comedy',
                'drama': 'Drama',
                'fantasy': 'Fantasy',
                'horror': 'Horror',
                'sci-fi': 'Sci-Fi',
              }}
              align="right"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-[190px] md:pt-[120px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-600 mb-8">
            Discover creative works from amateur artists and creators.
          </p>
          
          {/* Amateur Series Grid */}
          <div className="bg-white rounded-lg shadow">
            {filteredSeries.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {searchQuery ? 'No amateur works found matching your search' : 'No amateur works created yet'}
              </div>
            ) : (
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                  {filteredSeries.map((series) => (
                    <SeriesCard
                      key={series.id}
                      series={series}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNavigation
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearchOpen={isSearchOpen}
        onSearchToggle={setIsSearchOpen}
        onCreateWebtoon={handleCreateSeries}
        onStartBattle={handleStartBattle}
      />

    </div>
  );
}

