import type { Node, Edge } from '@xyflow/react';

/**
 * Counter for generating unique node and edge IDs
 */
let nodeCounter = 0;
let edgeCounter = 0;
let nestedNodeCounter = 0;
let hasInitialized = false;

/**
 * Reset counters (useful for testing or reinitialization)
 */
export const resetCounters = () => {
  // Only reset if not already initialized to prevent ID collisions
  if (!hasInitialized) {
    nodeCounter = 0;
    edgeCounter = 0;
    nestedNodeCounter = 0;
    hasInitialized = true;
  }
};

/**
 * Generate a unique node ID
 */
export const generateNodeId = (): string => {
  nodeCounter++;
  return `node-${nodeCounter}`;
};

/**
 * Generate a unique nested node ID
 */
export const generateNestedNodeId = (): string => {
  nestedNodeCounter++;
  return `nested-node-${nestedNodeCounter}`;
};

/**
 * Generate a unique edge ID
 */
export const generateEdgeId = (): string => {
  edgeCounter++;
  return `edge-${edgeCounter}`;
};

/**
 * Set the counters to specific values (useful when loading existing flow)
 */
export const setCounters = (nodeCount: number, edgeCount: number, nestedNodeCount: number) => {
  nodeCounter = nodeCount;
  edgeCounter = edgeCount;
  nestedNodeCounter = nestedNodeCount;
};

/**
 * Extract highest counter values from existing flow data
 */
export const extractCountersFromFlow = (nodes: Node[], edges: Edge[], nestedCanvasData: Record<string, { nodes: Node[], edges: Edge[] }>) => {
  let maxNodeId = 0;
  let maxEdgeId = 0;
  let maxNestedNodeId = 0;

  // Extract from main canvas nodes
  nodes.forEach(node => {
    const match = node.id.match(/^node-(\d+)$/);
    if (match) {
      maxNodeId = Math.max(maxNodeId, parseInt(match[1], 10));
    }
  });

  // Extract from main canvas edges
  edges.forEach(edge => {
    const match = edge.id.match(/^edge-(\d+)$/);
    if (match) {
      maxEdgeId = Math.max(maxEdgeId, parseInt(match[1], 10));
    }
  });

  // Extract from nested canvas
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

/**
 * Default flow structure for new rule builder
 */
export const getDefaultFlow = () => {
  // Reset counters for fresh start
  resetCounters();

  const startNodeId = generateNodeId(); // node-1
  const handleTransactionNodeId = generateNodeId(); // node-2
  const endNodeId = generateNodeId(); // node-3
  const edge1Id = generateEdgeId(); // edge-1
  const edge2Id = generateEdgeId(); // edge-2
  const nestedStartId = generateNestedNodeId(); // nested-node-1
  const nestedEndId = generateNestedNodeId(); // nested-node-2

  return {
    mainCanvas: {
      nodes: [
        {
          id: startNodeId,
          type: 'editableNode',
          position: { x: 100, y: 50 },
          data: {
            label: 'Start',
            nodeType: 'Start',
            params: {},
          },
        },
        {
          id: handleTransactionNodeId,
          type: 'editableNode',
          position: { x: 100, y: 200 },
          data: {
            label: 'Handle Transaction',
            nodeType: 'HandleTransaction',
            params: {},
          },
        },
        {
          id: endNodeId,
          type: 'editableNode',
          position: { x: 100, y: 350 },
          data: {
            label: 'End',
            nodeType: 'End',
            params: {},
          },
        },
      ],
      edges: [
        {
          id: edge1Id,
          source: startNodeId,
          target: handleTransactionNodeId,
          type: 'smoothstep',
          animated: false,
        },
        {
          id: edge2Id,
          source: handleTransactionNodeId,
          target: endNodeId,
          type: 'smoothstep',
          animated: false,
        },
      ],
    },
    nestedCanvasData: {
      [handleTransactionNodeId]: {
        nodes: [
          {
            id: nestedStartId,
            type: 'editableNode',
            position: { x: 100, y: 50 },
            data: {
              label: 'Start',
              nodeType: 'Start',
              params: {},
            },
          },
          {
            id: nestedEndId,
            type: 'editableNode',
            position: { x: 100, y: 300 },
            data: {
              label: 'End',
              nodeType: 'End',
              params: {},
            },
          },
        ],
        edges: [],
      },
    },
  };
};
