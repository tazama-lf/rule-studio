import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
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
import { extractCountersFromFlow } from '../../../utils/Flow/FlowDefaults';
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

const EMPTY_NESTED_DATA: Record<string, NestedCanvasData> = {};
const EMPTY_DEBUG_VARS: Record<string, unknown> = {};
const EMPTY_DEBUG_LOGS: DebugLog[] = [];
const DEFAULT_VIEWPORT = { x: 150, y: 50, zoom: 1 };

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
  onNodeUpdateHandlerReady?: (handler: (nodeId: string, updates: Record<string, unknown>) => void) => void;
  debugVariables?: Record<string, unknown>;
  debugLogs?: DebugLog[];
  isNestedCanvasActive?: boolean;
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
  mode?: 'rule-builder' | 'test-case-generate';
  txtp?: string;
}



const RuleBuilderCanvas: React.FC<CanvasProps> = memo(({
  isPlaying, 
  onJsonGenerate, 
  onCodeGenerate,
  onNodeSelect,
  onNodeUpdateHandlerReady,
  nestedCanvasData = EMPTY_NESTED_DATA,
  debugVariables = EMPTY_DEBUG_VARS,
  debugLogs = EMPTY_DEBUG_LOGS,
  isNestedCanvasActive = false,
  currentNodeId,
  onFlowStateUpdate,
  viewOnly = false,
  initialNodes,
  initialEdges,
  onUpdateNodeInternalsReady,
  mode = 'rule-builder',
  txtp,
}) => {
  const extractedNestedCountersRef = useRef(false);
  const hasInitializedStateRef = useRef(false);
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (!hasInitializedStateRef.current && initialNodes && initialNodes.length > 0 && initialEdges) {
      setNodes(initialNodes);
      setEdges(initialEdges);
      hasInitializedStateRef.current = true;

      const hasNestedFlows = nestedCanvasData ? Object.keys(nestedCanvasData).length > 0 : false;
      extractCountersFromFlow(initialNodes, initialEdges, hasNestedFlows ? (nestedCanvasData || {}) : {});
      extractedNestedCountersRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes, initialEdges]);
  
  const onFlowStateUpdateRef = useRef(onFlowStateUpdate);

  useEffect(() => {
    onFlowStateUpdateRef.current = onFlowStateUpdate;
  }, [onFlowStateUpdate]);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const saveHistoryNoOp = useCallback(() => {}, []);

  const nodeOps = useCanvasNodeOperations({
    setNodes,
    saveHistory: saveHistoryNoOp,
    setEdges,
  });

  const deleteSelectedNodesCallback = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    setNodes((currentNodes) => nodeOps.deleteSelectedNodes(currentNodes, selectedNodes));
    
    if (onNodeSelect && selectedNodes.length > 0) {
      onNodeSelect(null);
    }
  }, [nodes, setNodes, nodeOps, onNodeSelect]);

  const deleteSelectedEdgesCallback = useCallback(() => {
    setEdges((currentEdges) => nodeOps.deleteSelectedEdges(currentEdges));
  }, [setEdges, nodeOps]);

  const { pushHistory } = useCanvasKeyboardShortcuts({
    nodes,
    edges,
    setNodes,
    setEdges,
    deleteSelectedNodes: deleteSelectedNodesCallback,
    deleteSelectedEdges: deleteSelectedEdgesCallback,
    enabled: !isNestedCanvasActive,
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
    mode,
    txtp,
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
    if (onNodeUpdateHandlerReady) {
      onNodeUpdateHandlerReady(handleNodeUpdate);
    }
  }, [onNodeUpdateHandlerReady, handleNodeUpdate]);

  const nodesLengthRef = useRef(nodes.length);
  const edgesLengthRef = useRef(edges.length);

  const definitionFingerprint = React.useMemo(() => {
    return nodes
      .filter(n => {
        const d = n.data as Record<string, unknown>;
        return d?.mode === 'definition' || d?.generation_type === 'definition';
      })
      .map(n => {
        const d = n.data as Record<string, unknown>;
        const p = d?.params as Record<string, string> | undefined;
        return `${n.id}:${p?.function_name || ''}:${p?.typeName || ''}:${p?.parameter_count || '0'}:${p?.parameters || '[]'}:${(p?.code_template || '').length}`;
      })
      .join('|');
  }, [nodes]);

  const prevDefinitionFingerprintRef = useRef(definitionFingerprint);

  React.useEffect(() => {
    const lengthChanged =
      nodesLengthRef.current !== nodes.length || edgesLengthRef.current !== edges.length;
    const defsChanged = prevDefinitionFingerprintRef.current !== definitionFingerprint;

    if (onFlowStateUpdateRef.current && (lengthChanged || defsChanged)) {
      onFlowStateUpdateRef.current(nodes, edges, setNodes, setEdges);
      nodesLengthRef.current = nodes.length;
      edgesLengthRef.current = edges.length;
      prevDefinitionFingerprintRef.current = definitionFingerprint;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, definitionFingerprint]);

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
          defaultViewport={DEFAULT_VIEWPORT}
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
});

RuleBuilderCanvas.displayName = 'RuleBuilderCanvas';

export default RuleBuilderCanvas;
