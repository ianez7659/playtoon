"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Image as ImageIcon, DotsThreeVertical, X, Eye } from '@phosphor-icons/react';
import { WebtoonData, Genre } from '@/utils/webtoonStorage';
import MenuOverlay from './MenuOverlay';

interface WebtoonCardProps {
  webtoon: WebtoonData;
  onView: (webtoon: WebtoonData) => void;
  onEdit?: (webtoon: WebtoonData) => void;
  onDelete?: (webtoonId: string) => void;
  genreLabels?: Record<Genre, string>;
}

export default function WebtoonCard({ 
  webtoon, 
  onView, 
  onEdit, 
  onDelete,
  genreLabels 
}: WebtoonCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Use thumbnailUrl if available, otherwise use first image cut
  const thumbnailUrl = webtoon.thumbnailUrl || webtoon.cuts.find(cut => cut.imageUrl && cut.type !== 'command-battle')?.imageUrl;

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
    if (!isMenuOpen) {
      onView(webtoon);
    }
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleView = () => {
    setIsMenuOpen(false);
    onView(webtoon);
  };

  const handleEdit = () => {
    if (onEdit) {
      setIsMenuOpen(false);
      onEdit(webtoon);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      setIsMenuOpen(false);
      onDelete(webtoon.id);
    }
  };

  return (
    <div 
      className="group relative border border-gray-200 rounded-lg overflow-visible bg-white hover:shadow-xl transition-all duration-300 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Thumbnail */}
      <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
        {thumbnailUrl ? (
          <Image 
            src={thumbnailUrl} 
            alt={webtoon.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <ImageIcon size={48} className="text-gray-400" weight="thin" />
          </div>
        )}
        
        {/* Menu Button - Only show if onEdit or onDelete is provided */}
        {(onEdit || onDelete) && (
          <>
            <button
              onClick={handleMenuToggle}
              className="absolute top-2 right-2 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg白 transition-colors"
              aria-label="Menu"
            >
              {isMenuOpen ? (
                <X size={18} weight="bold" className="text-gray-900" />
              ) : (
                <DotsThreeVertical size={18} weight="bold" className="text-gray-900" />
              )}
            </button>
            
            {/* Overlay Menu */}
            <MenuOverlay 
              isOpen={isMenuOpen}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </>
        )}
      </div>
      
      {/* Card Footer */}
      <div className="p-3 bg-white">
        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">{webtoon.title}</h3>
        <div className="flex items-center justify-between mb-1">
          {webtoon.genre && (
            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
              {labels[webtoon.genre] || webtoon.genre}
            </span>
          )}
          {typeof webtoon.viewCount === 'number' && (
            <div className="flex items-center gap-1 text-[11px] text-gray-600">
              <Eye size={12} weight="fill" />
              <span className="font-semibold">{webtoon.viewCount}</span>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{webtoon.cuts.length} cuts</span>
          <span>{new Date(webtoon.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
}


