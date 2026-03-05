import React, { useCallback, useState, useMemo } from 'react';
import { Typography, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EditIcon from '@mui/icons-material/Edit';
import type { Node } from '@xyflow/react';
import toast from 'react-hot-toast';
import {
  SidebarContainer,
  CloseButton,
  EmptyState,
} from './styles';
import { getNodeTemplate } from '../../../utils/Flow/nodeTemplateService';
import { usesDynamicParameters } from '../../../utils/Flow/functionParameterUtils';
import { transformRuleRequestToCode } from '../../../utils/Flow/transformRuleRequest';
import { transformRuleResultToCode } from '../../../utils/Flow/transformRuleResult';
import {
  NodeHeader,
  BasicPropertiesSection,
  IfConditionEditor,
  TernaryConditionEditor,
  ParameterSection,
  FunctionCallSection,
  ParameterConfigSection,
  FetchDBSection,
} from './components';
import { CodeEditorDialog } from './components/CodeEditorDialog';
import { BeforeEachSection, BeforeAllSection } from './components/NodeSections';
import { useNodeValidation, useTernaryConditions } from '../../../hooks/RuleBuilder';

interface RightSidebarProps {
  selectedNode: Node | null;
  onClose: () => void;
  onUpdateNode: (nodeId: string, updates: Record<string, unknown>, shouldForceSave?: boolean) => void;
  allNodes?: Node[];
  viewOnly?: boolean;
  ruleId?: string;
  edges?: import('@xyflow/react').Edge[];
  updateNodeInternals?: (nodeId: string) => void;
}

interface NodeData {
  label?: string;
  nodeType?: string;
  params?: Record<string, string>;
  mode?: 'definition' | 'call';
  generation_type?: 'definition' | 'call';
  function_name?: string;
  [key: string]: unknown;
}

interface IfCondition {
  type: 'if' | 'elseif' | 'else';
  condition?: string;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedNode,
  onClose,
  onUpdateNode,
  allNodes,
  viewOnly = false,
  ruleId,
  edges = [],
  updateNodeInternals,
}) => {
  const collapsed = !selectedNode;

  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editingParams, setEditingParams] = useState<Record<string, string> | null>(null);
  const [mockRequestModalOpen, setMockRequestModalOpen] = useState<boolean>(false);
  const [mockRequestCode, setMockRequestCode] = useState<string>('');
  const [ruleResultModalOpen, setRuleResultModalOpen] = useState<boolean>(false);
  const [ruleResultCode, setRuleResultCode] = useState<string>('');
  const [beforeEachModalOpen, setBeforeEachModalOpen] = useState<boolean>(false);
  const [beforeEachCode, setBeforeEachCode] = useState<string>('');
  const [beforeAllModalOpen, setBeforeAllModalOpen] = useState<boolean>(false);
  const [beforeAllCode, setBeforeAllCode] = useState<string>('');
  const inputRefs = React.useRef<Record<string, HTMLInputElement | HTMLTextAreaElement>>({});
  const updateTimeoutRef = React.useRef<number | null>(null);
  const validationTimeoutRef = React.useRef<number | null>(null);
  const currentParamsRef = React.useRef<Record<string, string>>({});
  const selectionRef = React.useRef<{ key: string; start: number; end: number } | null>(null);

  const nodeData = selectedNode?.data as NodeData | undefined;
  
  const cleanNodeType = useMemo(() => {
    let nodeType = nodeData?.nodeType;
    if (nodeType && nodeType.includes('::')) {
      [nodeType] = nodeType.split('::');
    }
    return nodeType;
  }, [nodeData?.nodeType]);
  
  const mode = useMemo(
    () => nodeData?.mode || nodeData?.generation_type,
    [nodeData?.mode, nodeData?.generation_type]
  );
  
  const template = useMemo(
    () => cleanNodeType ? getNodeTemplate(cleanNodeType, mode as string | undefined) || null : null,
    [cleanNodeType, mode]
  );

  const { validate, getFieldError } = useNodeValidation(
    selectedNode?.id || '',
    nodeData?.nodeType || '',
    nodeData?.label || 'Unknown'
  );

  const currentLabel = useMemo(
    () => editingLabel !== null ? editingLabel : (nodeData?.label || ''),
    [editingLabel, nodeData?.label]
  );

  const currentParams = useMemo(
    () => editingParams !== null ? editingParams : (nodeData?.params || {}),
    [editingParams, nodeData?.params]
  );
  
  React.useEffect(() => {
    currentParamsRef.current = currentParams;
  }, [currentParams]);

  // Restore cursor position after re-render to maintain undo functionality
  React.useEffect(() => {
    if (selectionRef.current) {
      const { key, start, end } = selectionRef.current;
      const input = inputRefs.current[key];
      if (input && document.activeElement === input) {
        requestAnimationFrame(() => {
          try {
            input.setSelectionRange(start, end);
          } catch {
            // Ignore errors for inputs that don't support selection
          }
        });
      }
      selectionRef.current = null;
    }
  }, [currentParams]);

  React.useEffect(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
      validationTimeoutRef.current = null;
    }
    setEditingLabel(null);
    setEditingParams(null);
    
    if (selectedNode && nodeData?.nodeType && nodeData?.params) {
      validate(nodeData.params);
    }

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode?.id]);

  const conditions: IfCondition[] = useMemo(() => {
    if (nodeData?.nodeType !== 'If') return [];
    try {
      const conditionsStr = currentParams['conditions'];
      return conditionsStr ? JSON.parse(conditionsStr) : [{ type: 'if', condition: 'x > 5' }];
    } catch {
      return [{ type: 'if', condition: 'x > 5' }];
    }
  }, [currentParams, nodeData?.nodeType]);

  const handleLabelChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newLabel = event.target.value;
      setEditingLabel(newLabel);
      if (selectedNode) {
        onUpdateNode(selectedNode.id, { label: newLabel });
      }
    },
    [selectedNode, onUpdateNode]
  );

  const handleLabelBlur = useCallback(() => {
    setEditingLabel(null);
  }, []);
  
  const handleParamBlur = useCallback((shouldForceSave = false, overrideParams?: Record<string, string>) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
      validationTimeoutRef.current = null;
    }
    if (selectedNode) {
      const paramsToSave = overrideParams || editingParams;
      if (paramsToSave) {
        onUpdateNode(selectedNode.id, { params: paramsToSave }, shouldForceSave);
        validate(paramsToSave);
      }
    }
  }, [selectedNode, editingParams, onUpdateNode, validate]);

  const handleDirectUpdate = useCallback(
    (updatedParams: Record<string, string>) => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = null;
      }
 
      currentParamsRef.current = updatedParams;
      setEditingParams(updatedParams);

      if (selectedNode) {
        onUpdateNode(selectedNode.id, { params: updatedParams });
        validate(updatedParams);
      }
    },
    [selectedNode, onUpdateNode, validate]
  );

  const handleParamChange = useCallback(
    (paramKey: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      
      // Capture selection position to restore after re-render (enables undo/redo)
      if (target.selectionStart !== null && target.selectionEnd !== null) {
        selectionRef.current = {
          key: paramKey,
          start: target.selectionStart,
          end: target.selectionEnd,
        };
      }
      
      const targetWithDataset = target as HTMLInputElement & { dataset?: { multiUpdate?: string } };
      let updatedParams: Record<string, string>;
      
      if (targetWithDataset.dataset?.multiUpdate) {
        try {
          const multiUpdate = JSON.parse(targetWithDataset.dataset.multiUpdate);
          updatedParams = { ...currentParamsRef.current, ...multiUpdate };
        } catch {
          updatedParams = { ...currentParamsRef.current, [paramKey]: newValue };
        }
      } else {
        updatedParams = { ...currentParamsRef.current, [paramKey]: newValue };
      }
      
      setEditingParams(updatedParams);
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      
      if (selectedNode) {
        updateTimeoutRef.current = setTimeout(() => {
          onUpdateNode(selectedNode.id, { params: updatedParams });
        }, 300);
        
        validationTimeoutRef.current = setTimeout(() => {
          validate(updatedParams);
        }, 500);
      }
    },
    [selectedNode, onUpdateNode, validate]
  );

  const handleDrop = useCallback(
    (paramKey: string) => (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      let variablePath = event.dataTransfer.getData('variablePath');
      if (variablePath && selectedNode) {
        variablePath = variablePath.replace(/\{\{\s*/g, '').replace(/\s*\}\}/g, '').trim();
        
        const inputElement = inputRefs.current[paramKey];
        const currentValue = currentParamsRef.current[paramKey] ?? '';
        let newValue: string;

        if (inputElement) {
          const start = inputElement.selectionStart || 0;
          const end = inputElement.selectionEnd || 0;
          const textBefore = currentValue.substring(0, start);
          const textAfter = currentValue.substring(end);
          newValue = textBefore + `{{ ${variablePath} }}` + textAfter;
          setTimeout(() => {
            const newCursorPos = start + `{{ ${variablePath} }}`.length;
            inputElement.setSelectionRange(newCursorPos, newCursorPos);
            inputElement.focus();
          }, 0);
        } else {
  
          const wrappedVariable = `{{ ${variablePath} }}`;
          newValue = currentValue ? `${currentValue} ${wrappedVariable}` : wrappedVariable;
        }

        const updatedParams = { ...currentParamsRef.current, [paramKey]: newValue };
        setEditingParams(updatedParams);
        onUpdateNode(selectedNode.id, { params: updatedParams });
      }
    },
    [selectedNode, onUpdateNode]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleConditionChange = useCallback(
    (index: number, newCondition: string) => {
      const newConditions = [...conditions];
      newConditions[index].condition = newCondition;
      const updatedParams = { ...currentParamsRef.current, conditions: JSON.stringify(newConditions) };
      setEditingParams(updatedParams);
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      
      if (selectedNode) {
        updateTimeoutRef.current = setTimeout(() => {
          onUpdateNode(selectedNode.id, { params: updatedParams });
        }, 300);
        
        validationTimeoutRef.current = setTimeout(() => {
          validate(updatedParams);
        }, 500);
      }
    },
    [conditions, selectedNode, onUpdateNode, validate]
  );

  const handleAddElseIf = useCallback(() => {
    const newConditions = [...conditions];
    const hasElse = newConditions.some((c) => c.type === 'else');
    if (hasElse) {
      const elseIndex = newConditions.findIndex((c) => c.type === 'else');
      newConditions.splice(elseIndex, 0, { type: 'elseif', condition: 'y > 10' });
    } else {
      newConditions.push({ type: 'elseif', condition: 'y > 10' });
    }
    const updatedParams = { ...currentParamsRef.current, conditions: JSON.stringify(newConditions) };
    setEditingParams(updatedParams);
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    if (selectedNode) {
      updateTimeoutRef.current = setTimeout(() => {
        onUpdateNode(selectedNode.id, { params: updatedParams });
        if (updateNodeInternals) {
          updateNodeInternals(selectedNode.id);
        }
      }, 300);
      
      validationTimeoutRef.current = setTimeout(() => {
        validate(updatedParams);
      }, 500);
    }
  }, [conditions, selectedNode, onUpdateNode, validate, updateNodeInternals]);

  const handleAddElse = useCallback(() => {
    const newConditions = [...conditions];
    const hasElse = newConditions.some((c) => c.type === 'else');
    if (!hasElse) {
      newConditions.push({ type: 'else' });
      const updatedParams = { ...currentParamsRef.current, conditions: JSON.stringify(newConditions) };
      setEditingParams(updatedParams);
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      
      if (selectedNode) {
        updateTimeoutRef.current = setTimeout(() => {
          onUpdateNode(selectedNode.id, { params: updatedParams });
          if (updateNodeInternals) {
            updateNodeInternals(selectedNode.id);
          }
        }, 300);
        
        validationTimeoutRef.current = setTimeout(() => {
          validate(updatedParams);
        }, 500);
      }
    }
  }, [conditions, selectedNode, onUpdateNode, validate, updateNodeInternals]);

  const handleRemoveCondition = useCallback(
    (index: number) => {
      const newConditions = [...conditions];
      if (newConditions.length > 1) {
        newConditions.splice(index, 1);
        const updatedParams = { ...currentParamsRef.current, conditions: JSON.stringify(newConditions) };
        setEditingParams(updatedParams);

        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }

        if (validationTimeoutRef.current) {
          clearTimeout(validationTimeoutRef.current);
        }
        
        if (selectedNode) {
          updateTimeoutRef.current = setTimeout(() => {
            onUpdateNode(selectedNode.id, { params: updatedParams });
            if (updateNodeInternals) {
              updateNodeInternals(selectedNode.id);
            }
          }, 300);
          
          validationTimeoutRef.current = setTimeout(() => {
            validate(updatedParams);
          }, 500);
        }
      }
    },
    [conditions, selectedNode, onUpdateNode, validate, updateNodeInternals]
  );

  const handleTernaryParamChange = useCallback((key: string, value: string) => {
    const updatedParams = { ...currentParamsRef.current, [key]: value };
    setEditingParams(updatedParams);
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    if (selectedNode) {
      updateTimeoutRef.current = setTimeout(() => {
        onUpdateNode(selectedNode.id, { params: updatedParams });
      }, 300);
      
      validationTimeoutRef.current = setTimeout(() => {
        validate(updatedParams);
      }, 500);
    }
  }, [selectedNode, onUpdateNode, validate]);

  const {
    ternaryTree,
    handleTreeChange: handleTernaryTreeChange,
    handleStoreResultChange: handleTernaryStoreResultChange,
    handleResultVarChange: handleTernaryResultVarChange,
  } = useTernaryConditions({ currentParams, onParamChange: handleTernaryParamChange });

  const handleEditMockRequest = useCallback(() => {
    if (!window.globalVariablesData) {
      toast.error('No global variables data available. Please load the test case first.');
      return;
    }
    
    const globalVars = window.globalVariablesData as { RuleRequest?: unknown };
    const transformedCode = transformRuleRequestToCode(globalVars.RuleRequest);
    setMockRequestCode(transformedCode);
    setMockRequestModalOpen(true);
  }, []);

  const handleSaveMockRequest = useCallback(() => {
    if (selectedNode) {
      const updatedParams = { ...currentParamsRef.current, ruleRequestData: mockRequestCode };
      setEditingParams(updatedParams);
      onUpdateNode(selectedNode.id, { params: updatedParams });
      setMockRequestModalOpen(false);
    }
  }, [selectedNode, mockRequestCode, onUpdateNode]);

  const handleCloseMockRequestModal = useCallback(() => {
    setMockRequestModalOpen(false);
  }, []);

  const handleEditRuleResult = useCallback(() => {
    const existingData = currentParamsRef.current.ruleResultData;
    let codeToEdit = '';
    
    if (existingData) {
      try {
        if (existingData.includes('const ruleResult')) {
          codeToEdit = existingData;
        } else {
          const parsed = JSON.parse(existingData);
          codeToEdit = transformRuleResultToCode(parsed);
        }
      } catch {
        codeToEdit = existingData;
      }
    } else {
      const defaultRuleResult = {
        id: '021@1.0.0',
        tenantId: 'DEFAULT',
        cfg: '1.0.0',
        subRuleRef: '.err',
        reason: 'Unhandled rule result outcome',
      };
      codeToEdit = transformRuleResultToCode(defaultRuleResult);
    }
    
    setRuleResultCode(codeToEdit);
    setRuleResultModalOpen(true);
  }, []);

  const handleSaveRuleResult = useCallback(() => {
    if (selectedNode) {
      const updatedParams = { ...currentParamsRef.current, ruleResultData: ruleResultCode };
      setEditingParams(updatedParams);
      onUpdateNode(selectedNode.id, { params: updatedParams });
      setRuleResultModalOpen(false);
    }
  }, [selectedNode, ruleResultCode, onUpdateNode]);

  const handleCloseRuleResultModal = useCallback(() => {
    setRuleResultModalOpen(false);
  }, []);

  const handleEditBeforeEach = useCallback(() => {
    const existingCode = currentParamsRef.current.beforeEachCode || '// Add setup code here\ndatabaseManager = MockDatabaseManagerFactory();\nloggerService = MockLoggerServiceFactory();';
    setBeforeEachCode(existingCode);
    setBeforeEachModalOpen(true);
  }, []);

  const handleSaveBeforeEach = useCallback(() => {
    if (selectedNode) {
      const updatedParams = { ...currentParamsRef.current, beforeEachCode };
      setEditingParams(updatedParams);
      onUpdateNode(selectedNode.id, { params: updatedParams });
      setBeforeEachModalOpen(false);
    }
  }, [selectedNode, beforeEachCode, onUpdateNode]);

  const handleCloseBeforeEachModal = useCallback(() => {
    setBeforeEachModalOpen(false);
  }, []);

  const handleEditBeforeAll = useCallback(() => {
    const existingCode = currentParamsRef.current.beforeAllCode || '// Add global setup code here';
    setBeforeAllCode(existingCode);
    setBeforeAllModalOpen(true);
  }, []);

  const handleSaveBeforeAll = useCallback(() => {
    if (selectedNode) {
      const updatedParams = { ...currentParamsRef.current, beforeAllCode };
      setEditingParams(updatedParams);
      onUpdateNode(selectedNode.id, { params: updatedParams });
      setBeforeAllModalOpen(false);
    }
  }, [selectedNode, beforeAllCode, onUpdateNode]);

  const handleCloseBeforeAllModal = useCallback(() => {
    setBeforeAllModalOpen(false);
  }, []);

  if (collapsed) {
    return (
      <SidebarContainer collapsed={true}>
        <EmptyState>
          <InfoOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary">Select a node to view properties</Typography>
        </EmptyState>
      </SidebarContainer>
    );
  }
  
  if (!template) {
    let displayNodeType = nodeData?.nodeType || 'Unknown';
    if (displayNodeType.includes('::')) {
      [displayNodeType] = displayNodeType.split('::');
    }
    
    return (
      <SidebarContainer collapsed={false}>
        <CloseButton size="small" onClick={onClose} aria-label="Close properties panel">
          <CloseIcon fontSize="small" />
        </CloseButton>
        <EmptyState>
          <InfoOutlinedIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
          <Typography color="text.primary" fontWeight={600} mb={1}>Template Not Found</Typography>
          <Typography color="text.secondary" variant="body2" mb={1}>
            Node Type: {displayNodeType}
          </Typography>
          {mode && (
            <Typography color="text.secondary" variant="body2" mb={1}>
              Mode: {mode}
            </Typography>
          )}
          <Typography color="text.secondary" variant="caption">
            This node may not be properly configured. Check the API response.
          </Typography>
        </EmptyState>
      </SidebarContainer>
    );
  }

  const isFunctionNode = template && 'description' in template;
  const isFunctionCallNode = mode === 'call' && (nodeData?.function_name || template?.function_name || usesDynamicParameters(template));
  const isReadOnly = nodeData?.nodeType === 'Start' || nodeData?.nodeType === 'End';

  return (
    <SidebarContainer collapsed={false}>
      <CloseButton size="small" onClick={onClose} aria-label="Close properties panel">
        <CloseIcon fontSize="small" />
      </CloseButton>

      <NodeHeader
        templateDisplayName={template.displayName || template.label || 'Node'}
        isFunctionNode={isFunctionNode}
        description={isFunctionNode ? template.description : undefined}
      />

      <BasicPropertiesSection
        selectedNode={selectedNode}
        currentLabel={currentLabel}
        onLabelChange={handleLabelChange}
        onLabelBlur={handleLabelBlur}
        templateDisplayName={template.displayName || template.label || 'Node'}
        isReadOnly={isReadOnly}
        viewOnly={viewOnly}
      />

      {nodeData?.nodeType === 'CustomFunction' && mode === 'definition' ? (
        <ParameterConfigSection
          currentParams={currentParams}
          onParamChange={handleParamChange}
          onParamBlur={handleParamBlur}
          onDirectUpdate={handleDirectUpdate}
          isReadOnly={isReadOnly}
          viewOnly={viewOnly}
          getFieldError={getFieldError}
        />
      ) : nodeData?.nodeType === 'If' ? (
        <IfConditionEditor
          conditions={conditions}
          onConditionChange={handleConditionChange}
          onAddElseIf={handleAddElseIf}
          onAddElse={handleAddElse}
          onRemoveCondition={handleRemoveCondition}
          inputRefs={inputRefs}
          onDragOver={handleDragOver}
          viewOnly={viewOnly}
          allNodes={allNodes}
          getFieldError={getFieldError}
        />
      ) : nodeData?.nodeType === 'Ternary' ? (
        <TernaryConditionEditor
          ternaryTree={ternaryTree}
          storeResult={currentParams['storeResult'] !== 'false'}
          resultVar={currentParams['resultVar'] || 'ternaryResult'}
          onTreeChange={handleTernaryTreeChange}
          onStoreResultChange={handleTernaryStoreResultChange}
          onResultVarChange={handleTernaryResultVarChange}
          inputRefs={inputRefs}
          onDragOver={handleDragOver}
          viewOnly={viewOnly}
          allNodes={allNodes}
          getFieldError={getFieldError}
        />
      ) : nodeData?.nodeType === 'FetchDB' ? (
        <FetchDBSection
          currentParams={currentParams}
          onParamChange={handleParamChange}
          onParamBlur={handleParamBlur}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          inputRefs={inputRefs}
          isReadOnly={isReadOnly}
          viewOnly={viewOnly}
          allNodes={allNodes}
          edges={edges}
          selectedNodeId={selectedNode?.id}
          getFieldError={getFieldError}
        />
      ) : nodeData?.nodeType === 'RuleConfigFactory' ? (
        <ParameterSection
          inputs={[
            {
              key: 'factoryName',
              label: 'Factory Name',
              type: 'text',
              required: true,
              defaultValue: 'getRuleConfig',
            }
          ]}
          currentParams={currentParams}
          onParamChange={handleParamChange}
          onParamBlur={handleParamBlur}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          inputRefs={inputRefs}
          variableError={null}
          isReadOnly={isReadOnly}
          viewOnly={viewOnly}
          nodeType={nodeData?.nodeType}
          allNodes={allNodes}
          getFieldError={getFieldError}
          ruleId={ruleId}
          edges={edges}
          selectedNodeId={selectedNode?.id}
        />
      ) : nodeData?.nodeType === 'RuleRequestFactory' ? (
        <>
          <ParameterSection
            inputs={[
              {
                key: 'factoryName',
                label: 'Factory Name',
                type: 'text',
                required: true,
                defaultValue: 'getMockRequest',
              }
            ]}
            currentParams={currentParams}
            onParamChange={handleParamChange}
            onParamBlur={handleParamBlur}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            inputRefs={inputRefs}
            variableError={null}
            isReadOnly={isReadOnly}
            viewOnly={viewOnly}
            nodeType={nodeData?.nodeType}
            allNodes={allNodes}
            getFieldError={getFieldError}
            ruleId={ruleId}
            edges={edges}
            selectedNodeId={selectedNode?.id}
          />
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEditMockRequest}
            fullWidth
            sx={{ mt: 2 }}
            disabled={viewOnly}
          >
            Edit Mock Rule Request
          </Button>
        </>
      ) : nodeData?.nodeType === 'BeforeEach' ? (
        <BeforeEachSection onEdit={handleEditBeforeEach} viewOnly={viewOnly} />
      ) : nodeData?.nodeType === 'BeforeAll' ? (
        <BeforeAllSection onEdit={handleEditBeforeAll} viewOnly={viewOnly} />
      ) : nodeData?.nodeType === 'RuleRequestScenario' ? (
        <ParameterSection
          inputs={[
            {
              key: 'factoryName',
              label: 'Factory Name',
              type: 'text',
              required: true,
              defaultValue: 'getMockRequestUnsuccessful',
            },
            {
              key: 'modifications',
              label: 'Modification Statement',
              type: 'textarea',
              required: false,
              defaultValue: "quote.transaction.FIToFIPmtSts.TxInfAndSts.TxSts = 'RJCT';",
              placeholder: "Enter modification code (e.g., quote.transaction.status = 'REJECTED';)"
            }
          ]}
          currentParams={currentParams}
          onParamChange={handleParamChange}
          onParamBlur={handleParamBlur}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          inputRefs={inputRefs}
          variableError={null}
          isReadOnly={isReadOnly}
          viewOnly={viewOnly}
          nodeType={nodeData?.nodeType}
          allNodes={allNodes}
          getFieldError={getFieldError}
          ruleId={ruleId}
          edges={edges}
          selectedNodeId={selectedNode?.id}
        />
      ) : nodeData?.nodeType === 'RuleResultFactory' ? (
        <>
          <ParameterSection
            inputs={[
              {
                key: 'factoryName',
                label: 'Factory Name',
                type: 'text',
                required: true,
                defaultValue: 'ruleResult',
              }
            ]}
            currentParams={currentParams}
            onParamChange={handleParamChange}
            onParamBlur={handleParamBlur}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            inputRefs={inputRefs}
            variableError={null}
            isReadOnly={isReadOnly}
            viewOnly={viewOnly}
            nodeType={nodeData?.nodeType}
            allNodes={allNodes}
            getFieldError={getFieldError}
            ruleId={ruleId}
            edges={edges}
            selectedNodeId={selectedNode?.id}
          />
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEditRuleResult}
            fullWidth
            sx={{ mt: 2 }}
            disabled={viewOnly}
          >
            Edit Rule Result
          </Button>
        </>
      ) : nodeData?.nodeType === 'DataCacheFactory' ? (
        <ParameterSection
          inputs={[
            {
              key: 'variableName',
              label: 'Variable Name',
              type: 'text',
              required: true,
              defaultValue: 'dataCache',
            }
          ]}
          currentParams={currentParams}
          onParamChange={handleParamChange}
          onParamBlur={handleParamBlur}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          inputRefs={inputRefs}
          variableError={null}
          isReadOnly={isReadOnly}
          viewOnly={viewOnly}
          nodeType={nodeData?.nodeType}
          allNodes={allNodes}
          getFieldError={getFieldError}
          ruleId={ruleId}
          edges={edges}
          selectedNodeId={selectedNode?.id}
        />
      ) : nodeData?.nodeType === 'DatabaseManager' ? (
        <ParameterSection
          inputs={[
            {
              key: 'variableName',
              label: 'Variable Name',
              type: 'text',
              required: true,
              defaultValue: 'databaseManager',
            }
          ]}
          currentParams={currentParams}
          onParamChange={handleParamChange}
          onParamBlur={handleParamBlur}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          inputRefs={inputRefs}
          variableError={null}
          isReadOnly={isReadOnly}
          viewOnly={viewOnly}
          nodeType={nodeData?.nodeType}
          allNodes={allNodes}
          getFieldError={getFieldError}
          ruleId={ruleId}
          edges={edges}
          selectedNodeId={selectedNode?.id}
        />
      ) : nodeData?.nodeType === 'LoggerService' ? (
        <ParameterSection
          inputs={[
            {
              key: 'variableName',
              label: 'Variable Name',
              type: 'text',
              required: true,
              defaultValue: 'loggerService',
            }
          ]}
          currentParams={currentParams}
          onParamChange={handleParamChange}
          onParamBlur={handleParamBlur}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          inputRefs={inputRefs}
          variableError={null}
          isReadOnly={isReadOnly}
          viewOnly={viewOnly}
          nodeType={nodeData?.nodeType}
          allNodes={allNodes}
          getFieldError={getFieldError}
          ruleId={ruleId}
          edges={edges}
          selectedNodeId={selectedNode?.id}
        />
      ) : isFunctionCallNode && (nodeData?.function_name || template?.function_name) ? (
        <FunctionCallSection
          functionName={nodeData?.function_name || template.function_name || ''}
          currentParams={currentParams}
          onParamChange={handleParamChange}
          onParamBlur={handleParamBlur}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          inputRefs={inputRefs}
          isReadOnly={isReadOnly}
          viewOnly={viewOnly}
          allNodes={allNodes}
          nodeType={nodeData?.nodeType}
          getFieldError={getFieldError}
        />
      ) : (
        template.inputs &&
        template.inputs.length > 0 && (
          <ParameterSection
            inputs={template.inputs.map(input => ({
              ...input,
              defaultValue: input.defaultValue || ''
            }))}
            currentParams={currentParams}
            onParamChange={handleParamChange}
            onParamBlur={handleParamBlur}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            inputRefs={inputRefs}
            variableError={null}
            isReadOnly={isReadOnly}
            viewOnly={viewOnly}
            nodeType={nodeData?.nodeType}
            allNodes={allNodes}
            getFieldError={getFieldError}
            ruleId={ruleId}
            edges={edges}
            selectedNodeId={selectedNode?.id}
          />
        )
      )}

      <CodeEditorDialog
        open={mockRequestModalOpen}
        title="Edit Mock Rule Request"
        value={mockRequestCode}
        onChange={setMockRequestCode}
        onSave={handleSaveMockRequest}
        onClose={handleCloseMockRequestModal}
      />

      <CodeEditorDialog
        open={ruleResultModalOpen}
        title="Edit Rule Result"
        value={ruleResultCode}
        onChange={setRuleResultCode}
        onSave={handleSaveRuleResult}
        onClose={handleCloseRuleResultModal}
      />

      <CodeEditorDialog
        open={beforeEachModalOpen}
        title="Edit beforeEach Code"
        value={beforeEachCode}
        onChange={setBeforeEachCode}
        onSave={handleSaveBeforeEach}
        onClose={handleCloseBeforeEachModal}
      />

      <CodeEditorDialog
        open={beforeAllModalOpen}
        title="Edit beforeAll Code"
        value={beforeAllCode}
        onChange={setBeforeAllCode}
        onSave={handleSaveBeforeAll}
        onClose={handleCloseBeforeAllModal}
      />
    </SidebarContainer>
  );
};

export default RightSidebar;
