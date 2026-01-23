import React, { useCallback, useState, useMemo } from 'react';
import { Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { Node } from '@xyflow/react';
import {
  SidebarContainer,
  CloseButton,
  EmptyState,
} from './styles';
import { getNodeTemplate } from '../../../utils/Flow/nodeTemplateService';
import { usesDynamicParameters } from '../../../utils/Flow/functionParameterUtils';
import {
  NodeHeader,
  BasicPropertiesSection,
  IfConditionEditor,
  ParameterSection,
  FunctionCallSection,
  ParameterConfigSection,
} from './components';
import { useNodeValidation } from '../../../hooks/RuleBuilder/useNodeValidation';

interface RightSidebarProps {
  selectedNode: Node | null;
  onClose: () => void;
  onUpdateNode: (nodeId: string, updates: Record<string, unknown>, shouldForceSave?: boolean) => void;
  allNodes?: Node[];
  viewOnly?: boolean;
  ruleId?: string;
  edges?: import('@xyflow/react').Edge[];
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
}) => {
  const collapsed = !selectedNode;

  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editingParams, setEditingParams] = useState<Record<string, string> | null>(null);
  const inputRefs = React.useRef<Record<string, HTMLInputElement | HTMLTextAreaElement>>({});
  const updateTimeoutRef = React.useRef<number | null>(null);
  const validationTimeoutRef = React.useRef<number | null>(null);
  const currentParamsRef = React.useRef<Record<string, string>>({});

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
      
      const target = event.target as HTMLInputElement & { dataset?: { multiUpdate?: string } };
      let updatedParams: Record<string, string>;
      
      if (target.dataset?.multiUpdate) {
        try {
          const multiUpdate = JSON.parse(target.dataset.multiUpdate);
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
        // Strip all {{ }} wrapping to avoid double wrapping (global replace)
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
      }, 300);
      
      validationTimeoutRef.current = setTimeout(() => {
        validate(updatedParams);
      }, 500);
    }
  }, [conditions, selectedNode, onUpdateNode, validate]);

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
        }, 300);
        
        validationTimeoutRef.current = setTimeout(() => {
          validate(updatedParams);
        }, 500);
      }
    }
  }, [conditions, selectedNode, onUpdateNode, validate]);

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
          }, 300);
          
          validationTimeoutRef.current = setTimeout(() => {
            validate(updatedParams);
          }, 500);
        }
      }
    },
    [conditions, selectedNode, onUpdateNode, validate]
  );

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

  if (!selectedNode) {
    return (
      <SidebarContainer collapsed={false}>
        <CloseButton size="small" onClick={onClose} aria-label="Close properties panel">
          <CloseIcon fontSize="small" />
        </CloseButton>
        <EmptyState>
          <InfoOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary">No node selected</Typography>
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
    </SidebarContainer>
  );
};

export default RightSidebar;
