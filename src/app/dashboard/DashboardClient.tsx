"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SeriesPage from '@/components/SeriesPage';
import SeriesCard from '@/components/SeriesCard';
import CommandBattle from '@/components/CommandBattle';
import SearchModal from '@/components/SearchModal';
import { getSeries, SeriesData } from '@/utils/webtoonStorage';
import TopNavigation from '@/components/TopNavigation';
import BottomNavigation from '@/components/BottomNavigation';

export default function DashboardClient() {
  const router = useRouter();
  const [currentSeries, setCurrentSeries] = useState<{ seriesId: string } | null>(null);
  const [savedSeries, setSavedSeries] = useState<SeriesData[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<SeriesData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBattle, setShowBattle] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'recent' | 'popular'>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMainNav, setActiveMainNav] = useState<'home' | 'genre' | 'originals' | 'my' | 'more'>('home');
  const [activeGenre, setActiveGenre] = useState<'all' | 'action' | 'romance' | 'comedy' | 'drama' | 'fantasy' | 'horror' | 'sci-fi'>('all');

  const handleCreateSeries = () => {
    const seriesId = crypto.randomUUID();
    setCurrentSeries({ seriesId });
  };

  const handleBackToDashboard = () => {
    setCurrentSeries(null);
    setShowBattle(false);
    router.push('/dashboard');
  };

  const handleSeriesSave = async (seriesData: SeriesData) => {
    const series = await getSeries();
    setSavedSeries(series);
    setCurrentSeries(null);
    router.push(`/series/${seriesData.id}`);
  };

  const handleStartBattle = () => {
    setShowBattle(true);
  };

  const handleBattleEnd = () => {
    setShowBattle(false);
  };

  useEffect(() => {
    const loadSeries = async () => {
      try {
        const series = await getSeries();
        setSavedSeries(series);
        setFilteredSeries(series);
      } catch (error) {
        console.error('Failed to load series:', error);
      }
    };
    loadSeries();
  }, []);

  // Search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSeries(savedSeries);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = savedSeries.filter((series) => {
      return (
        series.title.toLowerCase().includes(query) ||
        series.description.toLowerCase().includes(query)
      );
    });
    setFilteredSeries(filtered);
  }, [searchQuery, savedSeries]);

  // Show battle component when battle is active
  if (showBattle) {
    const player1 = {
      id: 'player1',
      name: 'Hero',
      hp: 100,
      maxHp: 100,
      attack: 25,
      defense: 10,
      speed: 15
    };

    const player2 = {
      id: 'player2',
      name: 'Enemy',
      hp: 80,
      maxHp: 80,
      attack: 20,
      defense: 8,
      speed: 12
    };

    return (
      <div>
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={handleBackToDashboard}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
        <CommandBattle
          player1={player1}
          player2={player2}
          onBattleEnd={handleBattleEnd}
        />
      </div>
    );
  }

  // Show series editor when creating/editing a series
  if (currentSeries) {
    return (
      <div>
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={handleBackToDashboard}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
        <SeriesPage
          seriesId={currentSeries.seriesId}
          onSave={handleSeriesSave}
          seriesType="regular"
        />
      </div>
    );
  }

  // Filter series by category and separate by type
  const getCategorySeries = () => {
    let sorted = [...filteredSeries];

    if (activeCategory === 'recent') {
      sorted = sorted.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (activeCategory === 'popular') {
      // Sort by view count
      sorted = sorted.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }

    return sorted;
  };

  const categorySeries = getCategorySeries();

  // Separate regular and amateur series
  const regularSeries = categorySeries.filter(series =>
    series.type === 'regular' || series.type === undefined || series.type === null
  );
  const amateurSeries = categorySeries.filter(series =>
    series.type === 'amateur'
  );

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
        onMainNavChange={setActiveMainNav}
        onSearchOpen={() => setIsSearchOpen(true)}
        activeGenre={activeGenre}
        onGenreChange={setActiveGenre}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-52 md:pt-32">
        {/* Regular Series Section */}
        <div className="mt-4 md:mt-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Latest Update</h2>
          <div className="bg-white rounded-lg shadow">
            {regularSeries.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {searchQuery ? 'No regular series found matching your search' : 'No regular series created yet'}
              </div>
            ) : (
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                  {regularSeries.map((series) => (
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

        {/* Amateur Series Section */}
        {amateurSeries.length > 0 && (
          <div className="mt-8 md:mt-10">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Amateur</h2>
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                  {amateurSeries.map((series) => (
                    <SeriesCard
                      key={series.id}
                      series={series}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
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

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={(query) => setSearchQuery(query)}
      />
    </div>
  );
}
