import { useState, useCallback, useEffect } from 'react';

interface UseDebuggerPanelProps {
  isPlaying?: boolean;
}

export const useDebuggerPanel = ({ isPlaying }: UseDebuggerPanelProps) => {
  const [panelHeight, setPanelHeight] = useState(80); // Percentage height of debugger panel
  const [isResizing, setIsResizing] = useState(false);
  const [isDebuggerOpen, setIsDebuggerOpen] = useState(false);

  // Auto-open debugger when play starts
  useEffect(() => {
    // Only open if playing started and debugger is not yet open
    // This prevents cascading renders
    if (isPlaying && !isDebuggerOpen) {
      // Use setTimeout to defer setState to next tick
      const timer = setTimeout(() => setIsDebuggerOpen(true), 0);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, isDebuggerOpen]);

  // Handle mouse down to start resizing
  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  // Handle mouse move during resize
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const container = document.getElementById('canvas-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newHeight =
        ((containerRect.bottom - e.clientY) / containerRect.height) * 100;

      // Constrain between 20% and 70%
      if (newHeight >= 20 && newHeight <= 70) {
        setPanelHeight(newHeight);
      }
    },
    [isResizing]
  );

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add/remove mouse event listeners
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

  // Close debugger
  const closeDebugger = useCallback(() => {
    setIsDebuggerOpen(false);
  }, []);

  // Toggle debugger
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
