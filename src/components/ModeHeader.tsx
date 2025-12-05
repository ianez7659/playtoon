"use client";

import React from 'react';
import { ArrowLeft } from '@phosphor-icons/react';
import type { ViewMode } from '@/types/webtoonViewer';
import ModeMenu from './ModeMenu';
import PlayModeControls from './PlayModeControls';
import ScrollModeControls from './ScrollModeControls';
import NormalModeControls from './NormalModeControls';

interface ModeHeaderProps {
  mode: ViewMode;
  isModeMenuOpen: boolean;
  onToggleMenu: () => void;
  onSelectMode: (newMode: ViewMode) => void;
  onBack?: () => void;
  desktopModeMenuButtonsRef: React.MutableRefObject<(HTMLButtonElement | null)[]>;
  mobileModeMenuButtonsRef: React.MutableRefObject<(HTMLButtonElement | null)[]>;
  // Play mode props
  isPlaying?: boolean;
  onPlayPause?: () => void;
  // Normal mode props
  currentCut?: number;
  totalCuts?: number;
  onFirstCut?: () => void;
  onPrevCut?: () => void;
  onNextCut?: () => void;
  onLastCut?: () => void;
  // Visibility props
  isUserScrolling?: boolean;
  isPlayingFromHook?: boolean;
}

export default function ModeHeader({
  mode,
  isModeMenuOpen,
  onToggleMenu,
  onSelectMode,
  onBack,
  desktopModeMenuButtonsRef,
  mobileModeMenuButtonsRef,
  isPlaying,
  onPlayPause,
  currentCut,
  totalCuts,
  onFirstCut,
  onPrevCut,
  onNextCut,
  onLastCut,
  isUserScrolling = false,
  isPlayingFromHook = false,
}: ModeHeaderProps) {
  const modeLabels: Record<ViewMode, string> = {
    normal: 'Normal Mode',
    scroll: 'Scroll Mode',
    play: 'Play Mode',
  };

  const shouldHideHeader = mode === 'play' 
    ? isPlayingFromHook 
    : isUserScrolling;

  return (
    <div className={`fixed bg-gray-700/50 p-2 top-4 left-4 right-4 z-[10002] transition-transform duration-300 ${
      shouldHideHeader
        ? '-translate-y-full opacity-0'
        : 'translate-y-0 opacity-100'
    }`}>
      <div className="flex items-center justify-between relative">
        {/* Mode Text - Left (Desktop only) */}
        <h1 className="mode-text hidden md:block text-3xl md:text-6xl text-white">
          {modeLabels[mode]}
        </h1>
        
        {/* Mode-specific controls */}
        {mode === 'play' && isPlaying !== undefined && onPlayPause && (
          <PlayModeControls
            isPlaying={isPlaying}
            onPlayPause={onPlayPause}
            isModeMenuOpen={isModeMenuOpen}
          />
        )}
        
        {mode === 'scroll' && (
          <ScrollModeControls isModeMenuOpen={isModeMenuOpen} />
        )}
        
        {mode === 'normal' && 
          currentCut !== undefined && 
          totalCuts !== undefined &&
          onFirstCut && 
          onPrevCut && 
          onNextCut && 
          onLastCut && (
          <NormalModeControls
            currentCut={currentCut}
            totalCuts={totalCuts}
            onFirstCut={onFirstCut}
            onPrevCut={onPrevCut}
            onNextCut={onNextCut}
            onLastCut={onLastCut}
            isModeMenuOpen={isModeMenuOpen}
          />
        )}
        
        {/* Toggle Button and Back Button - Right */}
        <div className="flex items-center gap-2">
          <ModeMenu
            mode={mode}
            isModeMenuOpen={isModeMenuOpen}
            onToggleMenu={onToggleMenu}
            onSelectMode={onSelectMode}
            desktopModeMenuButtonsRef={desktopModeMenuButtonsRef}
            mobileModeMenuButtonsRef={mobileModeMenuButtonsRef}
          />

          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-gray-800 border-2 border-white hover:bg-gray-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
              title="Back"
            >
              <ArrowLeft size={24} weight="bold" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

