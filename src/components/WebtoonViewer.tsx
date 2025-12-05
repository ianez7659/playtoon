"use client";

import React, { useState, useRef } from "react";
import { AnimationType } from "@/utils/webtoonStorage";
import type { WebtoonData } from "@/utils/webtoonStorage";
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
}

export default function WebtoonViewer({
  webtoonData,
  onBack,
}: WebtoonViewerProps) {
  const [currentCut, setCurrentCut] = useState(0);
  const [selectedAnimation, setSelectedAnimation] =
    useState<AnimationType>("basic");
  const [useIndividualAnimations, setUseIndividualAnimations] = useState(true);
  const [isBattleActive, setIsBattleActive] = useState(false);
  const [showEncounterPortal, setShowEncounterPortal] = useState(false);
  const [currentBattleCutIndex, setCurrentBattleCutIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cutRefs = useRef<(HTMLDivElement | null)[]>([]);
  const desktopModeMenuButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const mobileModeMenuButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);

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

  // Use scroll animation hook (only for play mode)
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
    useScrollAnimation: mode === 'play',
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
  }, [mode, stopScrollAnimation, resetScroll]);

  // Scroll detection hook
  const isUserScrolling = useScrollDetection(mode);

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
          isPlayingFromHook={isPlaying}
        />
      )}

      {/* Main content area */}
      <div className={mode === 'scroll' ? 'w-full' : mode === 'play' ? 'w-full' : 'max-w-4xl mx-auto px-4 py-8 pb-24'}>
        {mode === 'scroll' ? (
          /* Scroll mode - sequential cuts with sticky positioning */
          <div className="relative w-full">
            {webtoonData.cuts.map((cut, index) => {
              const cutWithType = { ...cut, type: cut.type || 'image' };
              const cutAnimationType = useIndividualAnimations
                ? cut?.animationType || "basic"
                : selectedAnimation;
              
              return (
                <div
                  key={index}
                  style={{
                    height: '100vh',
                    width: '100%',
                  }}
                >
                  <section
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
                        // cut-container is inside CutLayer, so we need to set it differently
                        // The ref is already set on the section element above
                      }}
                      isBattleActive={isBattleActive}
                      currentBattleCutIndex={currentBattleCutIndex}
                      onBattleEnd={(winner) => {
                        console.log('Battle ended! Winner:', winner.name);
                        setIsBattleActive(false);
                      }}
                      animationType={cutAnimationType}
                      isPlaying={false}
                    />
                  </section>
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
            <div className="mb-2">
              <div className="rounded-lg p-4 mb-4">
                <div className="w-full h-[70vh] flex items-center justify-center">
                  {(() => {
                    const currentCutData = { ...webtoonData.cuts[currentCut], type: webtoonData.cuts[currentCut].type || 'image' };
                    console.log('Current cut in normal mode:', currentCutData);
                    
                    return currentCutData.type === 'command-battle' ? (
                      <div className="w-full h-full">
                        <CommandBattle
                          player1={{
                            id: 'player1',
                            name: 'Hero',
                            hp: 100,
                            maxHp: 100,
                            attack: 25,
                            defense: 10
                          }}
                          player2={{
                            id: 'player2',
                            name: 'Enemy',
                            hp: 80,
                            maxHp: 80,
                            attack: 20,
                            defense: 8
                          }}
                          onBattleStart={() => {
                            setIsBattleActive(true);
                          }}
                          onBattleEnd={(winner) => {
                            console.log('Battle ended! Winner:', winner.name);
                            setIsBattleActive(false);
                          }}
                        />
                      </div>
                    ) : currentCutData.imageUrl ? (
                      <img
                        src={currentCutData.imageUrl}
                    alt={`Cut ${currentCut + 1}`}
                        className="max-w-full max-h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    {/* <div className="text-4xl mb-2">📖</div> */}
                    <p>Cut {currentCut + 1}</p>
                  </div>
                    );
                  })()}
              </div>
              
                {/* <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">
                    {webtoonData.cuts[currentCut].title ||
                      `Cut ${currentCut + 1}`}
                </h2>
                {webtoonData.cuts[currentCut].description && (
                  <p className="text-gray-300">
                    {webtoonData.cuts[currentCut].description}
                  </p>
                )}
                </div> */}
              </div>
            </div>
          )
        )}

        {/* Cut thumbnails grid - only show in normal mode */}
        {mode === 'normal' && (
          <CutThumbnailGrid
            webtoonData={webtoonData}
            currentCut={currentCut}
            onCutSelect={goToCut}
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
