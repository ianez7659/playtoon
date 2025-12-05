"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Lenis from "@studio-freight/lenis";
import { resetCutState } from "@/utils/animationHelpers";
import { startPlayModeAnimation } from "./playMode";
import { useScrollModeSetup } from "./scrollMode";
import { UseWebtoonScrollProps, UseWebtoonScrollReturn } from "./types";
import { Z_INDEX_BASE } from "./constants";

export function useWebtoonScroll({
  webtoonData,
  useScrollAnimation,
  selectedAnimation,
  useIndividualAnimations,
  cutRefs,
  isBattleActive,
  setCurrentBattleCutIndex,
  setShowEncounterPortal,
}: UseWebtoonScrollProps): UseWebtoonScrollReturn {
  const [scrollTween, setScrollTween] = useState<gsap.core.Tween | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  
  // Use refs to access latest values in callbacks
  const scrollTweenRef = useRef<gsap.core.Tween | null>(null);
  const isPlayingRef = useRef(false);
  const lenisRef = useRef<Lenis | null>(null);
  const rafIdRef = useRef<number | null>(null);
  
  useEffect(() => {
    scrollTweenRef.current = scrollTween;
  }, [scrollTween]);
  
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Initialize Lenis for smooth scrolling (only in play mode)
  useEffect(() => {
    if (useScrollAnimation) {
      // Initialize Lenis
      lenisRef.current = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
      });

      // Integrate Lenis with GSAP ScrollTrigger
      gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
      lenisRef.current.on('scroll', ScrollTrigger.update);

      // Animation loop for Lenis
      function raf(time: number) {
        lenisRef.current?.raf(time);
        rafIdRef.current = requestAnimationFrame(raf);
      }
      rafIdRef.current = requestAnimationFrame(raf);

      // Configure ScrollTrigger for mobile devices
      ScrollTrigger.config({
        autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize",
      });

      // Handle mobile orientation change and resize
      const handleResize = () => {
        ScrollTrigger.refresh(true);
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          ScrollTrigger.refresh(true);
        }, 100);
      });

      return () => {
        window.removeEventListener('resize', handleResize);
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }
        lenisRef.current?.destroy();
        lenisRef.current = null;
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      };
    } else {
      // Normal mode: just register GSAP plugins
      gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
      
      // Configure ScrollTrigger for mobile devices
      ScrollTrigger.config({
        autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize",
      });

      // Handle mobile orientation change and resize
      const handleResize = () => {
        ScrollTrigger.refresh(true);
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          ScrollTrigger.refresh(true);
        }, 100);
      });

      return () => {
        window.removeEventListener('resize', handleResize);
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      };
    }
  }, [useScrollAnimation]);

  // Scroll position tracking
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolledDown(scrollTop > 100);

      // Hide header while scrolling
      if (useScrollAnimation) {
        setIsScrolling(true);

        // Show header again when scroll stops
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          setIsScrolling(false);
        }, 150); // Consider scroll stopped after 150ms
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [useScrollAnimation]);

  // Pause scroll animation when battle is active
  useEffect(() => {
    if (isBattleActive) {
      // Pause GSAP timeline
      if (scrollTweenRef.current) {
        scrollTweenRef.current.pause();
      }
      // Stop Lenis scrolling
      if (lenisRef.current) {
        lenisRef.current.stop();
      }
    } else {
      // Resume GSAP timeline
      if (scrollTweenRef.current && isPlayingRef.current) {
        scrollTweenRef.current.resume();
      }
      // Lenis will resume automatically when next scrollTo is called
    }
  }, [isBattleActive]);

  // ============================================
  // Scroll Mode Setup
  // ============================================
  
  // Setup scroll mode animations
  useScrollModeSetup({
    webtoonData,
    cutRefs,
    selectedAnimation,
    useIndividualAnimations,
    useScrollAnimation,
    scrollTweenRef,
    setScrollTween,
    setIsPlaying,
    setCurrentBattleCutIndex,
    setShowEncounterPortal,
    isPlayingRef,
    lenisRef,
  });

  // ============================================
  // Play Mode Functions
  // ============================================
  
  /**
   * Start play mode animation
   * Resets all cuts and starts hold-based scroll animation
   */
  const startScrollAnimation = () => {
    startPlayModeAnimation({
      webtoonData,
      cutRefs,
      selectedAnimation,
      useIndividualAnimations,
      setScrollTween,
      setIsPlaying,
      scrollTweenRef,
    });
  };


  /**
   * Stop play mode animation
   */
  const stopScrollAnimation = () => {
    if (scrollTweenRef.current) {
      scrollTweenRef.current.kill();
      setScrollTween(null);
    }
    // Stop Lenis scrolling
    if (lenisRef.current) {
      lenisRef.current.stop();
    }
    setIsPlaying(false);
  };

  /**
   * Reset all cuts to initial state
   * First cut visible, others hidden
   */
  const resetScroll = () => {
    if (scrollTweenRef.current) {
      scrollTweenRef.current.kill();
      setScrollTween(null);
    }
    setIsPlaying(false);
    
    // Reset all cuts to initial state (first cut visible, others hidden)
    webtoonData.cuts.forEach((cut, index) => {
      const cutRef = cutRefs.current[index];
      if (cutRef) {
        const cutContainer = cutRef.querySelector('.cut-container') as HTMLDivElement;
        if (cutContainer) {
          const cutAnimationType = useIndividualAnimations
            ? cut?.animationType || "basic"
            : selectedAnimation;
          
          // Reset to initial state using helper function
          resetCutState(
            cutContainer,
            cutAnimationType,
            index,
            webtoonData.cuts.length,
            Z_INDEX_BASE
          );
        }
      }
    });
  };

  return {
    scrollTween,
    isPlaying,
    isScrolling,
    isScrolledDown,
    startScrollAnimation,
    stopScrollAnimation,
    resetScroll,
  };
}

