"use client";

import React from 'react';
import { CaretLeft, CaretRight, CaretDoubleLeft, CaretDoubleRight, GridFour } from '@phosphor-icons/react';

interface NormalModeControlsProps {
  currentCut: number;
  totalCuts: number;
  onFirstCut: () => void;
  onPrevCut: () => void;
  onNextCut: () => void;
  onLastCut: () => void;
  isModeMenuOpen: boolean;
  onToggleThumbnailDrawer?: () => void;
}

export default function NormalModeControls({
  currentCut,
  totalCuts,
  onFirstCut,
  onPrevCut,
  onNextCut,
  onLastCut,
  isModeMenuOpen,
  onToggleThumbnailDrawer,
}: NormalModeControlsProps) {
  const isFirstCut = currentCut === 0;
  const isLastCut = currentCut >= totalCuts - 1;

  const buttonClass = (disabled: boolean) =>
    `p-2 rounded-lg border-2 border-white transition-all duration-200 flex items-center justify-center ${
      disabled
        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
        : 'bg-gray-700 hover:bg-gray-600 text-white'
    }`;

  return (
    <div className="flex items-center gap-2 justify-center w-full">
      <button
        onClick={onFirstCut}
        disabled={isFirstCut}
        className={buttonClass(isFirstCut)}
        title="First Page"
      >
        <CaretDoubleLeft size={18} weight="bold" className="md:w-5 md:h-5" />
      </button>

      <button
        onClick={onPrevCut}
        disabled={isFirstCut}
        className={buttonClass(isFirstCut)}
        title="Previous Page"
      >
        <CaretLeft size={18} weight="bold" className="md:w-5 md:h-5" />
      </button>

      <button
        onClick={onNextCut}
        disabled={isLastCut}
        className={buttonClass(isLastCut)}
        title="Next Page"
      >
        <CaretRight size={18} weight="bold" className="md:w-5 md:h-5" />
      </button>

      <button
        onClick={onLastCut}
        disabled={isLastCut}
        className={buttonClass(isLastCut)}
        title="Last Page"
      >
        <CaretDoubleRight size={18} weight="bold" className="md:w-5 md:h-5" />
      </button>

      {onToggleThumbnailDrawer && (
        <button
          onClick={onToggleThumbnailDrawer}
          className="p-2 rounded-lg border-2 border-white bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200"
          title="Show Thumbnails"
        >
          <GridFour size={18} weight="bold" className="md:w-5 md:h-5" />
        </button>
      )}
    </div>
  );
}

