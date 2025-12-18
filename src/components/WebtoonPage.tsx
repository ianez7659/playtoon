"use client";

import React, { useState, useEffect } from 'react';
import { saveEpisode, updateEpisode, getEpisodeById, EpisodeData, CutData, AnimationType, OutEffectType, Genre } from '@/utils/webtoonStorage';
import { uploadImage, deleteImage, getStoragePathFromUrl } from '@/utils/imageStorage';
import WebtoonViewer from '@/components/WebtoonViewer';

interface WebtoonPageProps {
  cutCount: number;
  webtoonId: string; // episodeId
  seriesId: string; // Required for episode creation
  onSave?: () => void;
  webtoonType?: 'amateur' | 'regular'; // Type of webtoon being created
}

export default function WebtoonPage({ cutCount, webtoonId, seriesId, onSave, webtoonType = 'regular' }: WebtoonPageProps) {
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [cuts, setCuts] = useState<CutData[]>(
    Array.from({ length: cutCount }, () => ({ title: '', description: '', animationType: 'basic', duration: 3, type: 'image' }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingImages, setUploadingImages] = useState<Set<number>>(new Set());
  const [showPreview, setShowPreview] = useState(false);

  const genreLabels: Record<Genre, string> = {
    'action': 'Action',
    'romance': 'Romance',
    'comedy': 'Comedy',
    'drama': 'Drama',
    'fantasy': 'Fantasy',
    'horror': 'Horror',
    'sci-fi': 'Sci-Fi',
  };

  // Load existing episode data if editing
  useEffect(() => {
    const loadEpisode = async () => {
      setIsLoading(true);
      try {
        const existingEpisode = await getEpisodeById(webtoonId);
        if (existingEpisode) {
          setEpisodeTitle(existingEpisode.episodeTitle);
          setCuts(existingEpisode.cuts.length > 0 
            ? existingEpisode.cuts 
            : Array.from({ length: cutCount }, () => ({ title: '', description: '', animationType: 'basic', duration: 3, type: 'image' }))
          );
        } else {
          // New episode - initialize with empty cuts
          setCuts(Array.from({ length: cutCount }, () => ({ title: '', description: '', animationType: 'basic', duration: 3, type: 'image' })));
        }
      } catch (error) {
        console.error('Failed to load episode:', error);
        // Initialize with empty cuts even on error
        setCuts(Array.from({ length: cutCount }, () => ({ title: '', description: '', animationType: 'basic', duration: 3, type: 'image' })));
      } finally {
        setIsLoading(false);
      }
    };

    loadEpisode();
  }, [webtoonId, cutCount]);

  const handleCutChange = (index: number, field: keyof CutData, value: string | AnimationType) => {
    const updatedCuts = [...cuts];
    updatedCuts[index] = { ...updatedCuts[index], [field]: value };
    setCuts(updatedCuts);
  };

  const handleCutTypeChange = (index: number, type: 'image' | 'command-battle') => {
    const updatedCuts = [...cuts];
    updatedCuts[index] = { 
      ...updatedCuts[index], 
      type,
      // Set default values when changing to command-battle
      ...(type === 'command-battle' && {
        title: 'Command Battle',
        description: 'Interactive command battle scene'
      })
    };
    setCuts(updatedCuts);
  };

  const handleAnimationChange = (index: number, animationType: AnimationType) => {
    const updatedCuts = [...cuts];
    updatedCuts[index] = { ...updatedCuts[index], animationType };
    setCuts(updatedCuts);
  };

  const handleOutEffectChange = (index: number, outEffect: OutEffectType) => {
    const updatedCuts = [...cuts];
    updatedCuts[index] = { ...updatedCuts[index], outEffect };
    setCuts(updatedCuts);
  };

  const handleDurationChange = (index: number, duration: number) => {
    const updatedCuts = [...cuts];
    updatedCuts[index] = { ...updatedCuts[index], duration };
    setCuts(updatedCuts);
  };

  const handleImageUpload = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('handleImageUpload called:', { index, fileName: file.name, fileSize: file.size, webtoonId });

    setUploadingImages(prev => new Set(prev).add(index));

    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${webtoonId}_cut_${index}_${Date.now()}.${fileExt}`;
      const filePath = `episodes/${webtoonId}/cuts/${fileName}`;

      console.log('Uploading to path:', filePath);

      // Upload to Supabase Storage
      const imageUrl = await uploadImage(file, filePath);

      console.log('Upload successful, imageUrl:', imageUrl);

      // Update cuts state
      const updatedCuts = [...cuts];
      updatedCuts[index] = { ...updatedCuts[index], imageUrl };
      setCuts(updatedCuts);
    } catch (error: unknown) {
      console.error('Failed to upload image:', error);
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message)
          : 'Unknown error';
      alert(`Failed to upload image: ${errorMessage}. Please check the browser console for details.`);
    } finally {
      setUploadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const handleImageRemove = async (index: number) => {
    const updatedCuts = [...cuts];
    const imageUrl = updatedCuts[index].imageUrl;
    
    if (imageUrl) {
      try {
        // Delete from Supabase Storage if it's a Supabase URL
        const storagePath = getStoragePathFromUrl(imageUrl);
        if (storagePath) {
          await deleteImage(storagePath);
        }
      } catch (error) {
        console.error('Failed to delete image from storage:', error);
        // Continue with removal even if storage delete fails
      }
    }
    
    updatedCuts[index] = { ...updatedCuts[index], imageUrl: undefined };
    setCuts(updatedCuts);
  };

  const handleSave = async () => {
    if (!episodeTitle.trim()) {
      alert('Please enter an episode title');
      return;
    }

    try {
      // Get existing episode to preserve createdAt
      const existingEpisode = await getEpisodeById(webtoonId);
      
      const episodeData: EpisodeData = {
        id: webtoonId,
        seriesId: seriesId,
        episodeTitle: episodeTitle.trim(),
        cuts: cuts.filter(cut => cut.imageUrl || cut.type === 'command-battle'),
        createdAt: existingEpisode?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingEpisode) {
        await updateEpisode(webtoonId, episodeData);
        alert('Episode updated successfully!');
      } else {
        await saveEpisode(episodeData);
        alert('Episode saved successfully!');
      }
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to save episode:', error);
      alert('Failed to save episode. Please try again.');
    }
  };

  const handlePreview = () => {
    if (!episodeTitle.trim()) {
      alert('Please enter an episode title to preview');
      return;
    }

    setShowPreview(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Episode Editor</h1>
            <p className="text-gray-600">Episode ID: {webtoonId}</p>
          </div>
          <div className="text-sm text-gray-500">
            Total {cutCount} cuts
          </div>
        </div>

        {/* Episode information form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Episode Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Episode Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={episodeTitle}
              onChange={(e) => setEpisodeTitle(e.target.value)}
              placeholder="Enter episode title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
        </div>

        {/* Webtoon cuts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cuts.map((cut, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4">
              {/* Content area */}
              <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                {cut.type === 'command-battle' ? (
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2">⚔️</div>
                    <span className="text-gray-600 text-sm block">Command Battle</span>
                    <span className="text-gray-400 text-xs">Interactive battle scene</span>
                  </div>
                ) : uploadingImages.has(index) ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <span className="text-gray-400 text-xs">Uploading...</span>
                    </div>
                  </div>
                ) : cut.imageUrl ? (
                  <>
                    <img
                      src={cut.imageUrl}
                      alt={`Cut ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleImageRemove(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <span className="text-gray-400 text-sm block mb-2">Cut {index + 1}</span>
                    <label className="cursor-pointer bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors">
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(index, e)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
              
              {/* Cut information */}
              <div className="space-y-2">
                {/* Cut Type Selection */}
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => handleCutTypeChange(index, 'image')}
                    className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                      cut.type === 'image' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Image
                  </button>
                  <button
                    onClick={() => handleCutTypeChange(index, 'command-battle')}
                    className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                      cut.type === 'command-battle' 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Command Battle
                  </button>
                </div>

                <div className="w-full mt-4 mb-0 text-sm text-gray-700 font-medium">
                  Page {index + 1}
                </div>
                <textarea
                  value={cut.description}
                  onChange={(e) => handleCutChange(index, 'description', e.target.value)}
                  placeholder="Page Description"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                
                {/* Duration and Animation Controls */}
                <div className="flex gap-4 items-end">
                  {/* Duration Control */}
                  <div className="space-y-1 flex-1">
                    <label className="block text-xs font-medium text-gray-600">Page Duration:</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        step="0.5"
                        value={cut.duration || 3}
                        onChange={(e) => handleDurationChange(index, parseFloat(e.target.value))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                      <span className="text-xs text-gray-500">sec</span>
                    </div>
                  </div>
                  
                  {/* Animation Selection - Hidden for first cut */}
                  {index > 0 && (
                    <div className="space-y-1 flex-1">
                      <label className="block text-xs font-medium text-gray-600">In Effect:</label>
                      <select
                        value={cut.animationType || 'basic'}
                        onChange={(e) => handleAnimationChange(index, e.target.value as AnimationType)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="basic">Basic</option>
                        <option value="parallax">Parallax</option>
                        <option value="morphing">Morphing</option>
                        <option value="3d-flip">3D Flip</option>
                        <option value="physics">Physics</option>
                        <option value="timeline">Timeline</option>
                        <option value="texture">Texture</option>
                        <option value="smooth-scroll">Smooth Scroll</option>
                        <option value="blur-fade">Blur Fade</option>
                        <option value="ripple">Ripple</option>
                        <option value="shutter">Shutter / Panel Split</option>
                      </select>
                    </div>
                  )}
                  
                  {/* Out Effect Selection */}
                  <div className="space-y-1 flex-1">
                    <label className="block text-xs font-medium text-gray-600">Out Effect:</label>
                    <select
                      value={cut.outEffect || 'fade-out'}
                      onChange={(e) => handleOutEffectChange(index, e.target.value as OutEffectType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    >
                      <option value="fade-out">Fade Out</option>
                      <option value="slice">Slice</option>
                      <option value="zoom-out">Zoom Out</option>
                      <option value="slide-out">Slide Out</option>
                      <option value="shutter-out">Shutter Out</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total Duration Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Scroll Duration</h3>
            <p className="text-2xl font-bold text-blue-600">
              {cuts.reduce((total, cut) => total + (cut.duration || 3), 0)} seconds
            </p>
            <p className="text-sm text-gray-600 mt-1">
              ({Math.round(cuts.reduce((total, cut) => total + (cut.duration || 3), 0) / 60 * 100) / 100} minutes)
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-6 justify-center">
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Save
          </button>
          <button 
            onClick={handlePreview}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Preview
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90">
          <WebtoonViewer
            webtoonData={{
              id: webtoonId,
              title: episodeTitle,
              description: '',
              thumbnailUrl: undefined,
              cuts: cuts,
              createdAt: new Date().toISOString(),
            }}
            onBack={() => setShowPreview(false)}
          />
        </div>
      )}
    </div>
  );
}
