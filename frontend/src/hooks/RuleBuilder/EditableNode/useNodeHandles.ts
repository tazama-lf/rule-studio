import { useMemo } from 'react';
import { Position } from '@xyflow/react';

interface HandleConfig {
  id: string;
  type: 'source' | 'target';
  position: Position;
  style: React.CSSProperties;
}

interface UseNodeHandlesResult {
  targetHandle?: HandleConfig;
  sourceHandles: HandleConfig[];
}

export const useNodeHandles = (
  nodeType: string,
  hasTargetHandle: boolean,
  hasSourceHandle: boolean,
  conditions: Array<{ type: string; condition?: string }>
): UseNodeHandlesResult => {
  return useMemo(() => {
    const result: UseNodeHandlesResult = {
      sourceHandles: [],
    };

    // Target handle (top)
    if (hasTargetHandle) {
      result.targetHandle = {
        id: 'target',
        type: 'target',
        position: Position.Top,
        style: {
          background: '#555',
          width: '10px',
          height: '10px',
          border: '2px solid white',
        },
      };
    }

    // Source handles - special handling for If nodes
    if (hasSourceHandle && nodeType === 'If') {
      // Right-side handles for if/else if/else branches
      const totalConditions = conditions.length;
      const spacing = 80 / (totalConditions + 1);

      conditions.forEach((cond, index) => {
        const handleId = cond.type === 'else' ? 'else' : cond.type === 'if' ? 'if' : `elseif-${index}`;
        const topPosition = 10 + spacing * (index + 1);

        result.sourceHandles.push({
          id: handleId,
          type: 'source',
          position: Position.Right,
          style: {
            background: '#4caf50',
            width: '10px',
            height: '10px',
            border: '2px solid white',
            top: `${topPosition}%`,
          },
        });
      });

      // Bottom handle for continuation after if block
      result.sourceHandles.push({
        id: 'exit',
        type: 'source',
        position: Position.Bottom,
        style: {
          background: '#000000',
          width: '10px',
          height: '10px',
          border: '2px solid white',
        },
      });
    } else if (hasSourceHandle && nodeType === 'Loop') {
      // Right-side handle for loop body
      result.sourceHandles.push({
        id: 'loopBody',
        type: 'source',
        position: Position.Right,
        style: {
          background: '#2196F3',
          width: '10px',
          height: '10px',
          border: '2px solid white',
          top: '50%',
        },
      });

      // Bottom handle for continuation after loop
      result.sourceHandles.push({
        id: 'exit',
        type: 'source',
        position: Position.Bottom,
        style: {
          background: '#000000',
          width: '10px',
          height: '10px',
          border: '2px solid white',
        },
      });
    } else if (hasSourceHandle) {
      // Single output handle for other nodes
      result.sourceHandles.push({
        id: 'source',
        type: 'source',
        position: Position.Bottom,
        style: {
          background: '#555',
          width: '10px',
          height: '10px',
          border: '2px solid white',
        },
      });
    }

    return result;
  }, [nodeType, hasTargetHandle, hasSourceHandle, conditions]);
};
