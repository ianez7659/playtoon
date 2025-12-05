"use client";

import React from 'react';
import { CaretLeft, CaretRight, CaretDoubleLeft, CaretDoubleRight } from '@phosphor-icons/react';

interface NormalModeControlsProps {
  currentCut: number;
  totalCuts: number;
  onFirstCut: () => void;
  onPrevCut: () => void;
  onNextCut: () => void;
  onLastCut: () => void;
  isModeMenuOpen: boolean;
}

export default function NormalModeControls({
  currentCut,
  totalCuts,
  onFirstCut,
  onPrevCut,
  onNextCut,
  onLastCut,
  isModeMenuOpen,
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
    <>
      {/* Mobile: Normal Mode Controls on Left - Hide when mode menu is open */}
      <div className={`flex md:hidden items-center gap-2 ${isModeMenuOpen ? 'invisible' : 'visible'}`}>
        <button
          onClick={onFirstCut}
          disabled={isFirstCut}
          className={buttonClass(isFirstCut)}
          title="First Page"
        >
          <CaretDoubleLeft size={18} weight="bold" />
        </button>

        <button
          onClick={onPrevCut}
          disabled={isFirstCut}
          className={buttonClass(isFirstCut)}
          title="Previous Page"
        >
          <CaretLeft size={18} weight="bold" />
        </button>

        <button
          onClick={onNextCut}
          disabled={isLastCut}
          className={buttonClass(isLastCut)}
          title="Next Page"
        >
          <CaretRight size={18} weight="bold" />
        </button>

        <button
          onClick={onLastCut}
          disabled={isLastCut}
          className={buttonClass(isLastCut)}
          title="Last Page"
        >
          <CaretDoubleRight size={18} weight="bold" />
        </button>
      </div>
      
      {/* Desktop: Center Normal Mode Controls - Hide when mode menu is open */}
      {!isModeMenuOpen && (
        <div className="hidden md:flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
          <button
            onClick={onFirstCut}
            disabled={isFirstCut}
            className={buttonClass(isFirstCut)}
            title="First Page"
          >
            <CaretDoubleLeft size={18} weight="bold" />
          </button>

          <button
            onClick={onPrevCut}
            disabled={isFirstCut}
            className={buttonClass(isFirstCut)}
            title="Previous Page"
          >
            <CaretLeft size={18} weight="bold" />
          </button>

          <button
            onClick={onNextCut}
            disabled={isLastCut}
            className={buttonClass(isLastCut)}
            title="Next Page"
          >
            <CaretRight size={18} weight="bold" />
          </button>

          <button
            onClick={onLastCut}
            disabled={isLastCut}
            className={buttonClass(isLastCut)}
            title="Last Page"
          >
            <CaretDoubleRight size={18} weight="bold" />
          </button>
        </div>
      )}
    </>
  );
}

