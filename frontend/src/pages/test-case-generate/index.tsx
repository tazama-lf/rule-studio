import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { Node, Edge } from '@xyflow/react';
import LeftSidebar from '../../components/RuleBuilder/LeftSidebar';
import Header from '../../components/RuleBuilder/Header';
import RuleBuilderCanvas from '../../components/RuleBuilder/Canvas';
import RightSidebar from '../../components/RuleBuilder/RightSidebar';
import OutputModal from '../../components/RuleBuilder/OutputModal';
import { ValidationProvider } from '../../validation/context';
import { ValidationErrorModal } from '../../components/RuleBuilder/ValidationErrorModal';
import { useGetNodesQuery, useSaveFlowMutation, useGetGlobalVariablesQuery, useGetFlowQuery } from '../../redux/Api/Rule-builder';
import { setApiNodes } from '../../utils/Flow/nodeTemplateService';
import { transformApiFlowData, type ApiNode as ApiFlowNode, type ApiEdge } from '../../utils/Flow/FlowTransformers';
import { validateTypeScriptCode } from '../../utils/Flow/codeValidator';
import { generateTestCaseCode } from '../../utils/Flow/CodeGenerator';
import { useFlowState } from '../../hooks/RuleBuilder';
import { extractData } from '../../utils/Common/storage';
import { LocalStorage } from '../../utils/Common/enums';
import { useUpdateMetadataMutation } from '../../redux/Api/Rules';
import { transformRuleRequestToCode } from '../../utils/Flow/transformRuleRequest';
import { RESET_TEST_CASE_PAYLOAD } from '../../utils/Constants';

interface TestCaseGenerateProps {
  viewOnly?: boolean;
}

const TestCaseGenerate: React.FC<TestCaseGenerateProps> = ({ viewOnly = false }) => {
  const { ruleId } = useParams<{ ruleId: string }>();

  const { data: nodesData, isLoading: isLoadingNodes, error: nodesError } = useGetNodesQuery('test_case_generation');
  const { data: globalVariablesData } = useGetGlobalVariablesQuery(ruleId || '', {
    skip: !ruleId,
  });
  const { data: flowData } = useGetFlowQuery(
    { ruleId: ruleId || '', category: 'test_case_generation' },
    { skip: !ruleId, refetchOnMountOrArgChange: true }
  );

  const [saveFlow, { isLoading: isSaving }] = useSaveFlowMutation();
  const [update] = useUpdateMetadataMutation();

  const flowState = useFlowState();

  const updateNodeInternalsRef = useRef<((nodeId: string) => void) | null>(null);
  // Initialize API nodes synchronously using useMemo
  const apiNodesInitialized = useMemo(() => {
    if (!nodesData || !Array.isArray(nodesData)) return false;
    setApiNodes(nodesData);
    return true;
  }, [nodesData]);

  const transformedFlowData = useMemo(() => {
    if (!flowData?.result || !apiNodesInitialized) return null;

    const flowJson = flowData.result.flow_json || flowData.flow;

    const transformedData = transformApiFlowData(
      flowJson.nodes as ApiFlowNode[] || [],
      flowJson.edges as ApiEdge[] || []
    );

    if (globalVariablesData && transformedData?.nodes) {
      const globalVars = globalVariablesData as { RuleConfig?: unknown; RuleRequest?: unknown };

      transformedData.nodes = transformedData.nodes.map((node) => {
        if (node.data.nodeType === 'RuleConfigFactory') {
          try {
            if (globalVars.RuleConfig) {
              return {
                ...node,
                data: {
                  ...node.data,
                  params: {
                    ...(node.data.params as Record<string, string> || {}),
                    ruleConfigData: JSON.stringify(globalVars.RuleConfig),
                  },
                },
              };
            }
          } catch (error) {
            console.error('Error updating RuleConfigFactory with global variables:', error);
          }
        }

        if (node.data.nodeType === 'RuleRequestFactory') {
          try {
            if (globalVars.RuleRequest) {
              const transformedCode = transformRuleRequestToCode(globalVars.RuleRequest);
              return {
                ...node,
                data: {
                  ...node.data,
                  params: {
                    ...(node.data.params as Record<string, string> || {}),
                    ruleRequestData: transformedCode,
                  },
                },
              };
            }
          } catch (error) {
            console.error('Error updating RuleRequestFactory with global variables:', error);
          }
        }

        return node;
      });
    }

    return transformedData;
  }, [flowData, apiNodesInitialized, globalVariablesData]);

  useEffect(() => {
    window.globalVariablesData = globalVariablesData || null;
  }, [globalVariablesData]);

  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState<boolean>(false);
  const [showResetConfirmDialog, setShowResetConfirmDialog] = useState<boolean>(false);
  const [allowNavigation, setAllowNavigation] = useState<boolean>(false);

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

  const nodeUpdateHandlerRef = useRef<((nodeId: string, updates: Record<string, unknown>) => void) | null>(null);

  const handleDisplayJson = useCallback(() => {
    window.generateFlowJson?.();
  }, []);

  const handleGenerateCode = useCallback(() => {
    window.generateFlowCode?.();
  }, []);

  const handleSave = useCallback(async () => {
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
      } catch {
        toast.error('Failed to parse flow data: Invalid JSON format');
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
        category: 'test_case_generation',
      }).unwrap().then((res) => {
        if (res) {
          update({
            id: ruleId,
            body: {
              metadata: {
                sync: true,
                test: false,
                deploy: false,
                simulation: false
              }
            }
          }).unwrap()
        }
      });

      flowState.setJsonModalOpen(false);
      setShowSaveSuccessModal(true);
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || 'Failed to save test case';
      toast.error(errorMessage);
    }
  }, [ruleId, saveFlow, flowState, update]);

  const handleReset = useCallback(async () => {
    if (!ruleId) {
      toast.error('Rule ID not found');
      return;
    }

    try {
      const transformedResetFlow = transformApiFlowData(
        RESET_TEST_CASE_PAYLOAD.nodes as ApiFlowNode[],
        RESET_TEST_CASE_PAYLOAD.edges as ApiEdge[]
      );

      const tsCode = generateTestCaseCode(
        transformedResetFlow.nodes,
        transformedResetFlow.edges
      );
      
      if (!tsCode) {
        toast.error('Failed to generate TypeScript code');
        return;
      }

      const validationResult = validateTypeScriptCode(tsCode);
      const status = validationResult.isValid ? 'pass' : 'fail';
      const tsFileBase64 = btoa(unescape(encodeURIComponent(tsCode)));

      const payload = {
        flow_json: RESET_TEST_CASE_PAYLOAD,
        ts_file_base64: tsFileBase64,
        status,
      };

      await saveFlow({
        ruleId,
        flowData: payload,
        category: 'test_case_generation',
      }).unwrap().then((res) => {
        if (res) {
          update({
            id: ruleId,
            body: {
              metadata: {
                sync: true,
                test: false,
                deploy: false,
                simulation: false
              }
            }
          }).unwrap();
        }
      });

      toast.success('Test case flow reset to default template successfully');
      setShowResetConfirmDialog(false);
      
      // Allow navigation and reload the page to reflect the reset
      setAllowNavigation(true);
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error: unknown) {
      console.error('Reset test case flow error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset test case flow';
      toast.error(errorMessage);
    }
  }, [ruleId, saveFlow, update]);

  const handleNodeSelect = useCallback((node: Node | null) => {
    if (node?.data.nodeType === 'Start' || node?.data.nodeType === 'End') {
      return;
    }
    flowState.setSelectedNode(node);
  }, [flowState]);

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

  const handleFlowStateUpdate = useCallback((
    nodes: Node[],
    edges: Edge[]
  ) => {
    flowState.setAllNodes(nodes);
    flowState.setEdges(edges);
  }, [flowState]);

  const mode = extractData('mode', LocalStorage);

  // Hide save and reset buttons when rule ID is 21
  const isStaticRule = ruleId === '21';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header
        hidePlayControls={true}
        onPlayClick={() => { }}
        onStopClick={() => { }}
        onDisplayJson={handleDisplayJson}
        onGenerateCode={handleGenerateCode}
        onViewErrors={() => setShowErrorModal(true)}
        onSave={!isStaticRule ? handleSave : undefined}
        onReset={!isStaticRule ? () => setShowResetConfirmDialog(true) : undefined}
        isSaving={isSaving}
        viewOnly={viewOnly}
        title="Test Cases Generation"
        backUrl={mode === 'view' ? `/editor?mode=view&tab=test_cases` : `/editor?tab=test_cases`}
      />
      {nodesError ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" color="error">
            Error loading test case builder
          </Typography>
          <Typography variant="body2">
            Failed to load node templates
          </Typography>
        </Box>
      ) : isLoadingNodes || !apiNodesInitialized ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 2 }}>
          <Typography>Loading...</Typography>
          <Typography variant="body2" color="text.secondary">
            {isLoadingNodes && 'Fetching available nodes from server'}
            {!isLoadingNodes && !apiNodesInitialized && 'Setting up canvas...'}
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
              hideCustomFunctions={false}
              hideStartEnd={true}
              allNodes={flowState.allNodes}
              edges={flowState.edges}
              selectedNodeId={flowState.selectedNode?.id || null}
              ruleId={ruleId}
            />
          )}
          <RuleBuilderCanvas
            onJsonGenerate={flowState.handleJsonGenerate}
            onCodeGenerate={flowState.handleCodeGenerate}
            onNodeSelect={handleNodeSelect}
            onNodeUpdateHandlerReady={handleNodeUpdateHandlerReady}
            nestedCanvasData={{}}
            viewOnly={viewOnly}
            onFlowStateUpdate={handleFlowStateUpdate}
            initialNodes={transformedFlowData?.nodes}
            initialEdges={transformedFlowData?.edges}
            onUpdateNodeInternalsReady={handleUpdateNodeInternalsReady}
            mode="test-case-generate"
          />
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
        title="Generated Test Code"
        content={flowState.codeOutput}
        emptyMessage="Click 'Generate Code' to see output"
        onDownload={() => flowState.handleDownload(flowState.generatedCode)}
        language="typescript"
        enableValidation={true}
        validationType="test"
      />

      <ValidationErrorModal
        open={showErrorModal}
        onClose={() => setShowErrorModal(false)}
      />

      <Dialog open={showSaveSuccessModal} onClose={() => setShowSaveSuccessModal(false)}>
        <DialogTitle>Test Cases Saved Successfully</DialogTitle>
        <DialogContent>
          <Typography>Your test case flow has been saved. What would you like to do next?</Typography>
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
                window.location.href = mode === 'view' ? `/editor?mode=view&tab=test_cases` : `/editor?tab=test_cases`;
              }, 0);
            }}
            variant="contained"
          >
            Proceed to Next Step
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={showResetConfirmDialog} 
        onClose={() => setShowResetConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'warning.main' }}>Reset Test Case Flow Confirmation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure? All changes will be lost and the test case flow will be reset to the default template.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowResetConfirmDialog(false)}
            variant="outlined"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleReset}
            variant="contained"
            color="warning"
            disabled={isSaving}
          >
            {isSaving ? 'Resetting...' : 'Yes, Reset'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const TestCaseGenerateWithValidation: React.FC<TestCaseGenerateProps> = (props) => {
  return (
    <ValidationProvider>
      <TestCaseGenerate {...props} />
    </ValidationProvider>
  );
};

export default TestCaseGenerateWithValidation;
