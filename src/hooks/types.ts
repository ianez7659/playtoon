import React from "react";
import { gsap } from "gsap";
import { AnimationType, WebtoonData } from "@/utils/webtoonStorage";

export interface UseWebtoonScrollProps {
  webtoonData: WebtoonData;
  useScrollAnimation: boolean;
  selectedAnimation: AnimationType;
  useIndividualAnimations: boolean;
  cutRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  isBattleActive: boolean;
  setCurrentBattleCutIndex: (index: number | null) => void;
  setShowEncounterPortal: (show: boolean) => void;
}

export interface UseWebtoonScrollReturn {
  scrollTween: gsap.core.Tween | null;
  isPlaying: boolean;
  isScrolling: boolean;
  isScrolledDown: boolean;
  startScrollAnimation: () => void;
  stopScrollAnimation: () => void;
  resetScroll: () => void;
}

