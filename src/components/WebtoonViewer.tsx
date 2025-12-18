"use client";

import React, { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimationType } from "@/utils/webtoonStorage";
import type { WebtoonData } from "@/utils/webtoonStorage";
import { incrementWebtoonViewCount, incrementSeriesViewCount, incrementEpisodeViewCount } from "@/utils/webtoonStorage";
import CommandBattle from "./CommandBattle";
import EncounterPortal from "./EncounterPortal";
import CutLayer from "./CutLayer";
import ModeHeader from "./ModeHeader";
import CutThumbnailGrid from "./CutThumbnailGrid";
import { useWebtoonScroll } from "@/hooks/useWebtoonScroll";
import { useModeToggle } from "@/hooks/useModeToggle";
import { useModeAnimation } from "@/hooks/useModeAnimation";
import { useScrollDetection } from "@/hooks/useScrollDetection";
import { CaretDoubleUp } from '@phosphor-icons/react';
import type { ViewMode } from "@/types/webtoonViewer";

interface WebtoonViewerProps {
  webtoonData: WebtoonData;
  onBack?: () => void;
  seriesId?: string; // Optional: for incrementing series view count
  episodeId?: string; // Optional: for incrementing episode view count
}

export default function WebtoonViewer({
  webtoonData,
  onBack,
  seriesId,
  episodeId,
}: WebtoonViewerProps) {
  const [currentCut, setCurrentCut] = useState(0);
  const [selectedAnimation, setSelectedAnimation] =
    useState<AnimationType>("basic");
  const [useIndividualAnimations, setUseIndividualAnimations] = useState(true);
  const [isBattleActive, setIsBattleActive] = useState(false);
  const [showEncounterPortal, setShowEncounterPortal] = useState(false);
  const [currentBattleCutIndex, setCurrentBattleCutIndex] = useState<number | null>(null);
  const [isThumbnailDrawerOpen, setIsThumbnailDrawerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cutRefs = useRef<(HTMLDivElement | null)[]>([]);
  const desktopModeMenuButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const mobileModeMenuButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const lastIncrementedKey = useRef<string | null>(null);

  // Increment view count when webtoon/episode is viewed (only once per episode)
  useEffect(() => {
    if (!webtoonData?.id) return;

    // Create a unique key for this episode/series combination
    const currentKey = seriesId && episodeId 
      ? `${seriesId}-${episodeId}` 
      : webtoonData.id;

    // Only increment if this is a new episode/series (not already incremented)
    if (lastIncrementedKey.current !== currentKey) {
      // If viewing an episode (has seriesId and episodeId), increment both series and episode view counts
      if (seriesId && episodeId) {
        incrementSeriesViewCount(seriesId);
        incrementEpisodeViewCount(episodeId);
        lastIncrementedKey.current = currentKey;
      } else {
        // Legacy: increment webtoon view count for backward compatibility
        incrementWebtoonViewCount(webtoonData.id);
        lastIncrementedKey.current = currentKey;
      }
    }
  }, [webtoonData?.id, seriesId, episodeId]);

  // Mode toggle hook (initialize mode first)
  const {
    mode,
    isModeMenuOpen,
    setIsModeMenuOpen,
    selectMode,
  } = useModeToggle({
    onModeChange: () => {
      setCurrentCut(0);
    },
  });

  // Use scroll animation hook (only for play mode, NOT for scroll mode)
  const {
    scrollTween,
    isPlaying,
    isScrolling,
    isScrolledDown,
    startScrollAnimation,
    stopScrollAnimation,
    resetScroll,
  } = useWebtoonScroll({
    webtoonData,
    useScrollAnimation: mode === 'play', // Only true for play mode
    selectedAnimation,
    useIndividualAnimations,
    cutRefs,
    isBattleActive,
    setCurrentBattleCutIndex,
    setShowEncounterPortal,
  });

  // Update mode toggle with scroll functions
  React.useEffect(() => {
    if (mode !== 'play') {
      stopScrollAnimation();
      resetScroll();
    }
    
    // Clean up GSAP properties when switching to scroll mode
    if (mode === 'scroll') {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      
      setTimeout(() => {
        cutRefs.current.forEach((cutRef) => {
          if (cutRef) {
            const cutContainer = cutRef.querySelector('.cut-container') as HTMLDivElement;
            if (cutContainer) {
              gsap.killTweensOf(cutContainer);
              gsap.set(cutContainer, {
                clearProps: "all",
              });
            }
          }
        });
      }, 50);
    }
  }, [mode, stopScrollAnimation, resetScroll]);

  // Scroll detection hook
  const { isUserScrolling, isAtBottom } = useScrollDetection(mode);

  // Mode animation hook
  useModeAnimation({
    isModeMenuOpen,
    mode,
    containerRef,
    desktopModeMenuButtonsRef,
    mobileModeMenuButtonsRef,
  });

  // EncounterPortal handler functions
  const handleEncounterStart = () => {
    setShowEncounterPortal(false);
    setIsBattleActive(true);
  };

  const handleBattleEnd = (winner: { name: string }) => {
    console.log('Battle ended! Winner:', winner.name);
    setIsBattleActive(false);
    setCurrentBattleCutIndex(null);
    
    // Scroll resumption is handled by the hook when battle ends
  };

  const nextCut = () => {
    if (currentCut < webtoonData.cuts.length - 1) {
      setCurrentCut(currentCut + 1);
    }
  };

  const prevCut = () => {
    if (currentCut > 0) {
      setCurrentCut(currentCut - 1);
    }
  };

  const goToCut = (index: number) => {
    setCurrentCut(index);
  };

  const goToFirstCut = () => {
    setCurrentCut(0);
  };

  const goToLastCut = () => {
    setCurrentCut(webtoonData.cuts.length - 1);
  };

  return (
    <div className="min-h-screen bg-black text-white" ref={containerRef}>
      {/* Mode Display and Toggle Button - Top */}
      {!isBattleActive && (
        <ModeHeader
          mode={mode}
          isModeMenuOpen={isModeMenuOpen}
          onToggleMenu={() => setIsModeMenuOpen(!isModeMenuOpen)}
          onSelectMode={selectMode}
          onBack={onBack}
          desktopModeMenuButtonsRef={desktopModeMenuButtonsRef}
          mobileModeMenuButtonsRef={mobileModeMenuButtonsRef}
          isPlaying={isPlaying}
          onPlayPause={isPlaying ? stopScrollAnimation : startScrollAnimation}
          currentCut={currentCut}
          totalCuts={webtoonData.cuts.length}
          onFirstCut={goToFirstCut}
          onPrevCut={prevCut}
          onNextCut={nextCut}
          onLastCut={goToLastCut}
          isUserScrolling={isUserScrolling}
          isAtBottom={isAtBottom}
          isPlayingFromHook={isPlaying}
          isThumbnailDrawerOpen={isThumbnailDrawerOpen}
          onToggleThumbnailDrawer={() => setIsThumbnailDrawerOpen(!isThumbnailDrawerOpen)}
        />
      )}

      {/* Main content area */}
      <div className="w-full">
        {mode === 'scroll' ? (
          /* Scroll mode - simple vertical stacking, NO animations */
          <div className="w-full" style={{ position: 'relative' }}>
            {webtoonData.cuts.map((cut, index) => {
              const cutWithType = { ...cut, type: cut.type || 'image' };
              
              return (
                <div
                  key={index}
                  ref={(el) => {
                    cutRefs.current[index] = el as HTMLDivElement;
                  }}
                  style={{
                    width: '100%',
                    height: 'auto',
                    minHeight: index === webtoonData.cuts.length - 1 
                      ? undefined // Remove minHeight for last cut
                      : '100vh',
                    position: 'relative',
                    margin: 0,
                    padding: 0,
                    paddingBottom: index === webtoonData.cuts.length - 1 ? '9vh' : undefined, // Add 9vh padding for last cut on mobile
                  }}
                  className={index === webtoonData.cuts.length - 1 ? 'last-cut-mobile' : ''}
                >
                  <CutLayer
                    cut={cut}
                    index={index}
                    totalCuts={webtoonData.cuts.length}
                    setRef={(el) => {}}
                    isBattleActive={isBattleActive}
                    currentBattleCutIndex={currentBattleCutIndex}
                    onBattleEnd={(winner) => {
                      console.log('Battle ended! Winner:', winner.name);
                      setIsBattleActive(false);
                    }}
                    animationType="basic"
                    isPlaying={false}
                    mode="scroll"
                  />
                </div>
              );
            })}
          </div>
        ) : mode === 'play' ? (
          /* Play mode - fixed position layering, no scroll */
          <div className="relative w-full" style={{ marginTop: 0, paddingTop: 0, height: '100vh', overflow: 'hidden' }}>
            {webtoonData.cuts.map((cut, index) => (
              <section
                key={index}
                ref={(el) => {
                  cutRefs.current[index] = el as HTMLDivElement;
                }}
                className="cut-section"
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100vh',
                  minHeight: '100vh',
                  maxHeight: '100vh',
                  overflow: 'hidden',
                  margin: 0,
                  padding: 0,
                }}
              >
                <CutLayer
                  cut={cut}
                  index={index}
                  totalCuts={webtoonData.cuts.length}
                  setRef={(el) => {
                    // CutLayer's setRef is used for the inner cut-container
                    // The section ref is already stored above
                  }}
                  isBattleActive={isBattleActive}
                  currentBattleCutIndex={currentBattleCutIndex}
                  onBattleEnd={handleBattleEnd}
                  animationType={useIndividualAnimations ? (cut.animationType || "basic") : selectedAnimation}
                  isPlaying={isPlaying}
                />
              </section>
            ))}
          </div>
        ) : (
          mode === 'normal' && (
          /* Normal mode - single cut with navigation */
            <div className="relative w-full" style={{ marginTop: 0, paddingTop: 0, height: '100vh', overflow: 'hidden' }}>
              <section
                className="cut-section"
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100vh',
                  minHeight: '100vh',
                  maxHeight: '100vh',
                  overflow: 'hidden',
                  margin: 0,
                  padding: 0,
                }}
              >
                <CutLayer
                  cut={webtoonData.cuts[currentCut]}
                  index={currentCut}
                  totalCuts={webtoonData.cuts.length}
                  setRef={(el) => {
                    // Ref is handled by CutLayer internally
                  }}
                  isBattleActive={isBattleActive}
                  currentBattleCutIndex={currentBattleCutIndex}
                  onBattleEnd={(winner) => {
                    console.log('Battle ended! Winner:', winner.name);
                    setIsBattleActive(false);
                  }}
                  animationType={useIndividualAnimations ? (webtoonData.cuts[currentCut].animationType || "basic") : selectedAnimation}
                  isPlaying={false}
                />
              </section>
            </div>
          )
        )}

        {/* Cut thumbnails drawer - only show in normal mode */}
        {mode === 'normal' && (
          <CutThumbnailGrid
            webtoonData={webtoonData}
            currentCut={currentCut}
            onCutSelect={(index) => {
              goToCut(index);
              setIsThumbnailDrawerOpen(false);
            }}
            isOpen={isThumbnailDrawerOpen}
            onClose={() => setIsThumbnailDrawerOpen(false)}
          />
        )}

        {/* Webtoon information panel */}
        {/* <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Webtoon Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">ID:</span>
              <span className="ml-2">{webtoonData.id}</span>
            </div>
            <div>
              <span className="text-gray-400">Created:</span>
              <span className="ml-2">
                {new Date(webtoonData.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Total Cuts:</span>
              <span className="ml-2">{webtoonData.cuts.length}</span>
            </div>
          </div>
        </div> */}
        </div>

      {/* Fixed Reset Button - only visible when scrolled down, above bottom menu (Play mode only) */}
      {mode === 'play' && isScrolledDown && !isBattleActive && (
        <button
          onClick={resetScroll}
          className="fixed bottom-24 right-6 z-[10003] p-3 rounded-full  border-2 border-white bg-gray-600 text-white hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
          title="Reset to Top"
        >
          <CaretDoubleUp size={24} weight="bold" />
        </button>
      )}

      {/* EncounterPortal - displayed when battle cut is reached */}
      {showEncounterPortal && (
        <EncounterPortal onEncounter={handleEncounterStart} />
      )}
    </div>
  );
}
