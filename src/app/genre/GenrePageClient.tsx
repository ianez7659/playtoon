"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TopNavigation from '@/components/TopNavigation';
import BottomNavigation from '@/components/BottomNavigation';
import SeriesCard from '@/components/SeriesCard';
import GenreDropdown from '@/components/GenreDropdown';
import { SeriesData, getSeries } from '@/utils/webtoonStorage';

type Genre = 'all' | 'action' | 'romance' | 'comedy' | 'drama' | 'fantasy' | 'horror' | 'sci-fi';
type Category = 'all' | 'recent' | 'popular';

export default function GenrePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<Category>(() => {
    const fromUrl = searchParams.get('category') as Category | null;
    return fromUrl === 'all' || fromUrl === 'recent' || fromUrl === 'popular' ? fromUrl : 'all';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMainNav, setActiveMainNav] = useState<'home' | 'genre' | 'originals' | 'my' | 'more'>('genre');
  const [activeGenre, setActiveGenre] = useState<Genre>(
    (searchParams.get('genre') as Genre) || 'all'
  );
  const [regularSeries, setRegularSeries] = useState<SeriesData[]>([]);
  const [filteredSeries, setFilteredSeries] = useState<SeriesData[]>([]);

  const genreLabels: Record<Genre, string> = {
    all: 'All',
    action: 'Action',
    romance: 'Romance',
    comedy: 'Comedy',
    drama: 'Drama',
    fantasy: 'Fantasy',
    horror: 'Horror',
    'sci-fi': 'Sci-Fi',
  };

  // Load regular series
  useEffect(() => {
    const loadRegularSeries = async () => {
      try {
        const allSeries = await getSeries();
        // Filter only regular series (exclude amateur)
        const regular = allSeries.filter(series => 
          series.type === 'regular' || series.type === undefined || series.type === null
        );
        setRegularSeries(regular);
        setFilteredSeries(regular);
      } catch (error) {
        console.error('Failed to load regular series:', error);
      }
    };

    loadRegularSeries();
  }, []);

  // Filter series based on genre and search query
  useEffect(() => {
    let filtered = [...regularSeries];

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

    // Sort by category
    if (activeCategory === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (activeCategory === 'popular') {
      filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }

    setFilteredSeries(filtered);
  }, [activeGenre, searchQuery, activeCategory, regularSeries]);

  const handleCategoryChange = (category: Category) => {
    setActiveCategory(category);
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', category);
    router.push(`/genre?${params.toString()}`);
  };

  const handleGenreChange = (genre: Genre) => {
    setActiveGenre(genre);
    const params = new URLSearchParams(searchParams.toString());
    params.set('genre', genre);
    router.push(`/genre?${params.toString()}`);
  };

  const handleMainNavChange = (nav: 'home' | 'genre' | 'originals' | 'my' | 'more') => {
    setActiveMainNav(nav);
    if (nav === 'home') router.push('/dashboard');
    else if (nav === 'originals') router.push('/originals');
    else if (nav === 'genre') router.push('/genre');
  };

  const handleCreateWebtoon = () => {
    const seriesId = crypto.randomUUID();
    router.push(`/series/${seriesId}?create=true&type=regular`);
  };
  const handleStartBattle = () => router.push('/dashboard');


  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <TopNavigation
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateWebtoon={handleCreateWebtoon}
        onStartBattle={handleStartBattle}
        activeMainNav={activeMainNav}
        onMainNavChange={handleMainNavChange}
        onSearchOpen={() => setIsSearchOpen(true)}
      />

      {/* Genre dropdown - Fixed below top navigation */}
      <div className="fixed top-[135px] md:top-[73px] left-0 right-0 bg-white border-b border-gray-200 z-[60]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <GenreDropdown
            activeGenre={activeGenre}
            onGenreChange={handleGenreChange}
            genreLabels={genreLabels}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-[190px] md:pt-[120px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow">
            {filteredSeries.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {searchQuery ? 'No series found matching your search' : 'No series found'}
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
        onCategoryChange={handleCategoryChange}
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


