import { useState, useCallback } from 'react';
import { useExecuteQueryMutation } from '../../redux/Api/Rule-builder';
import type { QueryExecutionResponse } from '../../types/queryExecution';
import { extractErrorMessage } from '../../types/queryExecution';
import { extractQueryParameters } from '../../utils/Common/extractQueryParameters';
import type { useVariableData } from './useVariableData';

type VariableData = ReturnType<typeof useVariableData>;

interface UseQueryExecutionOptions {
  variableData: VariableData;
}

interface QueryExecutionState {
  isExecuting: boolean;
  queryResults: Record<string, unknown>[] | null;
  totalCount: number | undefined;
  displayCount: number | undefined;
  executionError: string | null;
  resultsModalOpen: boolean;
}

export const useQueryExecution = ({ variableData }: UseQueryExecutionOptions) => {
  const [state, setState] = useState<QueryExecutionState>({
    isExecuting: false,
    queryResults: null,
    totalCount: undefined,
    displayCount: undefined,
    executionError: null,
    resultsModalOpen: false,
  });

  const [executeQueryMutation] = useExecuteQueryMutation();

  const executeQuery = useCallback(async (rawQuery: string) => {
    try {
      setState(prev => ({ ...prev, executionError: null, isExecuting: true }));

      const processedQuery = extractQueryParameters(rawQuery, variableData);
      
      const response = await executeQueryMutation({
        query: processedQuery,
      }).unwrap() as QueryExecutionResponse;

      const data = Array.isArray(response.result) ? response.result : [];
      const rowCount = data.length;

      setState({
        isExecuting: false,
        queryResults: data,
        totalCount: rowCount,
        displayCount: rowCount,
        executionError: null,
        resultsModalOpen: true,
      });
      
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(
        error,
        'Failed to execute query. Please check your query and try again.'
      );
      
      setState({
        isExecuting: false,
        queryResults: [],
        totalCount: 0,
        displayCount: 0,
        executionError: errorMessage,
        resultsModalOpen: true,
      });
    }
  }, [executeQueryMutation, variableData]);

  const closeResults = useCallback(() => {
    setState(prev => ({ ...prev, resultsModalOpen: false }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, executionError: null }));
  }, []);

  return {
    executeQuery,
    closeResults,
    clearError,
    isExecuting: state.isExecuting,
    queryResults: state.queryResults,
    totalCount: state.totalCount,
    displayCount: state.displayCount,
    executionError: state.executionError,
    resultsModalOpen: state.resultsModalOpen,
  };
};
