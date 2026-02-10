import { useState, useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface NestedCanvasData {
  nodes: Node[];
  edges: Edge[];
}

export const useNestedCanvasManager = () => {
  const [activeNestedCanvas, setActiveNestedCanvas] = useState<string | null>(null);
  const [activeNestedCanvasLabel, setActiveNestedCanvasLabel] = useState<string>('Handle Transaction');
  const [nestedCanvasData, _setNestedCanvasData] = useState<Record<string, NestedCanvasData>>({});
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  
  const setNestedCanvasData = useCallback((updater: Record<string, NestedCanvasData> | ((prev: Record<string, NestedCanvasData>) => Record<string, NestedCanvasData>)) => {
    _setNestedCanvasData(updater);
  }, []);

  const handleNestedCanvasBack = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveNestedCanvas(null);
      setIsTransitioning(false);
    }, 0);
  }, []);

  const handleNestedCanvasSave = useCallback(
    (nodeId: string, nodes: Node[], edges: Edge[]) => {
      setNestedCanvasData((prev) => ({
        ...prev,
        [nodeId]: { nodes, edges },
      }));
    },
    [setNestedCanvasData]
  );

  const openNestedCanvas = useCallback((nodeId: string, label: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveNestedCanvas(nodeId);
      setActiveNestedCanvasLabel(label);
      setIsTransitioning(false);
    }, 0);
  }, []);

  return {
    activeNestedCanvas,
    setActiveNestedCanvas,
    activeNestedCanvasLabel,
    setActiveNestedCanvasLabel,
    nestedCanvasData,
    setNestedCanvasData,
    handleNestedCanvasBack,
    handleNestedCanvasSave,
    openNestedCanvas,
    isTransitioning,
  };
};
