import { useEffect, useRef, useState } from 'react';
import type { ViewMode } from '@/types/webtoonViewer';

export function useScrollDetection(mode: ViewMode) {
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (mode === 'play') {
      // Play mode uses isScrolling from useWebtoonScroll
      return;
    }

    const handleScroll = () => {
      setIsUserScrolling(true);
      
      // Cancel existing timer if present
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      
      // Show header again 150ms after scroll stops
      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsUserScrolling(false);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current !== null) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [mode]);

  return isUserScrolling;
}

