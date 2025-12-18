"use client";

import Image from 'next/image';
import { Image as ImageIcon, Eye } from '@phosphor-icons/react';
import { SeriesData, Genre } from '@/utils/webtoonStorage';
import { useRouter } from 'next/navigation';

interface SeriesCardProps {
  series: SeriesData;
  genreLabels?: Record<Genre, string>;
}

export default function SeriesCard({ 
  series, 
  genreLabels 
}: SeriesCardProps) {
  const router = useRouter();
  
  // Default genre labels if not provided
  const defaultGenreLabels: Record<Genre, string> = {
    'action': 'Action',
    'romance': 'Romance',
    'comedy': 'Comedy',
    'drama': 'Drama',
    'fantasy': 'Fantasy',
    'horror': 'Horror',
    'sci-fi': 'Sci-Fi',
  };

  const labels = genreLabels || defaultGenreLabels;

  const handleCardClick = () => {
    router.push(`/series/${series.id}`);
  };

  return (
    <div 
      className="group relative border border-gray-200 rounded-lg overflow-visible bg-white hover:shadow-xl transition-all duration-300 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Thumbnail */}
      <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
        {series.thumbnailUrl ? (
          <Image 
            src={series.thumbnailUrl} 
            alt={series.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <ImageIcon size={48} className="text-gray-400" weight="thin" />
          </div>
        )}
        
      </div>
      
      {/* Card Footer */}
      <div className="p-3 bg-white">
        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{series.title}</h3>
        <div className="flex items-center justify-between mb-1">
          {series.genre && (
            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
              {labels[series.genre] || series.genre}
            </span>
          )}
          {typeof series.viewCount === 'number' && (
            <div className="flex items-center gap-1 text-[11px] text-gray-600">
              <Eye size={12} weight="fill" />
              <span className="font-semibold">{series.viewCount}</span>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500">
          {series.description && (
            <span className="line-clamp-1 flex-1 mr-2">{series.description}</span>
          )}
          <span>{new Date(series.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
}

