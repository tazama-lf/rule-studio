import { useCallback } from 'react';
import { addEdge, type Edge, type Connection } from '@xyflow/react';
import { getLabelForHandle, getColorForHandle } from '../../utils/Common/helpers';

interface UseCanvasEdgeOperationsProps {
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  saveHistory: () => void;
}

export const useCanvasEdgeOperations = ({
  setEdges,
  saveHistory,
}: UseCanvasEdgeOperationsProps) => {
  // Handle edge connection
  const onConnect = useCallback(
    (params: Connection) => {
      saveHistory();

      setEdges((eds) => {
        // Check if source has multiple handles (indicating an If or Loop node)
        const hasMultipleHandles = params.sourceHandle !== null;

        if (!hasMultipleHandles) {
          // For nodes without multiple handles, check if source already has an outgoing edge
          const sourceHasEdge = eds.some((edge) => edge.source === params.source);

          if (sourceHasEdge) {
            console.warn('Each node can only have one outgoing connection');
            return eds;
          }
        } else {
          // For nodes with multiple handles (If/Loop), check if this specific handle already has an edge
          const handleHasEdge = eds.some(
            (edge) =>
              edge.source === params.source && edge.sourceHandle === params.sourceHandle
          );

          if (handleHasEdge) {
            console.warn('This handle already has a connection');
            return eds;
          }
        }

        // Add label and style for If and Loop node edges
        const edgeWithLabel = {
          ...params,
          label:
            hasMultipleHandles && params.sourceHandle
              ? getLabelForHandle(params.sourceHandle)
              : undefined,
          style:
            hasMultipleHandles && params.sourceHandle
              ? {
                  stroke: getColorForHandle(params.sourceHandle),
                  strokeWidth: 2,
                }
              : undefined,
        };

        return addEdge(edgeWithLabel, eds);
      });
    },
    [setEdges, saveHistory]
  );

  // Validate if a connection is valid
  const isValidConnection = useCallback((connection: Connection) => {
    // Add validation logic here if needed
    return connection.source !== connection.target;
  }, []);

  // Get edge style based on handle
  const getEdgeStyle = useCallback((sourceHandle: string | null) => {
    if (!sourceHandle) return undefined;

    return {
      stroke: getColorForHandle(sourceHandle),
      strokeWidth: 2,
    };
  }, []);

  return {
    onConnect,
    isValidConnection,
    getEdgeStyle,
  };
};
