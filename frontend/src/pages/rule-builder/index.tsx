import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Node, Edge } from '@xyflow/react';
import LeftSidebar from '../../components/RuleBuilder/LeftSidebar';
import Header from '../../components/RuleBuilder/Header';
import RuleBuilderCanvas from '../../components/RuleBuilder/Canvas';
import RightSidebar from '../../components/RuleBuilder/RightSidebar';
import NestedCanvas from '../../components/RuleBuilder/NestedCanvas';
import OutputModal from '../../components/RuleBuilder/OutputModal';
import { ValidationProvider } from '../../validation/context';
import { ValidationErrorModal } from '../../components/RuleBuilder/ValidationErrorModal';
import { useGetFlowQuery, useSaveFlowMutation, useGetNodesQuery } from '../../redux/Api/Rule-builder';
import { transformApiFlowData, type ApiNode, type ApiEdge } from '../../utils/Flow/FlowTransformers';
import { setApiNodes } from '../../utils/Flow/nodeTemplateService';
import { validateTypeScriptCode } from '../../utils/Flow/codeValidator';
import {
  useFlowAnimation,
  useFlowState,
  useNestedCanvasManager,
} from '../../hooks/RuleBuilder';

interface RuleBuilderProps {
  viewOnly?: boolean;
}

const RuleBuilder: React.FC<RuleBuilderProps> = ({ viewOnly = false }) => {
  const { id: ruleId } = useParams<{ id: string }>();
  
  const { data: nodesData, isLoading: isLoadingNodes, error: nodesError } = useGetNodesQuery('rule_builder');
  
  const { data: flowData, isLoading: isLoadingFlow, error: flowError } = useGetFlowQuery(
    { ruleId: ruleId || '', category: 'rule_builder' },
    { skip: !ruleId, refetchOnMountOrArgChange: true }
  );
  
  const [saveFlow, { isLoading: isSaving }] = useSaveFlowMutation();
  
  const flowState = useFlowState();
  const nestedCanvasManager = useNestedCanvasManager();

  const updateNodeInternalsRef = React.useRef<((nodeId: string) => void) | null>(null);
  
  const [apiNodesInitialized, setApiNodesInitialized] = React.useState(false);
  
  useEffect(() => {
    if (nodesData && Array.isArray(nodesData)) {
      setApiNodes(nodesData as unknown as ApiNode[]);
      setApiNodesInitialized(true);
    }
  }, [nodesData]);
  
  const transformedFlowData = useMemo(() => {

    if (!flowData?.result || !apiNodesInitialized) return null;
    
    const flowJson = flowData.result.flow_json || flowData.flow;
    
    return transformApiFlowData(
      flowJson.nodes as ApiNode[] || [],
      flowJson.edges as ApiEdge[] || []
    );
  }, [flowData, apiNodesInitialized]);

  useEffect(() => {
    if (transformedFlowData?.nestedFlows) {
      Object.entries(transformedFlowData.nestedFlows).forEach(([nodeId, nestedFlow]) => {
        nestedCanvasManager.setNestedCanvasData(prev => ({
          ...prev,
          [nodeId]: nestedFlow,
        }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transformedFlowData]);

  const [showErrorModal, setShowErrorModal] = React.useState(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = React.useState(false);
  const [allowNavigation, setAllowNavigation] = React.useState(false);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowNavigation) return;
      event.preventDefault();
      event.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [allowNavigation]);
  
  const [isPaused, setIsPaused] = React.useState(false);
  
  const {
    playFlowAnimation,
    stopAnimation,
    pauseAnimation,
    resumeAnimation,
    updateFlowState,
    animationTimeoutRef,
  } = useFlowAnimation({
    isPlaying: Boolean(flowState.currentAnimationNode),
    setIsPlaying: () => {},
    nestedCanvasData: nestedCanvasManager.nestedCanvasData,
    setDebugVariables: flowState.setDebugVariables,
    setDebugLogs: flowState.setDebugLogs,
    setCurrentAnimationNode: flowState.setCurrentAnimationNode,
  });

  const nodeUpdateHandlerRef = useRef<((nodeId: string, updates: Record<string, unknown>) => void) | null>(null);

  const handlePlayClick = () => {
    if (nestedCanvasManager.activeNestedCanvas) {
      nestedCanvasManager.setActiveNestedCanvas(null);
      flowState.setSelectedNode(null);
      setTimeout(playFlowAnimation, 100);
    } else {
      playFlowAnimation();
    }
  };

  const handlePauseClick = () => {
    setIsPaused(true);
    pauseAnimation();
  };

  const handleResumeClick = () => {
    setIsPaused(false);
    resumeAnimation();
  };

  const handleStopClick = () => {
    setIsPaused(false);
    stopAnimation();
    flowState.setDebugLogs([]);
    flowState.setDebugVariables({});
  };

  const handleDisplayJson = () => {
    window.generateFlowJson?.();
  };

  const handleGenerateCode = () => {
    window.generateFlowCode?.();
  };

  const handleSave = async () => {
    if (!ruleId) {
      toast.error('Rule ID not found');
      return;
    }

    try {
      const flowJson = window.generateFlowJson?.();
      if (!flowJson) {
        toast.error('Failed to generate flow data');
        return;
      }

      const tsCode = window.generateFlowCode?.();
      if (!tsCode) {
        toast.error('Failed to generate TypeScript code');
        return;
      }

      let parsedFlowJson;
      try {
        parsedFlowJson = JSON.parse(flowJson);
      } catch (parseError) {
        toast.error('Failed to parse flow data: Invalid JSON format');
        console.error('JSON parse error:', parseError);
        return;
      }

      const validationResult = validateTypeScriptCode(tsCode);
      const status = validationResult.isValid ? 'pass' : 'fail';

      const tsFileBase64 = btoa(unescape(encodeURIComponent(tsCode)));

      const payload = {
        flow_json: parsedFlowJson,
        ts_file_base64: tsFileBase64,
        status,
      };

      await saveFlow({
        ruleId,
        flowData: payload,
        category: 'rule_builder',
      }).unwrap();

      // Close JSON modal but keep code modal open
      flowState.setJsonModalOpen(false);
      
      // Show save success modal (code modal stays open in background)
      setShowSaveSuccessModal(true);
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || 'Failed to save flow';
      toast.error(errorMessage);
    }
  };

  const handleNodeSelect = useCallback((node: Node | null) => {
    if (node?.data.nodeType === 'Start' || node?.data.nodeType === 'End') {
      flowState.setSelectedNode(null);
      return;
    }
    
    if (node?.data.nodeType === 'HandleTransaction') {
      nestedCanvasManager.openNestedCanvas(node.id, String(node.data.label || 'Handle Transaction'));
      flowState.setSelectedNode(null);
    } else {
      flowState.setSelectedNode(node);
      nestedCanvasManager.setActiveNestedCanvas(null);
    }
  }, [nestedCanvasManager, flowState]);

  const handleNodeUpdateHandlerReady = useCallback((handler: (nodeId: string, updates: Record<string, unknown>) => void) => {
    nodeUpdateHandlerRef.current = handler;
  }, []);

  const handleNodeUpdate = useCallback((nodeId: string, updates: Record<string, unknown>) => {
    nodeUpdateHandlerRef.current?.(nodeId, updates);
  }, []);

  const handleUpdateNodeInternalsReady = useCallback((updateFn: (nodeId: string) => void) => {
    updateNodeInternalsRef.current = updateFn;
  }, []);

  const handleUpdateNodeInternals = useCallback((nodeId: string) => {
    updateNodeInternalsRef.current?.(nodeId);
  }, []);

  const handleFlowStateUpdate = useCallback((    nodes: Node[], 
    edges: Edge[], 
    setNodes: (nodes: Node[] | ((prevNodes: Node[]) => Node[])) => void, 
    setEdges: (edges: Edge[] | ((prevEdges: Edge[]) => Edge[])) => void
  ) => {
    updateFlowState(nodes, edges, setNodes, setEdges);
    flowState.setAllNodes(nodes);
    flowState.setEdges(edges);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateFlowState, flowState.setAllNodes, flowState.setEdges]);
  
  const handleNestedCanvasSave = useCallback((nodes: Node[], edges: Edge[]) => {
    if (nestedCanvasManager.activeNestedCanvas) {
      nestedCanvasManager.handleNestedCanvasSave(nestedCanvasManager.activeNestedCanvas, nodes, edges);
    }
  }, [nestedCanvasManager]);

  const canvasWrapperStyle = useMemo(() => ({
    display: nestedCanvasManager.activeNestedCanvas ? 'none' : 'flex',
    flex: 1,
    flexDirection: 'column' as const,
    height: '100%',
    width: '100%'
  }), [nestedCanvasManager.activeNestedCanvas]);

  useEffect(() => {
    const timeoutRef = animationTimeoutRef.current;
    return () => {
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
    };
  }, [animationTimeoutRef]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header
        isPlaying={Boolean(flowState.currentAnimationNode)}
        isPaused={isPaused}
        onPlayClick={handlePlayClick}
        onPauseClick={handlePauseClick}
        onResumeClick={handleResumeClick}
        onStopClick={handleStopClick}
        onDisplayJson={handleDisplayJson}
        onGenerateCode={handleGenerateCode}
        onViewErrors={() => setShowErrorModal(true)}
        onSave={handleSave}
        isSaving={isSaving}
        viewOnly={viewOnly}
        hidePlayControls={true}
        title="Rule Builder"
        backUrl="/editor?tab=rule_builder"
      />
      {nodesError || flowError ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" color="error">
            Error loading rule builder
          </Typography>
          <Typography variant="body2">
            {nodesError ? 'Failed to load node templates' : 'Failed to load rule flow'}
          </Typography>
        </Box>
      ) : isLoadingNodes || isLoadingFlow || !apiNodesInitialized ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6">
            {isLoadingNodes ? 'Loading node templates...' : isLoadingFlow ? 'Loading rule flow...' : 'Initializing...'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {isLoadingNodes && 'Fetching available nodes from server'}
            {isLoadingFlow && !isLoadingNodes && 'Fetching rule configuration'}
            {!isLoadingNodes && !isLoadingFlow && !apiNodesInitialized && 'Setting up canvas...'}
          </Typography>
        </Box>
      ) : !transformedFlowData ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Typography>Preparing canvas...</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          {!viewOnly && (
            <LeftSidebar 
              mode="main" 
              collapsed={flowState.sidebarCollapsed}
              onToggleCollapse={flowState.handleToggleSidebar}
              hideCustomFunctions={nestedCanvasManager.activeNestedCanvas !== null}
              allNodes={flowState.allNodes}
              edges={flowState.edges}
              selectedNodeId={flowState.selectedNode?.id || null}
              ruleId={ruleId}
            />
          )}
          <Box sx={canvasWrapperStyle}>
            <RuleBuilderCanvas
              isPlaying={Boolean(flowState.currentAnimationNode)}
              onJsonGenerate={flowState.handleJsonGenerate}
              onCodeGenerate={flowState.handleCodeGenerate}
              onNodeSelect={handleNodeSelect}
              onNodeUpdateHandlerReady={handleNodeUpdateHandlerReady}
              debugVariables={flowState.debugVariables}
              debugLogs={flowState.debugLogs}
              currentNodeId={flowState.currentAnimationNode}
              nestedCanvasData={nestedCanvasManager.nestedCanvasData}
              viewOnly={viewOnly}
              onFlowStateUpdate={handleFlowStateUpdate}
              initialNodes={transformedFlowData?.nodes}
              initialEdges={transformedFlowData?.edges}
              onUpdateNodeInternalsReady={handleUpdateNodeInternalsReady}
              isNestedCanvasActive={Boolean(nestedCanvasManager.activeNestedCanvas)}
            />
          </Box>
          <RightSidebar
            key={flowState.selectedNode?.id || 'no-selection'}
            selectedNode={flowState.selectedNode}
            onClose={flowState.handleCloseRightSidebar}
            onUpdateNode={handleNodeUpdate}
            allNodes={flowState.allNodes}
            viewOnly={viewOnly}
            ruleId={ruleId}
            edges={flowState.edges}
            updateNodeInternals={handleUpdateNodeInternals}
          />

          {nestedCanvasManager.activeNestedCanvas && (
            <NestedCanvas
              key={`nested-${nestedCanvasManager.activeNestedCanvas}`}
              nodeId={nestedCanvasManager.activeNestedCanvas}
              nodeLabel={nestedCanvasManager.activeNestedCanvasLabel}
              initialNodes={nestedCanvasManager.nestedCanvasData[nestedCanvasManager.activeNestedCanvas]?.nodes}
              initialEdges={nestedCanvasManager.nestedCanvasData[nestedCanvasManager.activeNestedCanvas]?.edges}
              onBack={nestedCanvasManager.handleNestedCanvasBack}
              onSave={handleNestedCanvasSave}
              viewOnly={viewOnly}
              ruleId={ruleId}
              mainCanvasNodes={flowState.allNodes}
            />
          )}
        </Box>
      )}

      <OutputModal
        open={flowState.jsonModalOpen}
        onClose={() => flowState.setJsonModalOpen(false)}
        title="JSON Output"
        content={flowState.jsonOutput}
        emptyMessage="Click 'Display JSON' to see output"
        language="json"
      />

      <OutputModal
        open={flowState.codeModalOpen}
        onClose={() => flowState.setCodeModalOpen(false)}
        title="Generated TypeScript Code"
        content={flowState.codeOutput}
        emptyMessage="Click 'Generate Code' to see output"
        onDownload={() => flowState.handleDownload(flowState.generatedCode)}
        language="typescript"
        enableValidation={true}
        validationType="rule"
      />

      <ValidationErrorModal
        open={showErrorModal}
        onClose={() => setShowErrorModal(false)}
      />

      <Dialog open={showSaveSuccessModal} onClose={() => setShowSaveSuccessModal(false)}>
        <DialogTitle>Flow Saved Successfully</DialogTitle>
        <DialogContent>
          <Typography>Your rule flow has been saved. What would you like to do next?</Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowSaveSuccessModal(false);
              // Keep code modal open when staying on editor
            }} 
            variant="outlined"
          >
            Stay on Editor
          </Button>
          <Button 
            onClick={() => {
              setShowSaveSuccessModal(false);
              flowState.setCodeModalOpen(false);
              setAllowNavigation(true);
              setTimeout(() => {
                window.location.href = '/editor?tab=rule_builder';
              }, 0);
            }} 
            variant="contained"
          >
            Proceed to Next Step
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const RuleBuilderWithValidation: React.FC<RuleBuilderProps> = (props) => {
  return (
    <ValidationProvider>
      <RuleBuilder {...props} />
    </ValidationProvider>
  );
};

export default RuleBuilderWithValidation;