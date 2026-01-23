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

export const useNodeScope = ({ nodeId, edges, nodes }: UseNodeScopeProps): UseNodeScopeResult => {
  return useMemo(() => {
    if (!nodeId) {
      return { parentLoops: [], isInLoopScope: false };
    }

    const parentLoops: LoopContext[] = [];
    const visited = new Set<string>();

    const findParentLoops = (currentNodeId: string) => {
      if (visited.has(currentNodeId)) return;
      visited.add(currentNodeId);

      const incomingEdges = edges.filter((edge) => edge.target === currentNodeId);

      for (const edge of incomingEdges) {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        if (!sourceNode) continue;

        const nodeData = sourceNode.data as NodeData;

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
