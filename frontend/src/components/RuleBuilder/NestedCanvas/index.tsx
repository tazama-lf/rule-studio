import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useUpdateNodeInternals,
  type ReactFlowInstance,
  type Connection,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditableNode from '../EditableNode';
import LeftSidebar from '../LeftSidebar';
import RightSidebar from '../RightSidebar';
import { getNodeTemplate } from '../../../utils/Flow/nodeTemplateService';
import { generateNestedNodeId, setCounters } from '../../../utils/Flow/FlowDefaults';
import { getLabelForHandle, getColorForHandle } from '../../../utils/Common/helpers';
import { useValidationContext } from '../../../validation/context';

const nodeTypes = {
  editableNode: EditableNode,
};

const UpdateNodeInternalsExposer: React.FC<{ onReady: (updateFn: (nodeId: string) => void) => void }> = ({ onReady }) => {
  const updateNodeInternals = useUpdateNodeInternals();
  
  useEffect(() => {
    onReady(updateNodeInternals);
  }, [onReady, updateNodeInternals]);
  
  return null;
};

interface NestedCanvasProps {
  nodeId: string;
  nodeLabel: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onBack: () => void;
  onSave: (nodes: Node[], edges: Edge[]) => void;
  viewOnly?: boolean;
  ruleId?: string;
  mainCanvasNodes?: Node[];
}

const NestedCanvas: React.FC<NestedCanvasProps> = ({
  nodeLabel,
  initialNodes: providedInitialNodes,
  initialEdges: providedInitialEdges,
  onBack,
  onSave,
  viewOnly = false,
  ruleId,
  mainCanvasNodes = [],
}) => {
  const [initialNodesEdges] = useState(() => {
    if (providedInitialNodes) {
      const maxNestedNodeId = providedInitialNodes.reduce((max, node) => {
        const match = node.id.match(/^nested-node-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          return Math.max(max, num);
        }
        return max;
      }, 0);
      if (maxNestedNodeId > 0) {
        setCounters(0, 0, maxNestedNodeId);
      }
      
      return { nodes: providedInitialNodes, edges: providedInitialEdges || [] };
    }

    const startNodeId = generateNestedNodeId();
    const endNodeId = generateNestedNodeId();

    const startTemplate = getNodeTemplate('Start');
    const endTemplate = getNodeTemplate('End');

    const getDefaultParams = (template: ReturnType<typeof getNodeTemplate>) => {
      const params: Record<string, string> = {};
      if (template?.inputs) {
        template.inputs.forEach((input) => {
          params[input.key] = input.defaultValue || '';
        });
      }
      return params;
    };

    const nodes: Node[] = [
      {
        id: startNodeId,
        type: 'editableNode',
        position: { x: 100, y: 50 },
        data: {
          label: startTemplate?.displayName || 'Start',
          nodeType: 'Start',
          params: getDefaultParams(startTemplate),
        },
      },
      {
        id: endNodeId,
        type: 'editableNode',
        position: { x: 100, y: 300 },
        data: {
          label: endTemplate?.displayName || 'End',
          nodeType: 'End',
          params: getDefaultParams(endTemplate),
        },
      },
    ];

    return { nodes, edges: [] };
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesEdges.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialNodesEdges.edges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const updateNodeInternalsRef = useRef<((nodeId: string) => void) | null>(null);
  const { clearNodeErrors } = useValidationContext();
  
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const saveTimeoutRef = useRef<number | null>(null);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  const prevProvidedNodesRef = useRef<Node[] | undefined>(undefined);
  const prevProvidedEdgesRef = useRef<Edge[] | undefined>(undefined);
  
  useEffect(() => {
    if (providedInitialNodes !== undefined && providedInitialNodes !== prevProvidedNodesRef.current) {
      prevProvidedNodesRef.current = providedInitialNodes;
      setNodes(providedInitialNodes);
    }
  }, [providedInitialNodes, setNodes]);

  useEffect(() => {
    if (providedInitialEdges !== undefined && providedInitialEdges !== prevProvidedEdgesRef.current) {
      prevProvidedEdgesRef.current = providedInitialEdges;
      setEdges(providedInitialEdges);
    }
  }, [providedInitialEdges, setEdges]);
  
  const allNodes = useMemo(() => {
    return [...mainCanvasNodes, ...nodes];
  }, [mainCanvasNodes, nodes]);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      onSaveRef.current(nodes, edges);
    }, 1000);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [nodes, edges]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      onSaveRef.current(nodesRef.current, edgesRef.current);
    };
  }, []);

  const updateNode = useCallback(
    (nodeId: string, updates: Record<string, unknown>, shouldForceSave = false) => {
      setNodes((nds) => {
        const updatedNodes = nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...updates } }
            : node
        );
        if (shouldForceSave) {
          nodesRef.current = updatedNodes;
          setTimeout(() => {
            onSaveRef.current(updatedNodes, edgesRef.current);
          }, 50);
        }
        
        return updatedNodes;
      });
    },
    [setNodes]
  );

  const deleteSelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);

    const deletableNodes = selectedNodes.filter(
      (node) =>
        String(node.data.nodeType) !== 'Start' &&
        String(node.data.nodeType) !== 'End'
    );

    if (deletableNodes.length > 0) {
      const deletableIds = new Set(deletableNodes.map((n) => n.id));

      if (selectedNode && deletableIds.has(selectedNode.id)) {
        setSelectedNode(null);
      }

      deletableIds.forEach((nodeId) => {
        clearNodeErrors(nodeId);
      });

      setNodes((currentNodes) =>
        currentNodes.filter((node) => !deletableIds.has(node.id))
      );

      setEdges((currentEdges) =>
        currentEdges.filter(
          (edge) => !deletableIds.has(edge.source) && !deletableIds.has(edge.target)
        )
      );
    }
  }, [nodes, setNodes, setEdges, clearNodeErrors, selectedNode]);

  const deleteSelectedEdges = useCallback(() => {
    setEdges((currentEdges) => currentEdges.filter((edge) => !edge.selected));
  }, [setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
  
      const hasMultipleHandles = params.sourceHandle !== null;

      setEdges((eds) => {
        if (!hasMultipleHandles) {
          const sourceHasEdge = eds.some((edge) => edge.source === params.source);

          if (sourceHasEdge) {
            console.warn('Each node can only have one outgoing connection');
            return eds;
          }
        } else {
          const handleHasEdge = eds.some(
            (edge) =>
              edge.source === params.source && edge.sourceHandle === params.sourceHandle
          );

          if (handleHasEdge) {
            console.warn('This handle already has a connection');
            return eds;
          }
        }
        const edgeWithLabel = {
          ...params,
          label:
            hasMultipleHandles && params.sourceHandle
              ? getLabelForHandle(params.sourceHandle)
              : undefined,
          style:
            hasMultipleHandles && params.sourceHandle
              ? {
                  stroke: getColorForHandle(params.sourceHandle),
                  strokeWidth: 2,
                }
              : undefined,
        };

        return addEdge(edgeWithLabel, eds);
      });
    },
    [setEdges]
  );
  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (viewOnly) {
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }

        event.preventDefault();
        const selectedEdges = edges.filter((edge) => edge.selected);

        if (selectedEdges.length > 0) {
          deleteSelectedEdges();
        } else {
          deleteSelectedNodes();
        }
      }

      if (event.ctrlKey && event.key === 'a') {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }

        event.preventDefault();
        setNodes((nds) => nds.map((node) => ({ ...node, selected: true })));
        setEdges((eds) => eds.map((edge) => ({ ...edge, selected: true })));
      }
      if (event.key === 'Escape') {
        setNodes((nds) => nds.map((node) => ({ ...node, selected: false })));
        setEdges((eds) => eds.map((edge) => ({ ...edge, selected: false })));
        setSelectedNode(null);
      }
    },
    [viewOnly, edges, setNodes, setEdges, deleteSelectedNodes, deleteSelectedEdges]
  );
  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

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

      const [type, mode] = dragData.includes('::') ? dragData.split('::') : [dragData, undefined];
      
      const cleanMode = mode === 'undefined' ? undefined : mode;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const template = getNodeTemplate(type, cleanMode);
      
      const newNodeId = generateNestedNodeId();

      const defaultParams: Record<string, string> = {};
      if (template?.inputs) {
        template.inputs.forEach((input) => {
          defaultParams[input.key] = input.defaultValue || '';
        });
      }

      const newNode: Node = {
        id: newNodeId,
        type: 'editableNode',
        position,
        data: {
          label: template?.displayName || type,
          nodeType: type,
          params: defaultParams,
          mode: cleanMode,
          generation_type: template?.generation_type || cleanMode,
          function_name: template?.function_name,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.data.nodeType === 'Start' || node.data.nodeType === 'End') {
        setSelectedNode(null);
        return;
      }
      setSelectedNode(node);
    },
    []
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleCloseRightSidebar = () => {
    setSelectedNode(null);
  };

  const handleNodeUpdate = (nodeId: string, updates: Record<string, unknown>, shouldForceSave = false) => {
    updateNode(nodeId, updates, shouldForceSave);
  };

  const handleUpdateNodeInternalsReady = useCallback((updateFn: (nodeId: string) => void) => {
    updateNodeInternalsRef.current = updateFn;
  }, []);

  const handleUpdateNodeInternals = useCallback((nodeId: string) => {
    updateNodeInternalsRef.current?.(nodeId);
  }, []);

  const handleBack = useCallback(() => {
    onSave(nodesRef.current, edgesRef.current);
    onBack();
  }, [onSave, onBack]);

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'background.paper',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <IconButton onClick={handleBack} color="primary" size="large">
          <ArrowBackIcon />
        </IconButton>
        <Box flex={1}>
          <Typography variant="h6" fontWeight={600}>
            {nodeLabel} - Internal Flow
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Define the internal logic for this function
          </Typography>
        </Box>
      </Paper>
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {!viewOnly && <LeftSidebar mode="modal" hideCustomFunctions={false} hideImportNode={true} showGlobalVariables={true} allNodes={nodes} edges={edges} selectedNodeId={selectedNode?.id || null} ruleId={ruleId} />}
        <Box ref={reactFlowWrapper} sx={{ flex: 1, position: 'relative' }}>
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
            nodesDraggable={!viewOnly}
            nodesConnectable={!viewOnly}
            elementsSelectable={!viewOnly}
            deleteKeyCode={null}
          >
            <UpdateNodeInternalsExposer onReady={handleUpdateNodeInternalsReady} />
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </Box>
        <RightSidebar
          key={selectedNode?.id || 'no-selection'}
          selectedNode={selectedNode}
          onClose={handleCloseRightSidebar}
          onUpdateNode={handleNodeUpdate}
          allNodes={allNodes}
          viewOnly={viewOnly}
          ruleId={ruleId}
          edges={edges}
          updateNodeInternals={handleUpdateNodeInternals}
        />
      </Box>
    </Box>
  );
};

export default NestedCanvas;
