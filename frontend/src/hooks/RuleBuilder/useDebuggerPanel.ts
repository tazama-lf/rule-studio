import { useState, useCallback, useEffect } from 'react';

interface UseDebuggerPanelProps {
  isPlaying?: boolean;
}

export const useDebuggerPanel = ({ isPlaying }: UseDebuggerPanelProps) => {
  const [panelHeight, setPanelHeight] = useState(80);
  const [isResizing, setIsResizing] = useState(false);
  const [isDebuggerOpen, setIsDebuggerOpen] = useState(false);

  useEffect(() => {
    if (isPlaying && !isDebuggerOpen) {
      const timer = setTimeout(() => setIsDebuggerOpen(true), 0);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, isDebuggerOpen]);

  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const container = document.getElementById('canvas-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newHeight =
        ((containerRect.bottom - e.clientY) / containerRect.height) * 100;

      if (newHeight >= 20 && newHeight <= 70) {
        setPanelHeight(newHeight);
      }
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const closeDebugger = useCallback(() => {
    setIsDebuggerOpen(false);
  }, []);

  const toggleDebugger = useCallback(() => {
    setIsDebuggerOpen((prev) => !prev);
  }, []);

  return {
    panelHeight,
    setPanelHeight,
    isResizing,
    isDebuggerOpen,
    setIsDebuggerOpen,
    handleMouseDown,
    closeDebugger,
    toggleDebugger,
  };
};
