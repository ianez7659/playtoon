"use client";

import React from 'react';
import { CaretDoubleLeft, CaretDoubleRight } from '@phosphor-icons/react';

interface ScrollModeControlsProps {
  isModeMenuOpen: boolean;
}

export default function ScrollModeControls({
  isModeMenuOpen,
}: ScrollModeControlsProps) {
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

