import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { ViewMode } from '@/types/webtoonViewer';

interface UseModeAnimationProps {
  isModeMenuOpen: boolean;
  mode: ViewMode;
  containerRef: React.RefObject<HTMLDivElement | null>;
  desktopModeMenuButtonsRef: React.MutableRefObject<(HTMLButtonElement | null)[]>;
  mobileModeMenuButtonsRef: React.MutableRefObject<(HTMLButtonElement | null)[]>;
}

export function useModeAnimation({
  isModeMenuOpen,
  mode,
  containerRef,
  desktopModeMenuButtonsRef,
  mobileModeMenuButtonsRef,
}: UseModeAnimationProps) {
  const prevModeRef = useRef<ViewMode>(mode);

  // GSAP animation: mode menu buttons
  useEffect(() => {
    if (!isModeMenuOpen) {
      // Smoothly hide when menu closes
      const buttons = [...desktopModeMenuButtonsRef.current, ...mobileModeMenuButtonsRef.current].filter(Boolean);
      if (buttons.length > 0) {
        gsap.to(buttons, {
          opacity: 0,
          duration: 0.15,
          ease: "power1.in",
          onComplete: () => {
            buttons.forEach((btn) => {
              if (btn) gsap.set(btn, { opacity: 0 });
            });
          },
        });
      }
      return;
    }

    // When menu opens - slight delay until refs are set
    const timer = setTimeout(() => {
      // Desktop buttons (Play, Scroll, Normal order) - fade in sequentially
      const desktopButtons = desktopModeMenuButtonsRef.current.filter(Boolean);
      if (desktopButtons.length > 0) {
        desktopButtons.forEach((btn, index) => {
          if (btn) {
            // Set initial state
            gsap.set(btn, {
              opacity: 0,
              x: 15, // Start slightly to the right
            });
            // Animate to final state - fade in with slight slide
            gsap.to(btn, {
              opacity: 1,
              x: 0,
              duration: 0.4,
              delay: index * 0.1,
              ease: "power2.out",
            });
          }
        });
      }

      // Mobile buttons (Normal, Scroll, Play order)
      const mobileButtons = mobileModeMenuButtonsRef.current.filter(Boolean);
      if (mobileButtons.length > 0) {
        mobileButtons.forEach((btn, index) => {
          if (btn) {
            gsap.to(btn, {
              opacity: 1,
              duration: 0.25,
              delay: index * 0.06,
              ease: "sine.out",
            });
          }
        });
      }
    }, 30);

    return () => {
      clearTimeout(timer);
    };
  }, [isModeMenuOpen, desktopModeMenuButtonsRef, mobileModeMenuButtonsRef]);

  // Animate mode text when mode changes
  useEffect(() => {
    if (prevModeRef.current !== mode) {
      // Find all mode text elements and set initial state immediately
      const modeTextElements = containerRef.current?.querySelectorAll('.mode-text') as NodeListOf<HTMLElement>;
      
      if (modeTextElements) {
        modeTextElements.forEach((el) => {
          // Set initial state immediately (before animation)
          gsap.set(el, {
            opacity: 0,
            x: 50,
            immediateRender: true,
          });
        });
      }
      
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        // Find the currently visible mode text element
        const modeTextElement = containerRef.current?.querySelector('.mode-text') as HTMLElement;
        
        if (modeTextElement) {
          // Animate from right to left with fade in
          gsap.to(modeTextElement, {
            opacity: 1,
            x: 0,
            duration: 0.6,
            ease: 'power3.out',
          });
        }
      }, 10);
    }
    prevModeRef.current = mode;
  }, [mode, containerRef]);
}

