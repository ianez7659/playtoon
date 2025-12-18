"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getSeriesById, getEpisodes, deleteSeries, SeriesData, EpisodeData } from '@/utils/webtoonStorage';
import SeriesPage from '@/components/SeriesPage';
import WebtoonPage from '@/components/WebtoonPage';
import WebtoonViewer from '@/components/WebtoonViewer';
import WebtoonCard from '@/components/WebtoonCard';
import TopNavigation from '@/components/TopNavigation';
import BottomNavigation from '@/components/BottomNavigation';
import { PencilSimple, Trash, Plus } from '@phosphor-icons/react';
import CutInputModal from '@/components/CutInputModal';
// Using crypto.randomUUID() instead of uuid package

export default function SeriesDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const seriesId = params.seriesId as string;
  const isCreating = searchParams.get('create') === 'true';
  const seriesTypeParam = searchParams.get('type') as 'amateur' | 'regular' | null;

  const [series, setSeries] = useState<SeriesData | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingSeries, setIsEditingSeries] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<{ cutCount: number; episodeId: string } | null>(null);
  const [viewingEpisode, setViewingEpisode] = useState<EpisodeData | null>(null);
  const [isCutModalOpen, setIsCutModalOpen] = useState(false);

  useEffect(() => {
    if (!isCreating) {
      loadSeriesData();
    } else {
      setIsLoading(false);
    }
  }, [seriesId, isCreating]);

  const loadSeriesData = async () => {
    setIsLoading(true);
    try {
      const [seriesData, episodesData] = await Promise.all([
        getSeriesById(seriesId),
        getEpisodes(seriesId),
      ]);
      setSeries(seriesData);
      setEpisodes(episodesData);
    } catch (error) {
      console.error('Failed to load series data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeriesSave = async (seriesData: SeriesData) => {
    setSeries(seriesData);
    setIsEditingSeries(false);
    // Remove create query parameter
    router.replace(`/series/${seriesData.id}`);
    await loadSeriesData();
  };

  const handleEpisodeSave = async () => {
    setCurrentEpisode(null);
    await loadSeriesData();
  };

  const handleDeleteSeries = async () => {
    if (!series) return;
    if (window.confirm('Are you sure you want to delete this series? All episodes will be deleted.')) {
      try {
        await deleteSeries(series.id);
        router.push('/dashboard');
      } catch (error) {
        console.error('Failed to delete series:', error);
        alert('Failed to delete series. Please try again.');
      }
    }
  };

  const handleCreateEpisode = () => {
    setIsCutModalOpen(true);
  };

  const handleCutModalConfirm = (cutCount: number) => {
    const episodeId = crypto.randomUUID();
    setCurrentEpisode({ cutCount, episodeId });
    setIsCutModalOpen(false);
  };

  const handleCutModalClose = () => {
    setIsCutModalOpen(false);
  };

  const handleViewEpisode = (episode: EpisodeData) => {
    setViewingEpisode(episode);
  };

  const handleBackToSeries = () => {
    setViewingEpisode(null);
    setCurrentEpisode(null);
  };

  const handleBackFromViewer = () => {
    handleBackToSeries();
    // Reload series data to update view counts
    loadSeriesData();
  };

  const handleEditEpisode = (episode: EpisodeData) => {
    setCurrentEpisode({ cutCount: episode.cuts.length, episodeId: episode.id });
  };

  const handleDeleteEpisode = async (episodeId: string) => {
    if (window.confirm('Are you sure you want to delete this episode?')) {
      try {
        const { deleteEpisode } = await import('@/utils/webtoonStorage');
        await deleteEpisode(episodeId);
        await loadSeriesData();
      } catch (error) {
        console.error('Failed to delete episode:', error);
        alert('Failed to delete episode. Please try again.');
      }
    }
  };

  // If viewing an episode, show viewer
  if (viewingEpisode) {
    const webtoonData = {
      id: viewingEpisode.id,
      title: viewingEpisode.episodeTitle,
      description: '',
      thumbnailUrl: series?.thumbnailUrl,
      cuts: viewingEpisode.cuts,
      createdAt: viewingEpisode.createdAt,
      type: series?.type,
      genre: series?.genre,
    };
    return (
      <WebtoonViewer 
        webtoonData={webtoonData} 
        onBack={handleBackFromViewer}
        seriesId={seriesId}
        episodeId={viewingEpisode.id}
      />
    );
  }

  // If creating/editing episode, show episode page
  if (currentEpisode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={handleBackToSeries}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Series
            </button>
          </div>
        </div>
        <WebtoonPage
          cutCount={currentEpisode.cutCount}
          webtoonId={currentEpisode.episodeId}
          seriesId={seriesId}
          onSave={handleEpisodeSave}
          webtoonType={series?.type || 'regular'}
        />
      </div>
    );
  }

  // If creating series, show series creation page
  if (isCreating) {
    const defaultType = seriesTypeParam || 'regular';
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back
            </button>
          </div>
        </div>
        <SeriesPage
          seriesId={seriesId}
          onSave={handleSeriesSave}
          seriesType={defaultType}
        />
      </div>
    );
  }

  // If editing series, show series edit page
  if (isEditingSeries && series) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => setIsEditingSeries(false)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Series
            </button>
          </div>
        </div>
        <SeriesPage
          seriesId={series.id}
          onSave={handleSeriesSave}
          seriesType={series.type}
          initialData={series}
        />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Series not found
  if (!series) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Series not found</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const genreLabels: Record<string, string> = {
    'action': 'Action',
    'romance': 'Romance',
    'comedy': 'Comedy',
    'drama': 'Drama',
    'fantasy': 'Fantasy',
    'horror': 'Horror',
    'sci-fi': 'Sci-Fi',
  };

  const handleCreateSeries = () => {
    router.push('/dashboard');
  };

  const handleStartBattle = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <TopNavigation
        activeCategory="all"
        onCategoryChange={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
        onCreateWebtoon={handleCreateSeries}
        onStartBattle={handleStartBattle}
        activeMainNav="home"
        onMainNavChange={(nav) => {
          if (nav === 'home') router.push('/dashboard');
          else if (nav === 'genre') router.push('/genre');
          else if (nav === 'originals') router.push('/originals');
        }}
        onSearchOpen={() => {}}
      />

      {/* Series Header */}
      <div className="bg-white border-b border-gray-200 pt-[135px] md:pt-[73px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Thumbnail */}
            {series.thumbnailUrl && (
              <div className="w-full md:w-48 h-64 md:h-48 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                <Image
                  src={series.thumbnailUrl}
                  alt={series.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 192px"
                />
              </div>
            )}
            
            {/* Series Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {series.title}
                  </h1>
                  {series.genre && (
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded mb-2">
                      {genreLabels[series.genre] || series.genre}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingSeries(true)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
                    title="Edit Series"
                  >
                    <PencilSimple size={20} weight="regular" />
                  </button>
                  <button
                    onClick={handleDeleteSeries}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-300 hover:border-red-300 rounded-lg transition-colors"
                    title="Delete Series"
                  >
                    <Trash size={20} weight="regular" />
                  </button>
                </div>
              </div>
              
              {series.description && (
                <p className="text-gray-600 mb-4">{series.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{episodes.length} episodes</span>
                {series.viewCount !== undefined && (
                  <span>{series.viewCount} views</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Episodes Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Episodes</h2>
          <button
            onClick={handleCreateEpisode}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-300 hover:border-blue-300 rounded-lg transition-colors flex items-center gap-2"
            title="Create Episode"
          >
            <Plus size={20} weight="regular" />
            <span className="text-sm font-medium">Create Episode</span>
          </button>
        </div>

        {episodes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <p className="mb-4">No episodes yet.</p>
            <button
              onClick={handleCreateEpisode}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-300 hover:border-blue-300 rounded-lg transition-colors"
              title="Create First Episode"
            >
              <Plus size={20} weight="regular" />
              <span className="text-sm font-medium">Create First Episode</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {episodes.map((episode) => {
              // Convert EpisodeData to WebtoonData format for WebtoonCard
              const webtoonData = {
                id: episode.id,
                title: episode.episodeTitle,
                description: '',
                thumbnailUrl: series.thumbnailUrl,
                cuts: episode.cuts,
                createdAt: episode.createdAt,
                type: series.type,
                genre: series.genre,
                viewCount: episode.viewCount || 0,
              };
              
              return (
                <WebtoonCard
                  key={episode.id}
                  webtoon={webtoonData}
                  onView={() => handleViewEpisode(episode)}
                  onEdit={() => handleEditEpisode(episode)}
                  onDelete={() => handleDeleteEpisode(episode.id)}
                  genreLabels={genreLabels}
                />
              );
            })}
          </div>
        )}
      </div>

      <CutInputModal
        isOpen={isCutModalOpen}
        onClose={handleCutModalClose}
        onConfirm={handleCutModalConfirm}
      />

      <BottomNavigation
        activeCategory="all"
        onCategoryChange={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
        isSearchOpen={false}
        onSearchToggle={() => {}}
        onCreateWebtoon={handleCreateSeries}
        onStartBattle={handleStartBattle}
      />
    </div>
  );
}

