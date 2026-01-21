import React from 'react';
import { Handle } from '@xyflow/react';

interface HandleConfig {
  id: string;
  type: 'source' | 'target';
  position: 'top' | 'bottom' | 'left' | 'right';
  style: React.CSSProperties;
}

interface NodeHandlesProps {
  targetHandle?: HandleConfig;
  sourceHandles: HandleConfig[];
}

export const NodeHandles: React.FC<NodeHandlesProps> = ({ targetHandle, sourceHandles }) => {
  return (
    <>
      {targetHandle && (
        <Handle
          id={targetHandle.id}
          type={targetHandle.type}
          position={targetHandle.position}
          style={targetHandle.style}
        />
      )}
      {sourceHandles.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type={handle.type}
          position={handle.position}
          style={handle.style}
        />
      ))}
    </>
  );
};
