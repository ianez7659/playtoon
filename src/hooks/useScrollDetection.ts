import { useEffect, useRef, useState } from 'react';
import type { ViewMode } from '@/types/webtoonViewer';

export function useScrollDetection(mode: ViewMode) {
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (mode === 'play') {
      // Play mode uses isScrolling from useWebtoonScroll
      return;
    }

    // In scroll mode, disable all state updates to prevent flicker
    if (mode === 'scroll') {
      return;
    }

    const handleScroll = () => {
      // Check if scrolled to bottom (with 1px tolerance)
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1;
      
      // Cancel any existing timeout
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
      
      // Cancel any pending RAF
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      
      // At bottom: immediately show header and skip all state updates
      if (isAtBottom) {
        setIsUserScrolling(false);
        setIsAtBottom(true);
        return;
      } else {
        setIsAtBottom(false);
      }
      
      const now = Date.now();
      
      // Throttle state updates to max once per 100ms
      if (now - lastUpdateRef.current < 100) {
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            setIsUserScrolling(true);
            lastUpdateRef.current = Date.now();
          });
        }
      } else {
        setIsUserScrolling(true);
        lastUpdateRef.current = now;
      }
      
      // Show header again 150ms after scroll stops
      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsUserScrolling(false);
        scrollTimeoutRef.current = null;
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [mode]);

  // In scroll mode, always return false to prevent any state changes
  if (mode === 'scroll') {
    return { isUserScrolling: false, isAtBottom: false };
  }

  return { isUserScrolling, isAtBottom };
}

