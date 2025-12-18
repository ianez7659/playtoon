"use client";

import React from 'react';
import { CaretDoubleLeft, CaretDoubleRight, Play, Pause } from '@phosphor-icons/react';

interface PlayModeControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  isModeMenuOpen: boolean;
}

export default function PlayModeControls({
  isPlaying,
  onPlayPause,
  isModeMenuOpen,
}: PlayModeControlsProps) {
  return (
    <div className="flex items-center gap-2 justify-center w-full">
      {/* Previous Episode Button (<<) */}
      <button
        onClick={() => {
          // TODO: Navigate to previous episode
        }}
        className="p-2 rounded-lg border-2 border-white bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200 flex items-center justify-center"
        title="Previous Episode"
      >
        <CaretDoubleLeft size={18} weight="bold" className="md:w-5 md:h-5" />
      </button>

      {/* Play/Stop Button */}
      <button
        onClick={onPlayPause}
        className={`px-4 py-2 md:px-6 md:py-3 border-2 border-white rounded-lg font-semibold text-sm md:text-base transition-all duration-200 flex items-center gap-2 ${
          isPlaying
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {isPlaying ? (
          <Pause size={20} weight="fill" className="md:w-6 md:h-6" />
        ) : (
          <Play size={20} weight="fill" className="md:w-6 md:h-6" />
        )}
      </button>

      {/* Next Episode Button (>>) */}
      <button
        onClick={() => {
          // TODO: Navigate to next episode
        }}
        className="p-2 rounded-lg border-2 border-white bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200 flex items-center justify-center"
        title="Next Episode"
      >
        <CaretDoubleRight size={18} weight="bold" className="md:w-5 md:h-5" />
      </button>
    </div>
  );
}

