import { useState, useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { getDefaultFlow } from '../../utils/Flow/FlowDefaults';

interface NestedCanvasData {
  nodes: Node[];
  edges: Edge[];
}

export const useNestedCanvasManager = () => {
  const [activeNestedCanvas, setActiveNestedCanvas] = useState<string | null>(null);
  const [activeNestedCanvasLabel, setActiveNestedCanvasLabel] = useState<string>('Handle Transaction');
  const [nestedCanvasData, _setNestedCanvasData] = useState<Record<string, NestedCanvasData>>(() => {
    const defaultFlow = getDefaultFlow();
    return defaultFlow.nestedCanvasData as Record<string, NestedCanvasData>;
  });
  
  // Memoized setter to provide stable reference
  const setNestedCanvasData = useCallback((updater: Record<string, NestedCanvasData> | ((prev: Record<string, NestedCanvasData>) => Record<string, NestedCanvasData>)) => {
    _setNestedCanvasData(updater);
  }, []);

  const handleNestedCanvasBack = useCallback(() => {
    setActiveNestedCanvas(null);
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
    setActiveNestedCanvas(nodeId);
    setActiveNestedCanvasLabel(label);
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
  };
};
