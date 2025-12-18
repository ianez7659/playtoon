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
        {/* Container with border that expands upward - Wraps both button and menu */}
        <div 
          className={`border-2 border-white rounded-lg bg-gray-800/95 backdrop-blur-sm shadow-xl transition-all duration-300 ease-out overflow-hidden flex flex-col ${
            isModeMenuOpen ? 'shadow-2xl ring-2 ring-white/50' : ''
          }`}
          style={{
            maxHeight: isModeMenuOpen ? '200px' : '2.5rem',
            minHeight: '2.5rem',
            transition: 'max-height 0.3s ease-out',
          }}
        >
          {/* Mode Menu - Desktop: Accordion expands upward */}
          <div 
            className={`overflow-hidden transition-all duration-300 ease-out ${
              isModeMenuOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
            }`}
            style={{
              transform: isModeMenuOpen ? 'translateY(0)' : 'translateY(-10px)',
            }}
          >
            <div className="flex flex-row items-center gap-2 flex-row-reverse p-2">
              <button
                ref={(el) => { desktopModeMenuButtonsRef.current[0] = el; }}
                onClick={() => onSelectMode('play')}
                className={`w-32 h-10 rounded-lg border-2 hover:bg-gray-700 text-white font-medium shadow-lg hover:shadow-xl flex items-center justify-center ${getActiveButtonClass('play')}`}
                style={{ opacity: isModeMenuOpen ? 1 : 0 }}
              >
                Play
              </button>
              <button
                ref={(el) => { desktopModeMenuButtonsRef.current[1] = el; }}
                onClick={() => onSelectMode('scroll')}
                className={`w-32 h-10 rounded-lg border-2 hover:bg-gray-700 text-white font-medium shadow-lg hover:shadow-xl flex items-center justify-center ${getActiveButtonClass('scroll')}`}
                style={{ opacity: isModeMenuOpen ? 1 : 0 }}
              >
                Scroll
              </button>
              <button
                ref={(el) => { desktopModeMenuButtonsRef.current[2] = el; }}
                onClick={() => onSelectMode('normal')}
                className={`w-32 h-10 rounded-lg border-2 hover:bg-gray-700 text-white font-medium shadow-lg hover:shadow-xl flex items-center justify-center ${getActiveButtonClass('normal')}`}
                style={{ opacity: isModeMenuOpen ? 1 : 0 }}
              >
                Normal
              </button>
            </div>
          </div>
          
          {/* Toggle Button - Always visible at bottom, aligned to right */}
          <div className="flex justify-end items-center pr-2 py-2" style={{ minHeight: '2rem' }}>
            <button
              onClick={onToggleMenu}
              className="w-32 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-all duration-300 flex items-center justify-center gap-2"
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
          </div>
        </div>
      </div>

      {/* Mobile Mode Menu */}
      <div className="md:hidden relative">
        {/* Container with border that expands upward - Wraps both button and menu */}
        <div 
          className={`border-2 border-white rounded-lg bg-gray-800/95 backdrop-blur-sm shadow-xl transition-all duration-300 ease-out overflow-hidden ${
            isModeMenuOpen ? 'shadow-2xl ring-2 ring-white/50' : ''
          }`}
          style={{
            maxHeight: isModeMenuOpen ? '200px' : '2.5rem',
            transition: 'max-height 0.3s ease-out',
          }}
        >
          {/* Mode Menu - Mobile: Accordion expands upward */}
          <div 
            className={`overflow-hidden transition-all duration-300 ease-out ${
              isModeMenuOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
            }`}
            style={{
              transform: isModeMenuOpen ? 'translateY(0)' : 'translateY(-10px)',
            }}
          >
            <div className="flex flex-col gap-2 p-2">
              <button
                ref={(el) => { mobileModeMenuButtonsRef.current[0] = el; }}
                onClick={() => onSelectMode('normal')}
                className={`px-4 py-2 rounded-lg border-2 text-white hover:bg-gray-600 ${getActiveButtonClass('normal')}`}
                style={{ opacity: isModeMenuOpen ? 1 : 0 }}
              >
                Normal
              </button>
              <button
                ref={(el) => { mobileModeMenuButtonsRef.current[1] = el; }}
                onClick={() => onSelectMode('scroll')}
                className={`px-4 py-2 rounded-lg border-2 text-white hover:bg-gray-600 ${getActiveButtonClass('scroll')}`}
                style={{ opacity: isModeMenuOpen ? 1 : 0 }}
              >
                Scroll
              </button>
              <button
                ref={(el) => { mobileModeMenuButtonsRef.current[2] = el; }}
                onClick={() => onSelectMode('play')}
                className={`px-4 py-2 rounded-lg border-2 text-white hover:bg-gray-600 ${getActiveButtonClass('play')}`}
                style={{ opacity: isModeMenuOpen ? 1 : 0 }}
              >
                Play
              </button>
            </div>
          </div>
          
          {/* Toggle Button - Always visible at bottom */}
          <button
            onClick={onToggleMenu}
            className="w-full h-10 rounded-lg hover:bg-gray-700 text-white font-medium transition-all duration-300 flex items-center justify-center gap-2 px-4"
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
        </div>
      </div>
    </>
  );
}

