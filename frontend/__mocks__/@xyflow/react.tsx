/* eslint-disable */
// Mock for @xyflow/react
import type { Node, Edge } from '@xyflow/react';

export const ReactFlow = ({ children }: { children?: React.ReactNode }) => (
  <div data-testid="react-flow">{children}</div>
);

export const Controls = () => <div data-testid="react-flow-controls" />;
export const Background = () => <div data-testid="react-flow-background" />;
export const MiniMap = () => <div data-testid="react-flow-minimap" />;

export const useReactFlow = () => ({
  getNodes: () => [],
  getEdges: () => [],
  setNodes: () => {},
  setEdges: () => {},
  addNodes: () => {},
  addEdges: () => {},
  deleteElements: () => {},
  fitView: () => {},
  getNode: () => undefined,
  getEdge: () => undefined,
  updateNode: () => {},
  updateEdge: () => {},
});

export const useNodesState = (initialNodes: Node[]) => [
  initialNodes,
  () => {},
  () => {},
] as const;

export const useEdgesState = (initialEdges: Edge[]) => [
  initialEdges,
  () => {},
  () => {},
] as const;

export const useUpdateNodeInternals = () => () => {};

export const ReactFlowProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const addEdge = (edge: any, edges: Edge[]) => [...edges, edge];

export const applyNodeChanges = (changes: any, nodes: Node[]) => nodes;
export const applyEdgeChanges = (changes: any, edges: Edge[]) => edges;

export const getConnectedEdges = () => [];
export const getIncomers = () => [];
export const getOutgoers = () => [];

export { type Node, type Edge };
