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
  isAtBottom?: boolean;
  // Thumbnail drawer props
  isThumbnailDrawerOpen?: boolean;
  onToggleThumbnailDrawer?: () => void;
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
  isAtBottom = false,
  isThumbnailDrawerOpen = false,
  onToggleThumbnailDrawer,
}: ModeHeaderProps) {
  const modeLabels: Record<ViewMode, string> = {
    normal: 'Normal Mode',
    scroll: 'Scroll Mode',
    play: 'Play Mode',
  };

  // In scroll mode, always show header to prevent flicker
  const shouldHideHeader = mode === 'play' 
    ? isPlayingFromHook 
    : mode === 'scroll' 
      ? false // Always show in scroll mode
      : isUserScrolling;

  // Disable transition in scroll mode to prevent flicker
  const shouldDisableTransition = mode === 'scroll' || isAtBottom;

  return (
    <>
      {/* Top Bar: Minimal - Back | Mode Text | (Empty Space) */}
      <div className={`fixed top-0 left-0 right-0 bg-gray-700/50 z-[10002] shadow-none border-b border-gray-600 ${
        shouldDisableTransition ? '' : 'transition-transform duration-300'
      } ${
        shouldHideHeader
          ? '-translate-y-full opacity-0'
          : 'translate-y-0 opacity-100'
      }`}>
        <div className="flex items-center justify-between p-2 md:p-3">
          {/* Left: Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-gray-800 border-2 border-white hover:bg-gray-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
              title="Back"
            >
              <ArrowLeft size={20} weight="bold" className="md:w-6 md:h-6" />
            </button>
          )}

          {/* Center: Mode Text (Small) */}
          <h1 className="mode-text text-sm md:text-lg text-white font-semibold text-center flex-1">
            {modeLabels[mode]}
          </h1>

          {/* Right: Empty space for balance */}
          <div className="w-10 md:w-12"></div>
        </div>
      </div>

      {/* Bottom Bar: Fixed - Mode Controls | ModeMenu */}
      <div className={`fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm border-t border-gray-600 z-[10002] ${
        shouldDisableTransition ? '' : 'transition-transform duration-300'
      } ${
        shouldHideHeader
          ? 'translate-y-full opacity-0'
          : 'translate-y-0 opacity-100'
      }`}>
        <div className="flex items-center justify-between p-3 md:p-4">
          {/* Left: Mode-specific controls */}
          <div className="flex-1 flex items-center justify-center">
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
                onToggleThumbnailDrawer={onToggleThumbnailDrawer}
              />
            )}
          </div>

          {/* Right: ModeMenu */}
          <div className="flex items-center ml-4">
            <ModeMenu
              mode={mode}
              isModeMenuOpen={isModeMenuOpen}
              onToggleMenu={onToggleMenu}
              onSelectMode={onSelectMode}
              desktopModeMenuButtonsRef={desktopModeMenuButtonsRef}
              mobileModeMenuButtonsRef={mobileModeMenuButtonsRef}
            />
          </div>
        </div>
      </div>
    </>
  );
}

