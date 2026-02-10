import React, { useState, useCallback } from 'react';
import { Divider } from '@mui/material';
import type { Node } from '@xyflow/react';
import type { NodeInput } from '../../../../types/nodeInput';
import { SectionContainer, SectionTitle } from '../styles';
import CodeEditorModal from './CodeEditorModal';
import QueryEditorModal from './QueryEditorModal/QueryEditorModal';
import QueryExecutionResultModal from './QueryExecutionResultModal';
import { useVariableData, useQueryExecution } from '../../../../hooks/RuleBuilder';
import { 
  DropdownField, 
  CodeTemplateButton, 
  FetchDBQueryField, 
  CodeEditorField, 
  TextInputField 
} from './ParameterFields';
import { useInputVisibility } from './ParameterFields/hooks/useInputVisibility';
import { useInputHelpers } from './ParameterFields/hooks/useInputHelpers';

interface ParameterSectionProps {
  inputs: NodeInput[];
  currentParams: Record<string, string>;
  onParamChange: (paramKey: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onParamBlur?: (shouldForceSave?: boolean, overrideParams?: Record<string, string>) => void;
  onDrop: (paramKey: string) => (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | HTMLTextAreaElement>>;
  variableError: string | null;
  isReadOnly: boolean;
  viewOnly: boolean;
  nodeType?: string;
  allNodes?: Node[];
  getFieldError?: (fieldName: string) => string | undefined;
  ruleId?: string;
  edges?: import('@xyflow/react').Edge[];
  selectedNodeId?: string | null;
}

const ParameterSection: React.FC<ParameterSectionProps> = ({
  inputs,
  currentParams,
  onParamChange,
  onParamBlur,
  onDrop,
  onDragOver,
  inputRefs: inputRefsRef,
  variableError,
  isReadOnly,
  viewOnly,
  nodeType,
  getFieldError,
  allNodes = [],
  ruleId,
  edges = [],
  selectedNodeId = null,
}) => {

  const [codeModalOpen, setCodeModalOpen] = useState<boolean>(false);
  const [editingCodeField, setEditingCodeField] = useState<{ key: string; label: string; value: string } | null>(null);
  
  const [queryEditorOpen, setQueryEditorOpen] = useState<boolean>(false);

  const variableData = useVariableData({ 
    ruleId, 
    allNodes, 
    edges, 
    selectedNodeId 
  });

  const {
    executeQuery,
    closeResults,
    clearError,
    isExecuting,
    queryResults,
    totalCount,
    displayCount,
    executionError,
    resultsModalOpen,
  } = useQueryExecution({ variableData });

  const isFetchDBNode = nodeType === 'FetchDB';
  const isDisabled = isReadOnly || viewOnly;

  const { shouldRenderInput } = useInputVisibility({ currentParams, nodeType });
  const { getCurrentValue, getHelperText, getMinRows } = useInputHelpers({
    currentParams,
    isFetchDBNode,
    isReadOnly,
    viewOnly,
    variableError,
  });

  const handleOpenCodeModal = useCallback((key: string, label: string, value: string) => {
    setEditingCodeField({ key, label, value });
    setCodeModalOpen(true);
  }, []);

  const handleCloseCodeModal = useCallback(() => {
    setCodeModalOpen(false);
    setEditingCodeField(null);
  }, []);

  const handleSaveCode = useCallback((code: string) => {
    if (editingCodeField) {
      const updatedParams = { ...currentParams, [editingCodeField.key]: code };
      
      onParamBlur?.(true, updatedParams);
    }
    handleCloseCodeModal();
  }, [editingCodeField, currentParams, onParamBlur, handleCloseCodeModal]);
  
  const handleOpenQueryEditor = useCallback(() => {
    setQueryEditorOpen(true);
  }, []);

  const handleCloseQueryEditor = useCallback(() => {
    setQueryEditorOpen(false);
    clearError();
  }, [clearError]);

  const handleSaveQuery = useCallback((query: string) => {
    const syntheticEvent = {
      target: { value: query }
    } as React.ChangeEvent<HTMLInputElement>;
    onParamChange('query')(syntheticEvent);
    const updatedParams = { ...currentParams, query };
    
    onParamBlur?.(true, updatedParams);
    handleCloseQueryEditor();
  }, [onParamChange, onParamBlur, currentParams, handleCloseQueryEditor]);

  const handleInputRef = useCallback((key: string, el: HTMLInputElement | HTMLTextAreaElement | null) => {
    if (el) {
      inputRefsRef.current[key] = el;
    }
  }, [inputRefsRef]);

  if (!inputs || inputs.length === 0) return null;


  const renderInputField = (input: NodeInput) => {
    if (!shouldRenderInput(input)) {
      return null;
    }

    const currentValue = getCurrentValue(input);
    const hasGlobalVariable = Boolean(currentValue && typeof currentValue === 'string' && /\{\{\s*.+?\s*\}\}/.test(currentValue));
    const isMultiline = input.type === 'textarea' || ['code', 'query', 'importStatement', 'loopBody'].includes(input.key) || (typeof currentValue === 'string' && currentValue.length > 50);
    const minRows = getMinRows(input, isMultiline);
    const fieldError = getFieldError?.(input.key);
    const isVariableNameField = nodeType === 'SetVariable' && ['name', 'variableName'].includes(input.key);
    const hasError = !!fieldError || (isVariableNameField && !!variableError);
    const isCodeField = ['code', 'loopBody', 'query', 'code_template', 'function_code'].includes(input.key);
    const helperText = getHelperText(input, fieldError, isVariableNameField, isCodeField || input.type === 'code');


    if (input.options && input.options.length > 0) {
      const options = input.options.map(opt => ({ value: opt, label: opt }));
      return (
        <DropdownField
          key={input.key}
          input={input}
          currentValue={currentValue}
          hasError={hasError}
          helperText={helperText}
          options={options}
          isDisabled={isDisabled}
          onParamChange={onParamChange}
        />
      );
    }

    if (input.key === 'declarationType') {
      const options = [
        { value: 'var', label: 'var' },
        { value: 'let', label: 'let' },
        { value: 'const', label: 'const' }
      ];
      return (
        <DropdownField
          key={input.key}
          input={input}
          currentValue={currentValue}
          hasError={hasError}
          helperText={helperText}
          options={options}
          isDisabled={isDisabled}
          onParamChange={onParamChange}
        />
      );
    }

    if (input.key === 'dataType') {
      const options = [
        { value: 'string', label: 'string' },
        { value: 'number', label: 'number' },
        { value: 'boolean', label: 'boolean' },
        { value: 'array', label: 'array' },
        { value: 'object', label: 'object' },
        { value: 'any', label: 'any' },
        { value: 'undefined', label: 'undefined' }
      ];
      return (
        <DropdownField
          key={input.key}
          input={input}
          currentValue={currentValue}
          hasError={hasError}
          helperText={helperText}
          options={options}
          isDisabled={isDisabled}
          onParamChange={onParamChange}
        />
      );
    }

    if (input.key === 'code_template' || input.type === 'code') {
      return (
        <CodeTemplateButton
          key={input.key}
          input={input}
          currentValue={currentValue}
          hasError={hasError}
          fieldError={fieldError}
          isDisabled={isDisabled}
          onOpenCodeModal={handleOpenCodeModal}
        />
      );
    }

    if (isFetchDBNode && input.key === 'query') {
      return (
        <FetchDBQueryField
          key={input.key}
          currentValue={currentValue}
          isDisabled={isDisabled}
          isExecuting={isExecuting}
          fieldError={fieldError}
          onOpenQueryEditor={handleOpenQueryEditor}
          onExecuteQuery={executeQuery}
        />
      );
    }


    if (isCodeField) {
      return (
        <CodeEditorField
          key={input.key}
          input={input}
          currentValue={currentValue}
          hasError={hasError}
          fieldError={fieldError}
          isReadOnly={isReadOnly}
          viewOnly={viewOnly}
          onParamChange={onParamChange}
          onParamBlur={onParamBlur}
          onDrop={onDrop}
          onDragOver={onDragOver}
        />
      );
    }

    return (
      <TextInputField
        key={input.key}
        input={input}
        currentValue={currentValue}
        hasError={hasError}
        helperText={helperText}
        isDisabled={isDisabled}
        hasGlobalVariable={hasGlobalVariable}
        isMultiline={isMultiline}
        minRows={minRows}
        onParamChange={onParamChange}
        onParamBlur={onParamBlur}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInputRef={handleInputRef}
      />
    );
  };

  return (
    <>
      <Divider />
      <SectionContainer>
        <SectionTitle>Parameters</SectionTitle> 

        {inputs.map(renderInputField)}

        {editingCodeField && (
          <CodeEditorModal
            open={codeModalOpen}
            onClose={handleCloseCodeModal}
            onSave={handleSaveCode}
            initialValue={editingCodeField.value}
            title={`Edit ${editingCodeField.label}`}
            language="typescript"
          />
        )}

        {isFetchDBNode && (
          <>
            <QueryEditorModal
              open={queryEditorOpen}
              onClose={handleCloseQueryEditor}
              onSave={handleSaveQuery}
              onExecute={executeQuery}
              initialValue={currentParams.query ?? ''}
              isExecuting={isExecuting}
              executionError={executionError}
              ruleId={ruleId}
              allNodes={allNodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
            />
            <QueryExecutionResultModal
              open={resultsModalOpen}
              onClose={closeResults}
              results={queryResults}
              totalCount={totalCount}
              displayCount={displayCount}
              error={executionError}
            />
          </>
        )}
      </SectionContainer>
    </>
  );
};

export default ParameterSection;
