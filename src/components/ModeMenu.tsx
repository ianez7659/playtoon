"use client";

import React from 'react';
import type { ViewMode } from '@/types/webtoonViewer';

interface ModeMenuProps {
  mode: ViewMode;
  isModeMenuOpen: boolean;
  onToggleMenu: () => void;
  onSelectMode: (newMode: ViewMode) => void;
  desktopModeMenuButtonsRef: React.MutableRefObject<(HTMLButtonElement | null)[]>;
  mobileModeMenuButtonsRef: React.MutableRefObject<(HTMLButtonElement | null)[]>;
}

export default function ModeMenu({
  mode,
  isModeMenuOpen,
  onToggleMenu,
  onSelectMode,
  desktopModeMenuButtonsRef,
  mobileModeMenuButtonsRef,
}: ModeMenuProps) {
  const modeLabels: Record<ViewMode, string> = {
    normal: 'Normal',
    scroll: 'Scroll',
    play: 'Play',
  };

  const getActiveButtonClass = (buttonMode: ViewMode) => {
    return mode === buttonMode
      ? 'bg-blue-600 border-2 border-blue-400'
      : 'bg-gray-800 border-2 border-white';
  };

  return (
    <>
      {/* Desktop Mode Menu */}
      <div className="hidden md:block relative">
        <button
          onClick={onToggleMenu}
          className="w-32 h-10 rounded-lg bg-gray-800 border-2 border-white hover:bg-gray-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
        >
          <span>{modeLabels[mode]}</span>
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${isModeMenuOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        
        {/* Mode Menu - Desktop: Expands downward, slides from right to left */}
        {isModeMenuOpen && (
          <div className="absolute right-0 top-full mt-2">
            <div className="flex flex-row items-center gap-2 flex-row-reverse border-2 border-white rounded-lg p-2 bg-gray-900/95 backdrop-blur-sm shadow-xl ring-2 ring-white/50">
              <button
                ref={(el) => { desktopModeMenuButtonsRef.current[0] = el; }}
                onClick={() => onSelectMode('play')}
                className={`w-32 h-10 rounded-lg border-2 hover:bg-gray-700 text-white font-medium shadow-lg hover:shadow-xl flex items-center justify-center ${getActiveButtonClass('play')}`}
                style={{ opacity: 0 }}
              >
                Play
              </button>
              <button
                ref={(el) => { desktopModeMenuButtonsRef.current[1] = el; }}
                onClick={() => onSelectMode('scroll')}
                className={`w-32 h-10 rounded-lg border-2 hover:bg-gray-700 text-white font-medium shadow-lg hover:shadow-xl flex items-center justify-center ${getActiveButtonClass('scroll')}`}
                style={{ opacity: 0 }}
              >
                Scroll
              </button>
              <button
                ref={(el) => { desktopModeMenuButtonsRef.current[2] = el; }}
                onClick={() => onSelectMode('normal')}
                className={`w-32 h-10 rounded-lg border-2 hover:bg-gray-700 text-white font-medium shadow-lg hover:shadow-xl flex items-center justify-center ${getActiveButtonClass('normal')}`}
                style={{ opacity: 0 }}
              >
                Normal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Mode Menu */}
      <div className="md:hidden relative">
        <button
          onClick={onToggleMenu}
          className="w-32 h-10 rounded-lg bg-gray-800 border-2 border-white hover:bg-gray-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
        >
          <span>{modeLabels[mode]}</span>
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${isModeMenuOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        
        {/* Mode Menu - Mobile: Accordion below */}
        {isModeMenuOpen && (
          <div className="absolute right-0 top-full mt-2 flex flex-col gap-2 bg-gray-800 border-2 border-white rounded-lg p-2 shadow-xl w-32">
            <button
              ref={(el) => { mobileModeMenuButtonsRef.current[0] = el; }}
              onClick={() => onSelectMode('normal')}
              className={`px-4 py-2 rounded-lg border-2 text-white hover:bg-gray-600 ${getActiveButtonClass('normal')}`}
              style={{ opacity: 0 }}
            >
              Normal
            </button>
            <button
              ref={(el) => { mobileModeMenuButtonsRef.current[1] = el; }}
              onClick={() => onSelectMode('scroll')}
              className={`px-4 py-2 rounded-lg border-2 text-white hover:bg-gray-600 ${getActiveButtonClass('scroll')}`}
              style={{ opacity: 0 }}
            >
              Scroll
            </button>
            <button
              ref={(el) => { mobileModeMenuButtonsRef.current[2] = el; }}
              onClick={() => onSelectMode('play')}
              className={`px-4 py-2 rounded-lg border-2 text-white hover:bg-gray-600 ${getActiveButtonClass('play')}`}
              style={{ opacity: 0 }}
            >
              Play
            </button>
          </div>
        )}
      </div>
    </>
  );
}

