import React, { useState, useCallback, useMemo } from 'react';
import type { Node } from '@xyflow/react';
import { extractVariablesFromNodes, validateVariableName } from '../../utils/Flow/VariableManager';

interface NodeData {
  label?: string;
  nodeType?: string;
  params?: Record<string, string>;
  [key: string]: unknown;
}

interface UseNodeFormProps {
  selectedNode: Node | null;
  allNodes: Node[];
  onUpdateNode: (nodeId: string, updates: Record<string, unknown>) => void;
}

export const useNodeForm = ({
  selectedNode,
  allNodes,
  onUpdateNode,
}: UseNodeFormProps) => {
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editingParams, setEditingParams] = useState<Record<string, string> | null>(null);
  const [variableError, setVariableError] = useState<string | null>(null);

  const nodeData = selectedNode?.data as NodeData | undefined;

  const prevNodeIdRef = React.useRef<string | undefined>(selectedNode?.id);
  if (prevNodeIdRef.current !== selectedNode?.id) {
    prevNodeIdRef.current = selectedNode?.id;
    if (editingLabel !== null) setEditingLabel(null);
    if (editingParams !== null) setEditingParams(null);
    if (variableError !== null) setVariableError(null);
  }

  const currentLabel = useMemo(
    () => editingLabel !== null ? editingLabel : (nodeData?.label || ''),
    [editingLabel, nodeData?.label]
  );

  const currentParams = useMemo(
    () => editingParams !== null ? editingParams : (nodeData?.params || {}),
    [editingParams, nodeData?.params]
  );

  const computedVariableError = useMemo(() => {
    if (nodeData?.nodeType === 'SetVariable' && selectedNode) {
      const varName = currentParams.name || currentParams.variableName;

      if (varName && varName.trim()) {
        const existingVars = extractVariablesFromNodes(allNodes);
        const validation = validateVariableName(varName, selectedNode.id, existingVars);
        return validation.isValid ? null : validation.error || null;
      }
    }
    return null;
  }, [nodeData?.nodeType, selectedNode, currentParams.name, currentParams.variableName, allNodes]);

  const displayError = variableError !== null ? variableError : computedVariableError;

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

  const handleParamChange = useCallback(
    (paramKey: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      const updatedParams = { ...currentParams, [paramKey]: newValue };

      if (nodeData?.nodeType === 'SetVariable' && (paramKey === 'name' || paramKey === 'variableName')) {
        const existingVars = extractVariablesFromNodes(allNodes);
        const validation = validateVariableName(newValue, selectedNode?.id || '', existingVars);

        if (!validation.isValid) {
          setVariableError(validation.error || null);
        } else {
          setVariableError(null);
        }
      } else {
        setVariableError(null);
      }

      setEditingParams(updatedParams);

      if (selectedNode) {
        onUpdateNode(selectedNode.id, { params: updatedParams });
      }
    },
    [currentParams, nodeData?.nodeType, selectedNode, allNodes, onUpdateNode]
  );

  const inputRefs = React.useRef<Record<string, HTMLInputElement | HTMLTextAreaElement>>({});

  const handleDrop = useCallback(
    (paramKey: string) => (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const variablePath = event.dataTransfer.getData('variablePath');

      if (variablePath && selectedNode) {
        const inputElement = inputRefs.current[paramKey];
        const currentValue = currentParams[paramKey] ?? '';

        let newValue: string;

        if (inputElement) {
          const start = inputElement.selectionStart || 0;
          const end = inputElement.selectionEnd || 0;
          const textBefore = currentValue.substring(0, start);
          const textAfter = currentValue.substring(end);
          newValue = textBefore + variablePath + textAfter;
          
          setTimeout(() => {
            const newCursorPos = start + variablePath.length;
            inputElement.setSelectionRange(newCursorPos, newCursorPos);
            inputElement.focus();
          }, 0);
        } else {
          newValue = currentValue ? `${currentValue} ${variablePath}` : variablePath;
        }

        const updatedParams = {
          ...currentParams,
          [paramKey]: newValue,
        };
        setEditingParams(updatedParams);
        onUpdateNode(selectedNode.id, { params: updatedParams });
      }
    },
    [currentParams, selectedNode, onUpdateNode]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  return {
    currentLabel,
    currentParams,
    variableError: displayError,
    inputRefs,
    handleLabelChange,
    handleLabelBlur,
    handleParamChange,
    handleDrop,
    handleDragOver,
  };
};
