import { useCallback, useRef, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface UseCanvasKeyboardShortcutsProps {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[] | ((prevNodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((prevEdges: Edge[]) => Edge[])) => void;
  deleteSelectedNodes: () => void;
  deleteSelectedEdges: () => void;
}

export const useCanvasKeyboardShortcuts = ({
  nodes,
  edges,
  setNodes,
  setEdges,
  deleteSelectedNodes,
  deleteSelectedEdges,
}: UseCanvasKeyboardShortcutsProps) => {
  const historyRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const redoRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);

  // Handle keyboard shortcuts
  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Delete: Delete or Backspace
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const target = event.target as HTMLElement;
        // Don't delete when typing in input fields
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }

        event.preventDefault();
        const selectedEdges = edges.filter((edge) => edge.selected);

        if (selectedEdges.length > 0) {
          deleteSelectedEdges();
        } else {
          deleteSelectedNodes();
        }
      }

      // Undo: Ctrl+Z
      if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (historyRef.current.length > 0) {
          const previous = historyRef.current.pop()!;
          redoRef.current.push({ nodes: [...nodes], edges: [...edges] });
          setNodes(previous.nodes);
          setEdges(previous.edges);
        }
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (
        (event.ctrlKey && event.key === 'y') ||
        (event.ctrlKey && event.shiftKey && event.key === 'z')
      ) {
        event.preventDefault();
        if (redoRef.current.length > 0) {
          const next = redoRef.current.pop()!;
          historyRef.current.push({ nodes: [...nodes], edges: [...edges] });
          setNodes(next.nodes);
          setEdges(next.edges);
        }
      }
    },
    [
      edges,
      nodes,
      setNodes,
      setEdges,
      deleteSelectedNodes,
      deleteSelectedEdges,
    ]
  );

  // Setup event listener
  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  // History management - should be called before any state change
  const pushHistory = useCallback(() => {
    historyRef.current.push({ nodes: [...nodes], edges: [...edges] });
    redoRef.current = [];
  }, [nodes, edges]);

  return {
    pushHistory,
    historyRef,
    redoRef,
  };
};
