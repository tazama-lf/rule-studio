import React, { useState, useCallback } from 'react';
import { Divider } from '@mui/material';
import type { Node } from '@xyflow/react';
import type { NodeInput } from '../../../../types/nodeInput';
import { SectionContainer, SectionTitle } from '../styles';
import CodeEditorModal from './CodeEditorModal';
import QueryEditorModal from './QueryEditorModal/QueryEditorModal';
import QueryExecutionResultModal from './QueryExecutionResultModal';
import { useExecuteQueryMutation, useGetGlobalVariablesQuery } from '../../../../redux/Api/Rule-builder';
import type { QueryExecutionResponse } from '../../../../types/queryExecution';
import { extractErrorMessage } from '../../../../types/queryExecution';
import { useLocalVariables } from '../../../../hooks/RuleBuilder';
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
  const [resultsModalOpen, setResultsModalOpen] = useState<boolean>(false);
  const [queryResults, setQueryResults] = useState<Record<string, unknown>[] | null>(null);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [displayCount, setDisplayCount] = useState<number | undefined>(undefined);
  const [executionError, setExecutionError] = useState<string | null>(null);
  
  const [executeQuery, { isLoading: isExecuting }] = useExecuteQueryMutation();

  // Get global variables (RuleRequest, RuleConfig, RuleResult)
  const { data: globalVarsData } = useGetGlobalVariablesQuery(
    ruleId || '',
    { skip: !ruleId }
  );

  // Get local variables (from SetVariable, Loop, etc.) with resolved values
  const { localVars, loopVars } = useLocalVariables({ 
    allNodes, 
    edges, 
    selectedNodeId,
    globalVarsData
  });

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
    setExecutionError(null);
  }, []);

  const handleSaveQuery = useCallback((query: string) => {
    const syntheticEvent = {
      target: { value: query }
    } as React.ChangeEvent<HTMLInputElement>;
    onParamChange('query')(syntheticEvent);
    const updatedParams = { ...currentParams, query };
    
    onParamBlur?.(true, updatedParams);
  }, [onParamChange, onParamBlur, currentParams]);

  /**
   * Helper function to get value from nested path (e.g., "RuleRequest.pain001.GroupHeader.MessageId")
   */
  const getNestedValue = useCallback((obj: Record<string, unknown>, path: string): unknown => {
    const parts = path.split('.');
    let current: unknown = obj;
    
    for (const part of parts) {
      // Handle array indexing like "items[0]"
      const arrayMatch = part.match(/^(.+?)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = (current as Record<string, unknown>)?.[key];
        if (Array.isArray(current)) {
          current = current[parseInt(index, 10)];
        }
      } else {
        current = (current as Record<string, unknown>)?.[part];
      }
      
      if (current === undefined || current === null) {
        return undefined;
      }
    }
    
    return current;
  }, []);

  /**
   * Replace template variables {{ variableName }} with actual values
   * Note: localVars already contains resolved values from useLocalVariables
   */
  const replaceTemplateVariables = useCallback((query: string): string => {
    // Match all {{ variable }} patterns
    const templateRegex = /\{\{\s*([^}]+?)\s*\}\}/g;
    
    const result = query.replace(templateRegex, (match, variablePath: string) => {
      const trimmedPath = variablePath.trim();
      
      // 1. Check local variables first (already resolved by useLocalVariables)
      if (localVars[trimmedPath] !== undefined) {
        const value = localVars[trimmedPath];
        // If it's a type placeholder like '{ }', '<number>', skip replacement
        if (typeof value === 'string' && (value.startsWith('<') || value === '{ }')) {
          return match; // Keep original template
        }
        return String(value);
      }
      
      // 2. Check loop variables
      if (loopVars[trimmedPath] !== undefined) {
        const value = loopVars[trimmedPath];
        if (typeof value === 'string' && value.startsWith('<')) {
          return match; // Keep original template
        }
        return String(value);
      }
      
      // 3. Check global variables (RuleRequest.path, RuleConfig.path, RuleResult.path)
      if (globalVarsData) {
        const globalVars = {
          RuleRequest: globalVarsData.RuleRequest || {},
          RuleConfig: globalVarsData.RuleConfig || {},
          RuleResult: globalVarsData.RuleResult || {},
        };
        
        // Try to get nested value from global variables
        const value = getNestedValue(globalVars as Record<string, unknown>, trimmedPath);
        
        if (value !== undefined && value !== null) {
          // Handle different types
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          return String(value);
        }
      }
      
      // If no value found, keep the placeholder
      return match;
    });
    
    return result;
  }, [localVars, loopVars, globalVarsData, getNestedValue]);

  const handleExecuteQuery = useCallback(async (query: string) => {
    try {
      setExecutionError(null);
      
      // Debug: Log what we have available
      console.log('🔍 Execute Query Debug (ParameterSection):', {
        localVars,
        loopVars,
        globalVarsData,
        hasGlobalVars: !!globalVarsData,
        allNodesCount: allNodes.length
      });
      
      // Replace {{ variable }} with actual values before execution
      const executableQuery = replaceTemplateVariables(query);
      
      console.log('📝 Query transformation:', {
        original: query.substring(0, 200),
        transformed: executableQuery.substring(0, 200)
      });
      
      // Check if any variables were not replaced (still contains {{ }})
      if (/\{\{.*?\}\}/.test(executableQuery)) {
        const unreplacedVars = executableQuery.match(/\{\{\s*([^}]+?)\s*\}\}/g);
        throw new Error(
          `Cannot execute query: Some variables were not found or have no values: ${unreplacedVars?.join(', ')}`
        );
      }
      
      const response = await executeQuery({
        query: executableQuery,
      }).unwrap() as QueryExecutionResponse;

      const data = Array.isArray(response.result) ? response.result : [];
      const rowCount = data.length;

      setQueryResults(data);
      setTotalCount(rowCount);
      setDisplayCount(rowCount);
      setResultsModalOpen(true);
      
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(
        error,
        'Failed to execute query. Please check your query and try again.'
      );
      setExecutionError(errorMessage);
      setQueryResults([]);
      setTotalCount(0);
      setDisplayCount(0);
      setResultsModalOpen(true);
    }
  }, [executeQuery, replaceTemplateVariables, localVars, loopVars, globalVarsData, allNodes]);

  const handleCloseResults = useCallback(() => {
    setResultsModalOpen(false);
  }, []);

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
          onExecuteQuery={handleExecuteQuery}
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
              onExecute={handleExecuteQuery}
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
              onClose={handleCloseResults}
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
