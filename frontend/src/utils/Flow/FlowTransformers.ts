import type { Node, Edge } from '@xyflow/react';
import { getLabelForHandle, getColorForHandle } from '../Common/helpers';

export interface ApiNode {
  id: string;
  type: string;
  label: string;
  params?: Record<string, unknown>;
  position?: { x: number; y: number };
  nestedFlow?: { nodes: ApiNode[]; edges: ApiEdge[] };
  mode?: 'definition' | 'call';
  generation_type?: 'definition' | 'call';
  function_name?: string;
}

export interface ApiEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
  style?: Record<string, unknown>;
  type?: string;
  animated?: boolean;
}

export interface TransformedFlowData {
  nodes: Node[];
  edges: Edge[];
  nestedFlows: Record<string, { nodes: Node[]; edges: Edge[] }>;
}

export const transformApiNodeToCanvasNode = (node: ApiNode): Node => {
  const nodeData: Record<string, unknown> = {
    label: node.label,
    nodeType: node.type,
    params: node.params || {},
  };
  
  // Restore mode, generation_type, and function_name for function nodes
  if (node.mode) {
    nodeData.mode = node.mode;
  }
  if (node.generation_type) {
    nodeData.generation_type = node.generation_type;
  }
  if (node.function_name) {
    nodeData.function_name = node.function_name;
  }
  
  return {
    id: node.id,
    type: 'editableNode',
    position: node.position || { x: 0, y: 0 },
    data: nodeData,
  };
};

export const transformApiEdgeToCanvasEdge = (edge: ApiEdge): Edge => {
  const sourceHandleValue = edge.sourceHandle && edge.sourceHandle !== null ? edge.sourceHandle : undefined;
  const targetHandleValue = edge.targetHandle && edge.targetHandle !== null ? edge.targetHandle : undefined;
  
  
  const hasSourceHandle = sourceHandleValue !== undefined && sourceHandleValue !== null;
  const needsReconstruction = hasSourceHandle && (!edge.label || !edge.style);
  
  const transformedEdge: Edge = {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type || 'smoothstep',
    animated: edge.animated || false,
  };

  if (sourceHandleValue !== undefined) {
    transformedEdge.sourceHandle = sourceHandleValue;
  }
  if (targetHandleValue !== undefined) {
    transformedEdge.targetHandle = targetHandleValue;
  }

  if (edge.label) {
    transformedEdge.label = edge.label;
  } else if (needsReconstruction && sourceHandleValue) {
    transformedEdge.label = getLabelForHandle(sourceHandleValue);
  }

  if (edge.style) {
    transformedEdge.style = edge.style;
  } else if (needsReconstruction && sourceHandleValue) {
    transformedEdge.style = {
      stroke: getColorForHandle(sourceHandleValue),
      strokeWidth: 2,
    };
  }

  return transformedEdge;
};

export const transformApiFlowData = (
  apiNodes: ApiNode[],
  apiEdges: ApiEdge[]
): TransformedFlowData => {
  const nodes = apiNodes.map(transformApiNodeToCanvasNode);
  const edges = apiEdges.map(transformApiEdgeToCanvasEdge);
  const nestedFlows: Record<string, { nodes: Node[]; edges: Edge[] }> = {};

  apiNodes.forEach((node) => {
    if (node.nestedFlow) {
      nestedFlows[node.id] = {
        nodes: node.nestedFlow.nodes.map(transformApiNodeToCanvasNode),
        edges: node.nestedFlow.edges.map(transformApiEdgeToCanvasEdge),
      };
    }
  });

  return { nodes, edges, nestedFlows };
};
