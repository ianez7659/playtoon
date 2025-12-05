import { useState } from 'react';
import type { ViewMode } from '@/types/webtoonViewer';

interface UseModeToggleProps {
  onModeChange?: (mode: ViewMode) => void;
  stopScrollAnimation?: () => void;
  resetScroll?: () => void;
}

export function useModeToggle({
  onModeChange,
  stopScrollAnimation,
  resetScroll,
}: UseModeToggleProps = {}) {
  const [mode, setMode] = useState<ViewMode>('normal');
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);

  const selectMode = (newMode: ViewMode) => {
    if (newMode === mode) {
      setIsModeMenuOpen(false);
      return;
    }
    
    setMode(newMode);
    setIsModeMenuOpen(false);
    
    if (newMode !== 'play') {
      stopScrollAnimation?.();
      resetScroll?.();
    }
    
    onModeChange?.(newMode);
  };

  return {
    mode,
    setMode,
    isModeMenuOpen,
    setIsModeMenuOpen,
    selectMode,
  };
}

