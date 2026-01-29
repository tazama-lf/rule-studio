import React, { useState, useCallback, useMemo } from 'react';
import { TextField, Typography, Divider, Button, Box } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import type { Node } from '@xyflow/react';
import { PropertyRow, SectionContainer, SectionTitle } from '../styles';
import QueryEditorModal from './QueryEditorModal';
import QueryExecutionResultModal from './QueryExecutionResultModal';
import { useExecuteQueryMutation } from '../../../../redux/Api/Rule-builder';
import type { QueryExecutionResponse } from '../../../../types/queryExecution';
import { extractErrorMessage } from '../../../../types/queryExecution';

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
  getFieldError,
}) => {
  const [queryEditorOpen, setQueryEditorOpen] = useState<boolean>(false);
  const [resultsModalOpen, setResultsModalOpen] = useState<boolean>(false);
  const [queryResults, setQueryResults] = useState<Record<string, unknown>[] | null>(null);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
  const [displayCount, setDisplayCount] = useState<number | undefined>(undefined);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const [executeQuery, { isLoading: isExecuting }] = useExecuteQueryMutation();

  const queryLineCount = useMemo(
    () => currentParams.query?.split('\n').length ?? 0,
    [currentParams.query]
  );
  
  const hasQuery = useMemo(
    () => Boolean(currentParams.query?.trim()),
    [currentParams.query]
  );

  const handleOpenQueryEditor = useCallback(() => {
    setQueryEditorOpen(true);
  }, []);

  const handleCloseQueryEditor = useCallback(() => {
    setQueryEditorOpen(false);
    setExecutionError(null);
  }, []);

  const handleSaveQuery = useCallback((query: string) => {
    console.log('📝 handleSaveQuery received:', query);
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
      
      const response = await executeQuery({
        query,
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
  }, [executeQuery]);

  const handleCloseResults = useCallback(() => {
    setResultsModalOpen(false);
  }, []);

  const isDisabled = isReadOnly || viewOnly;

  return (
    <>
      <Divider />
      <SectionContainer>
        <SectionTitle>Database Query</SectionTitle>
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
