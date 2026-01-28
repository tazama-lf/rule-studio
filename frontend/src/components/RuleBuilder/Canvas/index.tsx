import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useUpdateNodeInternals,
  Panel,
  type ReactFlowInstance,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditableNode from '../EditableNode';
import DebuggerPanel, { type DebugLog } from '../DebuggerPanel';
import { getDefaultFlow, extractCountersFromFlow } from '../../../utils/Flow/FlowDefaults';
import {
  useCanvasNodeOperations,
  useCanvasEdgeOperations,
  useCanvasKeyboardShortcuts,
  useCanvasCodeGeneration,
  useDebuggerPanel,
} from '../../../hooks/RuleBuilder';

const nodeTypes = {
  editableNode: EditableNode,
};

// Internal component to expose updateNodeInternals from within ReactFlow context
const UpdateNodeInternalsExposer: React.FC<{ onReady: (updateFn: (nodeId: string) => void) => void }> = ({ onReady }) => {
  const updateNodeInternals = useUpdateNodeInternals();
  
  useEffect(() => {
    onReady(updateNodeInternals);
  }, [onReady, updateNodeInternals]);
  
  return null;
};

interface NestedCanvasData {
  nodes: Node[];
  edges: Edge[];
}

interface CanvasProps {
  isPlaying?: boolean;
  onJsonGenerate?: (json: string) => void;
  onCodeGenerate?: (code: string) => void;
  onNodeSelect?: (node: Node | null) => void;
  onNodeUpdate?: (nodeId: string, updates: Record<string, unknown>) => void;
  debugVariables?: Record<string, unknown>;
  debugLogs?: DebugLog[];
  currentNodeId?: string;
  nestedCanvasData?: Record<string, NestedCanvasData>;
  onFlowStateUpdate?: (
    nodes: Node[], 
    edges: Edge[], 
    setNodes: (nodes: Node[] | ((prevNodes: Node[]) => Node[])) => void, 
    setEdges: (edges: Edge[] | ((prevEdges: Edge[]) => Edge[])) => void
  ) => void;
  viewOnly?: boolean;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onUpdateNodeInternalsReady?: (updateFn: (nodeId: string) => void) => void;
}



const RuleBuilderCanvas: React.FC<CanvasProps> = ({ 
  isPlaying, 
  onJsonGenerate, 
  onCodeGenerate,
  onNodeSelect,
  onNodeUpdate,
  nestedCanvasData = {},
  debugVariables = {},
  debugLogs = [],
  currentNodeId,
  onFlowStateUpdate,
  viewOnly = false,
  initialNodes,
  initialEdges,
  onUpdateNodeInternalsReady,
}) => {
  const initialDataRef = useRef({ nodes: initialNodes, edges: initialEdges });
  
  const getInitialFlow = React.useMemo(() => {
    if (initialDataRef.current.nodes && initialDataRef.current.edges) {
      const nodes = initialDataRef.current.nodes as Node[];
      const edges = initialDataRef.current.edges as Edge[];
      
      extractCountersFromFlow(nodes, edges, nestedCanvasData || {});
      
      return {
        nodes,
        edges,
      };
    }
    const defaultFlow = getDefaultFlow();
    return {
      nodes: defaultFlow.mainCanvas.nodes as Node[],
      edges: defaultFlow.mainCanvas.edges as Edge[],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialFlow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(getInitialFlow.edges);
  
  const onFlowStateUpdateRef = useRef(onFlowStateUpdate);

  useEffect(() => {
    onFlowStateUpdateRef.current = onFlowStateUpdate;
  }, [onFlowStateUpdate]);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const nodeOps = useCanvasNodeOperations({
    setNodes,
    saveHistory: () => {},
    setEdges,
  });

  const { pushHistory } = useCanvasKeyboardShortcuts({
    nodes,
    edges,
    setNodes,
    setEdges,
    deleteSelectedNodes: () => {
      const selectedNodes = nodes.filter((n) => n.selected);
      setNodes((currentNodes) => nodeOps.deleteSelectedNodes(currentNodes, selectedNodes));
      
      if (onNodeSelect && selectedNodes.length > 0) {
        onNodeSelect(null);
      }
    },
    deleteSelectedEdges: () => {
      setEdges((currentEdges) => nodeOps.deleteSelectedEdges(currentEdges));
    },
  });

  const { createNodeFromTemplate: createNode, updateNode: update } =
    useCanvasNodeOperations({
      setNodes,
      saveHistory: pushHistory,
      setEdges,
    });

  const { onConnect } = useCanvasEdgeOperations({
    setEdges,
    saveHistory: pushHistory,
  });

  useCanvasCodeGeneration({
    nodes,
    edges,
    nestedCanvasData,
    onJsonGenerate,
    onCodeGenerate,
    reactFlowInstance: reactFlowInstance as Record<string, unknown> | undefined,
  });

  const {
    panelHeight,
    isDebuggerOpen,
    handleMouseDown,
    closeDebugger,
  } = useDebuggerPanel({ isPlaying });

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (onNodeSelect) {
        onNodeSelect(node);
      }
    },
    [onNodeSelect]
  );

  const onPaneClick = useCallback(() => {
    if (onNodeSelect) {
      onNodeSelect(null);
    }
  }, [onNodeSelect]);

  const handleNodeUpdate = useCallback(
    (nodeId: string, updates: Record<string, unknown>) => {
      update(nodeId, updates);
    },
    [update]
  );

  React.useEffect(() => {
    if (onNodeUpdate) {
      onNodeUpdate('_handler', handleNodeUpdate as unknown as Record<string, unknown>);
    }
  }, [onNodeUpdate, handleNodeUpdate]);

  React.useEffect(() => {
    if (onFlowStateUpdateRef.current) {
      onFlowStateUpdateRef.current(nodes, edges, setNodes, setEdges);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const dragData = event.dataTransfer.getData('application/reactflow');
      if (!dragData) return;

      const [type, rawMode] = dragData.includes('::') ? dragData.split('::') : [dragData, undefined];
      let mode = rawMode;
      
      if (mode === 'undefined' || mode === 'null' || mode === '') {
        mode = undefined;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      createNode(type, position, mode);
    },
    [reactFlowInstance, createNode]
  );

  return (
    <Box 
      id="canvas-container"
      sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative' }}
    >
      <Box
        ref={reactFlowWrapper}
        sx={{ 
          height: isDebuggerOpen ? `${100 - panelHeight}%` : '100%', 
          width: '100%', 
          bgcolor: 'grey.50', 
          position: 'relative',
          overflow: 'hidden',
          transition: 'height 0.3s ease',
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={viewOnly ? undefined : onNodesChange}
          onEdgesChange={viewOnly ? undefined : onEdgesChange}
          onConnect={viewOnly ? undefined : onConnect}
          onInit={setReactFlowInstance}
          onDrop={viewOnly ? undefined : onDrop}
          onDragOver={viewOnly ? undefined : onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: 150, y: 50, zoom: 1 }}
          nodesDraggable={!isPlaying && !viewOnly}
          nodesConnectable={!isPlaying && !viewOnly}
          elementsSelectable={!isPlaying && !viewOnly}
          deleteKeyCode={null}
        >
          {onUpdateNodeInternalsReady && <UpdateNodeInternalsExposer onReady={onUpdateNodeInternalsReady} />}
          <Background />
          <Controls />
          <MiniMap />
          <Panel position="top-right">
            <Paper
              sx={{
                p: 1,
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.75rem',
              }}
            >
              <Typography variant="caption">
                Nodes: {nodes.length} | Edges: {edges.length}
              </Typography>
            </Paper>
          </Panel>
        </ReactFlow>
      </Box>

      {/* Resize Handle - Only show when debugger is visible */}
      {isDebuggerOpen && (
        <Box
          onMouseDown={handleMouseDown}
          sx={{
            height: '6px',
            width: '100%',
            backgroundColor: 'divider',
            cursor: 'ns-resize',
            position: 'relative',
            zIndex: 10,
            '&:hover': {
              backgroundColor: 'primary.main',
              height: '8px',
            },
            '&:active': {
              backgroundColor: 'primary.dark',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '40px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: 'grey.400',
            }}
          />
        </Box>
      )}

      {/* Debugger Panel - Visible when opened, stays open after animation */}
      {isDebuggerOpen && (
        <Paper
          sx={{
            height: `${panelHeight}%`,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 1100,
          }}
        >
        {/* Debugger Panel Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            py: 1,
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: 'grey.50',
          }}
        >
          <Typography variant="subtitle2" fontWeight={600}>
            Debugger
          </Typography>
          <IconButton
            size="small"
            onClick={closeDebugger}
            title="Close debugger"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Debugger Content */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <DebuggerPanel
            variables={debugVariables}
            logs={debugLogs}
            currentNodeId={currentNodeId}
            isPlaying={isPlaying || false}
          />
        </Box>
      </Paper>
    )}
    </Box>
  );
};

export default RuleBuilderCanvas;
