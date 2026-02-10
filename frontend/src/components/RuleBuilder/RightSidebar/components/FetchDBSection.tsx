import React, { useState, useCallback, useMemo } from 'react';
import { TextField, Typography, Divider, Button, Box } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import type { Node, Edge } from '@xyflow/react';
import { PropertyRow, SectionContainer, SectionTitle } from '../styles';
import QueryEditorModal from './QueryEditorModal';
import QueryExecutionResultModal from './QueryExecutionResultModal';
import { useExecuteQueryMutation, useGetGlobalVariablesQuery } from '../../../../redux/Api/Rule-builder';
import {
  extractErrorMessage,
  // QueryExecutionResponse,
} from '../../../../types/queryExecution';
import { useParams } from 'react-router-dom';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useLocalVariables } from '../../../../hooks/RuleBuilder';

interface FetchDBSectionProps {
  currentParams: Record<string, string>;
  onParamChange: (paramKey: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onParamBlur?: (shouldForceSave?: boolean, overrideParams?: Record<string, string>) => void;
  onDrop: (paramKey: string) => (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | HTMLTextAreaElement>>;
  isReadOnly: boolean;
  viewOnly: boolean;
  allNodes?: Node[];
  edges?: Edge[];
  selectedNodeId?: string | null;
  getFieldError?: (fieldName: string) => string | undefined;
}

const FetchDBSection: React.FC<FetchDBSectionProps> = ({
  currentParams,
  onParamChange,
  onParamBlur,
  onDrop,
  onDragOver,
  inputRefs: inputRefsRef,
  isReadOnly,
  viewOnly,
  allNodes = [],
  edges = [],
  selectedNodeId = null,
  getFieldError,
}) => {
  const [queryEditorOpen, setQueryEditorOpen] = useState<boolean>(false);
  const [resultsModalOpen, setResultsModalOpen] = useState<boolean>(false);
  const [queryResults, setQueryResults] = useState<Record<string, unknown>[] | null>(null);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [displayCount, setDisplayCount] = useState<number | undefined>(undefined);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const [executeQuery, { isLoading: isExecuting }] = useExecuteQueryMutation();
  const { id: ruleId } = useParams<{ id: string }>();
  
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
  
  const queryLineCount = useMemo(
    () => currentParams.query?.split('\n').length ?? 0,
    [currentParams.query]
  );
  
  const hasQuery = useMemo(
    () => Boolean(currentParams.query?.trim()),
    [currentParams.query]
  );

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

    handleCloseQueryEditor();
  }, [onParamChange, onParamBlur, currentParams, handleCloseQueryEditor]);

  const handleExecuteQuery = useCallback(async (query: string) => {
    try {
      setExecutionError(null);
      
      // Debug: Log what we have available
      console.log('🔍 Execute Query Debug:', {
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
      }).unwrap();

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

  const isDisabled = isReadOnly || viewOnly;

  const databases = ['_event_history', 'configuration', '_rawHistory'];

  return (
    <>
      <Divider />
      <SectionContainer>
        <SectionTitle>Database Query</SectionTitle>
        <PropertyRow>
          <FormControl fullWidth>
            <InputLabel id="db-select-label">Database</InputLabel>
            <Select
              labelId="db-select-label"
              id="db-select"
              value={currentParams.dbName ?? '_event_history'}
              label="Database"
              onChange={(e) =>
                onParamChange('dbName')({
                  target: { value: e.target.value },
                } as React.ChangeEvent<HTMLInputElement>)
              }
              disabled={isDisabled}
            >
              {databases.map((db) => (
                <MenuItem key={db} value={db}>
                  {db}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </PropertyRow>
        <PropertyRow>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            SQL Query
            <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>
              *
            </Typography>
          </Typography>
          
          <Box>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<CodeIcon />}
              onClick={handleOpenQueryEditor}
              disabled={isDisabled}
              sx={{
                justifyContent: 'flex-start',
                textAlign: 'left',
                py: 1.5,
                px: 2,
                borderColor: getFieldError?.('query') ? 'error.main' : 'divider',
                borderWidth: getFieldError?.('query') ? 2 : 1,
                '&:hover': {
                  borderColor: getFieldError?.('query') ? 'error.dark' : 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                <Typography variant="body2" fontWeight={500}>
                  {hasQuery ? 'Edit SQL Query' : 'Write SQL Query'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {hasQuery ? `${queryLineCount} lines` : 'Click to open query editor'}
                </Typography>
              </Box>
            </Button>
            
            {getFieldError?.('query') && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {getFieldError('query')}
              </Typography>
            )}
            
            {!getFieldError?.('query') && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                💡 Use Monaco editor to write and test your SQL query
              </Typography>
            )}
          </Box>
        </PropertyRow>
        {hasQuery && !isDisabled && (
          <PropertyRow>
            <Button
              fullWidth
              variant="contained"
              color="success"
              startIcon={<PlayArrowIcon />}
              onClick={() => handleExecuteQuery(currentParams.query)}
              disabled={isExecuting}
              sx={{ py: 1 }}
            >
              {isExecuting ? 'Executing Query...' : 'Execute & Test Query'}
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
              Test your query before saving to see sample results
            </Typography>
          </PropertyRow>
        )}
        <PropertyRow>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Store Query In Variable
          </Typography>
          <TextField
            fullWidth
            value={currentParams.queryVar ?? 'query'}
            onChange={onParamChange('queryVar')}
            onBlur={() => onParamBlur?.()}
            disabled={isDisabled}
            placeholder="Variable name (e.g., query)"
            error={!!getFieldError?.('queryVar')}
            helperText={getFieldError?.('queryVar') || '💡 Variable name to store the SQL query string'}
            onDrop={onDrop('queryVar')}
            onDragOver={onDragOver}
            inputRef={(el: HTMLInputElement | null) => {
              if (el) {
                inputRefsRef.current['queryVar'] = el;
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'monospace',
                fontSize: '0.875rem',
              },
            }}
          />
        </PropertyRow>
        <PropertyRow>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Store Result In
            <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>
              *
            </Typography>
          </Typography>
          <TextField
            fullWidth
            value={currentParams.resultVar ?? currentParams.variable ?? ''}
            onChange={onParamChange('resultVar')}
            onBlur={() => onParamBlur?.()}
            disabled={isDisabled}
            placeholder="Variable name (e.g., dbResult)"
            error={!!getFieldError?.('resultVar')}
            helperText={getFieldError?.('resultVar') || '💡 Variable name to store query results'}
            onDrop={onDrop('resultVar')}
            onDragOver={onDragOver}
            inputRef={(el: HTMLInputElement | null) => {
              if (el) {
                inputRefsRef.current['resultVar'] = el;
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'monospace',
                fontSize: '0.875rem',
              },
            }}
          />
        </PropertyRow>
      </SectionContainer>
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
  );
};

export default FetchDBSection;
