"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { saveSeries, updateSeries, SeriesData, Genre } from '@/utils/webtoonStorage';
import { uploadImage } from '@/utils/imageStorage';

interface SeriesPageProps {
  seriesId: string;
  onSave: (seriesData: SeriesData) => void;
  seriesType?: 'amateur' | 'regular';
  initialData?: SeriesData;
}

export default function SeriesPage({ 
  seriesId, 
  onSave, 
  seriesType = 'regular',
  initialData 
}: SeriesPageProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [genre, setGenre] = useState<Genre | undefined>(initialData?.genre);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(initialData?.thumbnailUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const genreLabels: Record<Genre, string> = {
    'action': 'Action',
    'romance': 'Romance',
    'comedy': 'Comedy',
    'drama': 'Drama',
    'fantasy': 'Fantasy',
    'horror': 'Horror',
    'sci-fi': 'Sci-Fi',
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const path = `series/${seriesId}/thumbnail`;
      const url = await uploadImage(file, path);
      setThumbnailUrl(url);
    } catch (error) {
      console.error('Failed to upload thumbnail:', error);
      alert('Failed to upload thumbnail. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsSaving(true);
    try {
      const seriesData: SeriesData = {
        id: seriesId,
        title: title.trim(),
        description: description.trim(),
        thumbnailUrl,
        genre,
        type: seriesType,
        viewCount: initialData?.viewCount || 0,
        createdAt: initialData?.createdAt || new Date().toISOString(),
      };

      // If initialData exists, update; otherwise, create new
      if (initialData) {
        await updateSeries(seriesId, seriesData);
      } else {
        await saveSeries(seriesData);
      }
      onSave(seriesData);
    } catch (error) {
      console.error('Failed to save series:', error);
      alert('Failed to save series. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          {initialData ? 'Edit Series' : 'Create New Series'}
        </h1>

        {/* Title */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter series title"
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter series description"
          />
        </div>

        {/* Genre */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Genre
          </label>
          <select
            value={genre || ''}
            onChange={(e) => setGenre(e.target.value ? (e.target.value as Genre) : undefined)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a genre</option>
            {Object.entries(genreLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Thumbnail */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thumbnail
          </label>
          <div className="flex flex-col md:flex-row gap-4">
            {thumbnailUrl && (
              <div className="w-full md:w-48 h-64 md:h-48 bg-gray-100 rounded-lg overflow-hidden relative">
                <Image
                  src={thumbnailUrl}
                  alt="Thumbnail"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 192px"
                />
              </div>
            )}
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                disabled={isUploading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              />
              {isUploading && (
                <p className="mt-2 text-sm text-gray-500">Uploading...</p>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

