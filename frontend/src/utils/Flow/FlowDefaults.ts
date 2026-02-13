import type { Node, Edge } from '@xyflow/react';

let nodeCounter = 0;
let edgeCounter = 0;
let nestedNodeCounter = 0;

export const resetCounters = () => {
  nodeCounter = 0;
  edgeCounter = 0;
  nestedNodeCounter = 0;
};

export const generateNodeId = (): string => {
  nodeCounter++;
  return `node-${nodeCounter}`;
};


export const generateNestedNodeId = (): string => {
  nestedNodeCounter++;
  return `nested-node-${nestedNodeCounter}`;
};

export const generateEdgeId = (): string => {
  edgeCounter++;
  return `edge-${edgeCounter}`;
};

export const setCounters = (nodeCount: number, edgeCount: number, nestedNodeCount: number) => {
  nodeCounter = nodeCount;
  edgeCounter = edgeCount;
  nestedNodeCounter = nestedNodeCount;
};

export const setNestedNodeCounter = (nestedNodeCount: number) => {
  nestedNodeCounter = Math.max(nestedNodeCounter, nestedNodeCount);
};

export const extractCountersFromFlow = (nodes: Node[], edges: Edge[], nestedCanvasData: Record<string, { nodes: Node[], edges: Edge[] }>) => {
  let maxNodeId = 0;
  let maxEdgeId = 0;
  let maxNestedNodeId = 0;

  nodes.forEach(node => {
    const match = node.id.match(/^node-(\d+)$/);
    if (match) {
      maxNodeId = Math.max(maxNodeId, parseInt(match[1], 10));
    }
  });

  edges.forEach(edge => {
    const match = edge.id.match(/^edge-(\d+)$/);
    if (match) {
      maxEdgeId = Math.max(maxEdgeId, parseInt(match[1], 10));
    }
  });

  Object.values(nestedCanvasData).forEach(nested => {
    nested.nodes.forEach(node => {
      const match = node.id.match(/^nested-node-(\d+)$/);
      if (match) {
        maxNestedNodeId = Math.max(maxNestedNodeId, parseInt(match[1], 10));
      }
    });
    nested.edges.forEach(edge => {
      const match = edge.id.match(/^edge-(\d+)$/);
      if (match) {
        maxEdgeId = Math.max(maxEdgeId, parseInt(match[1], 10));
      }
    });
  });

  setCounters(maxNodeId, maxEdgeId, maxNestedNodeId);
};
