import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface NodeData {
  nodeType?: string;
  params?: Record<string, string>;
  [key: string]: unknown;
}

interface LoopContext {
  loopNode: Node;
  itemVariable: string;
  indexVariable: string;
  arrayVariable: string;
  loopType: string;
}

interface UseNodeScopeProps {
  nodeId: string | null;
  edges: Edge[];
  nodes: Node[];
}

interface UseNodeScopeResult {
  parentLoops: LoopContext[];
  isInLoopScope: boolean;
}

/**
 * Detects if a node is inside a loop scope and returns parent loop contexts
 * Traverses the graph backwards to find all parent Loop nodes
 */
export const useNodeScope = ({ nodeId, edges, nodes }: UseNodeScopeProps): UseNodeScopeResult => {
  return useMemo(() => {
    if (!nodeId) {
      return { parentLoops: [], isInLoopScope: false };
    }

    const parentLoops: LoopContext[] = [];
    const visited = new Set<string>();

    /**
     * Recursively traverse backwards through edges to find parent Loop nodes
     */
    const findParentLoops = (currentNodeId: string) => {
      if (visited.has(currentNodeId)) return;
      visited.add(currentNodeId);

      // Find all edges that target this node
      const incomingEdges = edges.filter((edge) => edge.target === currentNodeId);

      for (const edge of incomingEdges) {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        if (!sourceNode) continue;

        const nodeData = sourceNode.data as NodeData;

        // Check if this edge comes from a Loop node's loopBody handle
        if (nodeData?.nodeType === 'Loop' && edge.sourceHandle === 'loopBody') {
          const params = nodeData.params || {};
          
          parentLoops.push({
            loopNode: sourceNode,
            itemVariable: params.itemVariable || 'item',
            indexVariable: params.indexVariable || 'index',
            arrayVariable: params.arrayVariable || 'items',
            loopType: params.loopType || 'forEach',
          });
        }

        // Continue traversing backwards (handles nested loops)
        findParentLoops(edge.source);
      }
    };

    findParentLoops(nodeId);

    return {
      parentLoops,
      isInLoopScope: parentLoops.length > 0,
    };
  }, [nodeId, edges, nodes]);
};
