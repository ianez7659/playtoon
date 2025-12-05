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
    <>
      {/* Mobile: Scroll Mode Controls on Left - Hide when mode menu is open */}
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
      
      {/* Desktop: Center Scroll Mode Controls - Hide when mode menu is open */}
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

