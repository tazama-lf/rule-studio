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
  const onConnect = useCallback(
    (params: Connection) => {
      saveHistory();

      setEdges((eds) => {
        const hasMultipleHandles = params.sourceHandle !== null;

        if (!hasMultipleHandles) {
          const sourceHasEdge = eds.some((edge) => edge.source === params.source);

          if (sourceHasEdge) {
            console.warn('Each node can only have one outgoing connection');
            return eds;
          }
        } else {
          const handleHasEdge = eds.some(
            (edge) =>
              edge.source === params.source && edge.sourceHandle === params.sourceHandle
          );

          if (handleHasEdge) {
            console.warn('This handle already has a connection');
            return eds;
          }
        }

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

  const isValidConnection = useCallback((connection: Connection) => {
    return connection.source !== connection.target;
  }, []);

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
