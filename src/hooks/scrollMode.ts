import { RefObject, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimationType, WebtoonData } from "@/utils/webtoonStorage";
import { ANIMATION_CONFIGS } from "@/utils/animationConfigs";
import { setCutInitialState } from "@/utils/animationHelpers";
import { Z_INDEX_BASE } from "./constants";

interface ScrollModeParams {
  webtoonData: WebtoonData;
  cutRefs: RefObject<(HTMLDivElement | null)[]>;
  selectedAnimation: AnimationType;
  useIndividualAnimations: boolean;
  useScrollAnimation: boolean;
  scrollTweenRef: React.MutableRefObject<gsap.core.Tween | null>;
  setScrollTween: (tween: gsap.core.Tween | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentBattleCutIndex: (index: number | null) => void;
  setShowEncounterPortal: (show: boolean) => void;
  isPlayingRef: React.MutableRefObject<boolean>;
  lenisRef: React.MutableRefObject<any>;
}

/**
 * Apply animation to a cut based on animation type
 * Handles both scroll mode and play mode animations
 */
export function applyAnimation(
  cutRef: HTMLDivElement,
  animationType: AnimationType,
  index: number,
  params: ScrollModeParams
) {
  const { webtoonData, cutRefs, useScrollAnimation, selectedAnimation, useIndividualAnimations, setCurrentBattleCutIndex, setShowEncounterPortal, scrollTweenRef, isPlayingRef, lenisRef } = params;
  
  // Safety check for array bounds
  if (!webtoonData.cuts || index >= webtoonData.cuts.length) {
    console.error(
      `Cut index ${index} is out of bounds. Cuts length: ${
        webtoonData.cuts?.length || 0
      }`
    );
    return gsap.to(cutRef, {
      opacity: 1,
      duration: 3,
    });
  }

  // Section-based approach: each cut is a section with its own ScrollTrigger
  const currentCut = webtoonData.cuts[index];
  const cutDuration = currentCut.duration || 3;
  
  // Find the cut-container inside the section
  const cutContainer = cutRef.querySelector('.cut-container') as HTMLDivElement;
  if (!cutContainer) {
    console.warn(`Cut container not found for index ${index}`);
    return gsap.to(cutRef, { opacity: 1, duration: 0.3 });
  }

  // In play mode, use fixed position layering - no scroll, just time-based transitions
  // All cuts are fixed on screen, new cuts slide down from top covering previous ones
  if (useScrollAnimation) {
    // Set cut-container to fixed position so it stays on screen
    gsap.set(cutContainer, { 
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      immediateRender: true 
    });
    
    const currentCut = webtoonData.cuts[index];
    const cutAnimationType = useIndividualAnimations
      ? currentCut?.animationType || "basic"
      : selectedAnimation;
    
    // Set initial state based on animation type using helper function
    setCutInitialState(
      cutContainer,
      cutAnimationType,
      index,
      webtoonData.cuts.length,
      index === 0,
      Z_INDEX_BASE
    );
    
    // Return dummy animation - actual animations are controlled by timeline in startHoldBasedScroll
    return gsap.to(cutContainer, { duration: 0, immediateRender: false });
  }

  // ============================================
  // Scroll Mode - No animation, just display
  // ============================================

  // Scroll mode: no animation, just set to visible state
  gsap.set(cutContainer, { opacity: 1, scale: 1 });
  return gsap.to(cutContainer, { duration: 0, immediateRender: false });
}

/**
 * Setup scroll animations when scroll mode is enabled
 * Returns a useEffect hook function
 */
export function useScrollModeSetup(params: ScrollModeParams) {
  const {
    webtoonData,
    cutRefs,
    selectedAnimation,
    useIndividualAnimations,
    useScrollAnimation,
    scrollTweenRef,
    setScrollTween,
    setIsPlaying,
  } = params;

  useEffect(() => {
    if (useScrollAnimation && cutRefs.current.length > 0) {
      // Kill existing animations before setting up new ones
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

      // Stop any existing scroll animation when changing animations
      if (scrollTweenRef.current) {
        scrollTweenRef.current.kill();
        setScrollTween(null);
        setIsPlaying(false);
      }

      cutRefs.current.forEach((cutRef, index) => {
        if (cutRef && webtoonData.cuts[index]) {
          const animationType = useIndividualAnimations
            ? webtoonData.cuts[index].animationType || "basic"
            : selectedAnimation;
          const animation = applyAnimation(cutRef, animationType, index, params);
          
          // First cut: no animation, already visible
          // Skip animation for first cut (index === 0)
        }
      });

      // Refresh ScrollTrigger to recognize initial state (especially for first cut and mobile)
      setTimeout(() => {
        // Force refresh for mobile devices
        ScrollTrigger.refresh(true); // Force recalculation
        
        // Additional refresh after a short delay for mobile viewport calculation
        if (window.innerWidth < 768) {
          setTimeout(() => {
            ScrollTrigger.refresh(true);
          }, 100);
        }
        
        // First cut: ensure it's visible without animation
        const firstCutRef = cutRefs.current[0];
        if (firstCutRef && webtoonData.cuts[0]) {
          const cutContainer = firstCutRef.querySelector('.cut-container') as HTMLDivElement;
          if (cutContainer) {
            const animationType = useIndividualAnimations
              ? webtoonData.cuts[0].animationType || "basic"
              : selectedAnimation;
            
            // Set first cut to visible state directly (no animation)
            const config = ANIMATION_CONFIGS[animationType];
            
            if (animationType === "shutter") {
              const firstShutterStrips = cutContainer.querySelectorAll('.shutter-strip');
              if (firstShutterStrips.length > 0) {
                gsap.set(firstShutterStrips, { yPercent: 0, opacity: 1 });
              }
              gsap.set(cutContainer, { opacity: 1 });
            } else if (animationType === "slice") {
              gsap.set(cutContainer, { opacity: 1, scale: 1 });
            } else {
              gsap.set(cutContainer, { ...config.scroll.final, opacity: 1 });
            }
          }
        }
      }, 200);
    }
  }, [
    useScrollAnimation,
    selectedAnimation,
    useIndividualAnimations,
    webtoonData.cuts.length,
    webtoonData.cuts,
    // Note: refs and setters are stable and don't need to be in dependencies
  ]);
}

