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
    <>
      {/* Mobile: Play Mode Controls on Left - Hide when mode menu is open */}
      <div className={`flex md:hidden items-center gap-2 ${isModeMenuOpen ? 'invisible' : 'visible'}`}>
        {/* Previous Episode Button (<<) */}
        <button
          onClick={() => {
            // TODO: Navigate to previous episode
          }}
          className="p-2 rounded-lg border-2 border-white bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200 flex items-center justify-center"
          title="Previous Episode"
        >
          <CaretDoubleLeft size={18} weight="bold" />
        </button>

        {/* Play/Stop Button */}
        <button
          onClick={onPlayPause}
          className={`px-4 py-2 border-2 border-white rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
            isPlaying
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isPlaying ? (
            <Pause size={20} weight="fill" />
          ) : (
            <Play size={20} weight="fill" />
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
          <CaretDoubleRight size={18} weight="bold" />
        </button>
      </div>
      
      {/* Desktop: Center Play Mode Controls - Hide when mode menu is open */}
      {!isModeMenuOpen && (
        <div className="hidden md:flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
          {/* Previous Episode Button (<<) */}
          <button
            onClick={() => {
              // TODO: Navigate to previous episode
            }}
            className="p-2 rounded-lg border-2 border-white bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200 flex items-center justify-center"
            title="Previous Episode"
          >
            <CaretDoubleLeft size={18} weight="bold" />
          </button>

          {/* Play/Stop Button */}
          <button
            onClick={onPlayPause}
            className={`px-4 py-2 border-2 border-white rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
              isPlaying
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isPlaying ? (
              <Pause size={20} weight="fill" />
            ) : (
              <Play size={20} weight="fill" />
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
            <CaretDoubleRight size={18} weight="bold" />
          </button>
        </div>
      )}
    </>
  );
}

