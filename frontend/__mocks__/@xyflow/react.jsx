export const ReactFlow = ({ children }) => (
  <div data-testid="react-flow">{children}</div>
);

export const Controls = () => <div data-testid="react-flow-controls" />;
export const Background = () => <div data-testid="react-flow-background" />;
export const MiniMap = () => <div data-testid="react-flow-minimap" />;
export const Panel = ({ children }) => <div data-testid="react-flow-panel">{children}</div>;
export const Handle = ({ type, position, id }) => (
  <div data-testid={`react-flow-handle-${type}-${id || 'default'}`} data-position={position} />
);

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

export const useNodesState = (initialNodes) => [
  initialNodes,
  () => {},
  () => {},
];

export const useEdgesState = (initialEdges) => [
  initialEdges,
  () => {},
  () => {},
];

export const useUpdateNodeInternals = () => () => {};

import React from 'react';

// Create a minimal zustand store for React Flow context
const createStore = () => {
  const state = {
    nodes: [],
    edges: [],
    nodeInternals: new Map(),
    width: 800,
    height: 600,
    transform: [0, 0, 1],
    nodeOrigin: [0, 0],
    nodeLookup: new Map(),
    connectionLookup: new Map(),
  };

  const listeners = new Set();
  
  return {
    getState: () => state,
    setState: (partial) => {
      Object.assign(state, typeof partial === 'function' ? partial(state) : partial);
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

// Create React context for the store
const StoreContext = React.createContext(null);

export const ReactFlowProvider = ({ children }) => {
  const storeRef = React.useRef(null);
  
  if (!storeRef.current) {
    storeRef.current = createStore();
  }
  
  return <StoreContext.Provider value={storeRef.current}>{children}</StoreContext.Provider>;
};

export const addEdge = (edge, edges) => [...edges, edge];

export const applyNodeChanges = (changes, nodes) => nodes;
export const applyEdgeChanges = (changes, edges) => edges;

export const getConnectedEdges = () => [];
export const getIncomers = () => [];
export const getOutgoers = () => [];

// Position enum for handles
export const Position = {
  Top: 'top',
  Bottom: 'bottom',
  Left: 'left',
  Right: 'right',
};

// Mock useStore hook for React Flow context
export const useStore = (selector) => {
  const store = React.useContext(StoreContext);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  
  React.useEffect(() => {
    if (!store) return;
    return store.subscribe(forceUpdate);
  }, [store]);
  
  if (!store) {
    const defaultState = {
      nodes: [],
      edges: [],
      nodeInternals: new Map(),
      width: 800,
      height: 600,
    };
    return selector ? selector(defaultState) : defaultState;
  }
  
  const state = store.getState();
  return selector ? selector(state) : state;
};

export const useStoreApi = () => {
  const store = React.useContext(StoreContext);
  
  return store || {
    getState: () => ({
      nodes: [],
      edges: [],
      nodeInternals: new Map(),
    }),
    setState: () => {},
    subscribe: () => () => {},
  };
};
