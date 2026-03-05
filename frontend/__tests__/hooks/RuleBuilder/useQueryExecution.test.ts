import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { useQueryExecution } from '../../../src/hooks/RuleBuilder/useQueryExecution';
import { useExecuteQueryMutation } from '../../../src/redux/Api/Rule-builder';
import { extractQueryParameters } from '../../../src/utils/Common/extractQueryParameters';
import { extractErrorMessage } from '../../../src/types/queryExecution';
import type { useVariableData } from '../../../src/hooks/RuleBuilder/useVariableData';

type VariableData = ReturnType<typeof useVariableData>;

jest.mock('../../../src/redux/Api/Rule-builder');
jest.mock('../../../src/utils/Common/extractQueryParameters');
jest.mock('../../../src/types/queryExecution');

const mockedUseExecuteQueryMutation = useExecuteQueryMutation as jest.MockedFunction<
  typeof useExecuteQueryMutation
>;
const mockedExtractQueryParameters = extractQueryParameters as jest.MockedFunction<
  typeof extractQueryParameters
>;
const mockedExtractErrorMessage = extractErrorMessage as jest.MockedFunction<
  typeof extractErrorMessage
>;

describe('useQueryExecution', () => {
  const mockVariableData: VariableData = {
    localVarsTree: [
      {
        key: 'count',
        value: '10',
        path: 'count',
        type: 'string',
        children: [],
        isDraggable: true,
      },
    ],
    loopVarsTree: [],
    loopContext: {
      isInLoopScope: false,
      loopNames: [],
    },
    ruleRequestTree: [],
    ruleConfigTree: [],
    ruleResultTree: [],
  };

  const mockExecuteQueryMutation = jest.fn();
  const mockUnwrap = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockExecuteQueryMutation.mockReturnValue({ unwrap: mockUnwrap });
    mockedUseExecuteQueryMutation.mockReturnValue([mockExecuteQueryMutation, { reset: jest.fn() }]);
    mockedExtractQueryParameters.mockImplementation((query) => query);
    mockedExtractErrorMessage.mockReturnValue('Query execution failed');
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      expect(result.current.isExecuting).toBe(false);
      expect(result.current.queryResults).toBeNull();
      expect(result.current.totalCount).toBeUndefined();
      expect(result.current.displayCount).toBeUndefined();
      expect(result.current.executionError).toBeNull();
      expect(result.current.resultsModalOpen).toBe(false);
    });

    it('should provide all expected functions', () => {
      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      expect(typeof result.current.executeQuery).toBe('function');
      expect(typeof result.current.closeResults).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('Query Execution - Success', () => {
    it('should execute query successfully', async () => {
      const mockResults = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];

      mockUnwrap.mockResolvedValue({ result: mockResults });

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM users');
      });

      await waitFor(() => {
        expect(result.current.isExecuting).toBe(false);
      });

      expect(result.current.queryResults).toEqual(mockResults);
      expect(result.current.totalCount).toBe(2);
      expect(result.current.displayCount).toBe(2);
      expect(result.current.executionError).toBeNull();
      expect(result.current.resultsModalOpen).toBe(true);
    });

    it('should process query parameters through extractQueryParameters', async () => {
      const rawQuery = 'SELECT * FROM users WHERE id = {count}';
      const processedQuery = 'SELECT * FROM users WHERE id = 10';

      mockedExtractQueryParameters.mockReturnValue(processedQuery);
      mockUnwrap.mockResolvedValue({ result: [] });

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery(rawQuery);
      });

      expect(mockedExtractQueryParameters).toHaveBeenCalledWith(rawQuery, mockVariableData);
      expect(mockExecuteQueryMutation).toHaveBeenCalledWith({
        query: processedQuery,
      });
    });

    it('should set isExecuting to true during execution', async () => {
      let resolveQuery: (value: unknown) => void;
      const queryPromise = new Promise((resolve) => {
        resolveQuery = resolve;
      });

      mockUnwrap.mockReturnValue(queryPromise);

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      act(() => {
        result.current.executeQuery('SELECT * FROM users');
      });

      await waitFor(() => {
        expect(result.current.isExecuting).toBe(true);
      });

      await act(async () => {
        resolveQuery!({ result: [] });
      });

      await waitFor(() => {
        expect(result.current.isExecuting).toBe(false);
      });
    });

    it('should handle empty results array', async () => {
      mockUnwrap.mockResolvedValue({ result: [] });

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM users WHERE 1=0');
      });

      await waitFor(() => {
        expect(result.current.queryResults).toEqual([]);
        expect(result.current.totalCount).toBe(0);
        expect(result.current.displayCount).toBe(0);
      });
    });

    it('should handle non-array result by converting to empty array', async () => {
      mockUnwrap.mockResolvedValue({ result: null });

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM users');
      });

      await waitFor(() => {
        expect(result.current.queryResults).toEqual([]);
        expect(result.current.totalCount).toBe(0);
      });
    });
  });

  describe('Database Name Processing', () => {
    it('should include dbName in payload when provided', async () => {
      mockUnwrap.mockResolvedValue({ result: [] });

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM users', 'myDatabase');
      });

      expect(mockExecuteQueryMutation).toHaveBeenCalledWith({
        query: expect.any(String),
        dbName: 'myDatabase',
      });
    });

    it('should remove leading underscore from dbName', async () => {
      mockUnwrap.mockResolvedValue({ result: [] });

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM users', '_myDatabase');
      });

      expect(mockExecuteQueryMutation).toHaveBeenCalledWith({
        query: expect.any(String),
        dbName: 'myDatabase',
      });
    });

    it('should not include dbName when not provided', async () => {
      mockUnwrap.mockResolvedValue({ result: [] });

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM users');
      });

      expect(mockExecuteQueryMutation).toHaveBeenCalledWith({
        query: expect.any(String),
      });
    });

    it('should handle undefined dbName', async () => {
      mockUnwrap.mockResolvedValue({ result: [] });

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM users', undefined);
      });

      expect(mockExecuteQueryMutation).toHaveBeenCalledWith({
        query: expect.any(String),
      });
    });

    it('should handle empty dbName', async () => {
      mockUnwrap.mockResolvedValue({ result: [] });

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM users', '');
      });

      expect(mockExecuteQueryMutation).toHaveBeenCalledWith({
        query: expect.any(String),
      });
    });

    it('should handle dbName with only underscore', async () => {
      mockUnwrap.mockResolvedValue({ result: [] });

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM users', '_');
      });

      expect(mockExecuteQueryMutation).toHaveBeenCalledWith({
        query: expect.any(String),
      });
    });
  });

  describe('Query Execution - Error Handling', () => {
    it('should handle query execution error', async () => {
      const errorMessage = 'SQL syntax error';
      mockedExtractErrorMessage.mockReturnValue(errorMessage);
      mockUnwrap.mockRejectedValue(new Error('SQL error'));

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM invalid_table');
      });

      await waitFor(() => {
        expect(result.current.isExecuting).toBe(false);
      });

      expect(result.current.executionError).toBe(errorMessage);
      expect(result.current.queryResults).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.displayCount).toBe(0);
      expect(result.current.resultsModalOpen).toBe(true);
    });

    it('should call extractErrorMessage with error object', async () => {
      const error = new Error('Network error');
      mockUnwrap.mockRejectedValue(error);

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM users');
      });

      await waitFor(() => {
        expect(mockedExtractErrorMessage).toHaveBeenCalledWith(
          error,
          'Failed to execute query. Please check your query and try again.'
        );
      });
    });

    it('should clear previous error on new query execution', async () => {
      mockUnwrap.mockRejectedValueOnce(new Error('First error'));
      mockUnwrap.mockResolvedValueOnce({ result: [{ id: 1 }] });

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM bad_table');
      });

      await waitFor(() => {
        expect(result.current.executionError).not.toBeNull();
      });

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM good_table');
      });

      await waitFor(() => {
        expect(result.current.executionError).toBeNull();
      });
    });
  });

  describe('Results Modal Management', () => {
    it('should open results modal after successful execution', async () => {
      mockUnwrap.mockResolvedValue({ result: [{ id: 1 }] });

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM users');
      });

      await waitFor(() => {
        expect(result.current.resultsModalOpen).toBe(true);
      });
    });

    it('should open results modal after error', async () => {
      mockUnwrap.mockRejectedValue(new Error('Query failed'));

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM users');
      });

      await waitFor(() => {
        expect(result.current.resultsModalOpen).toBe(true);
      });
    });

    it('should close results modal', async () => {
      mockUnwrap.mockResolvedValue({ result: [] });

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM users');
      });

      await waitFor(() => {
        expect(result.current.resultsModalOpen).toBe(true);
      });

      act(() => {
        result.current.closeResults();
      });

      expect(result.current.resultsModalOpen).toBe(false);
    });

    it('should preserve results when closing modal', async () => {
      const mockResults = [{ id: 1 }, { id: 2 }];
      mockUnwrap.mockResolvedValue({ result: mockResults });

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM users');
      });

      await waitFor(() => {
        expect(result.current.resultsModalOpen).toBe(true);
      });

      act(() => {
        result.current.closeResults();
      });

      expect(result.current.queryResults).toEqual(mockResults);
      expect(result.current.totalCount).toBe(2);
    });
  });

  describe('Error Clearing', () => {
    it('should clear execution error', async () => {
      mockUnwrap.mockRejectedValue(new Error('Query failed'));

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM users');
      });

      await waitFor(() => {
        expect(result.current.executionError).not.toBeNull();
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.executionError).toBeNull();
    });

    it('should preserve other state when clearing error', async () => {
      mockUnwrap.mockRejectedValue(new Error('Query failed'));

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM users');
      });

      await waitFor(() => {
        expect(result.current.executionError).not.toBeNull();
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.queryResults).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.resultsModalOpen).toBe(true);
    });
  });

  describe('Callback Stability', () => {
    it('should maintain stable executeQuery reference', () => {
      const { result, rerender } = renderHook(() =>
        useQueryExecution({ variableData: mockVariableData })
      );

      const firstExecuteQuery = result.current.executeQuery;
      rerender();

      expect(result.current.executeQuery).toBe(firstExecuteQuery);
    });

    it('should maintain stable closeResults reference', () => {
      const { result, rerender } = renderHook(() =>
        useQueryExecution({ variableData: mockVariableData })
      );

      const firstCloseResults = result.current.closeResults;
      rerender();

      expect(result.current.closeResults).toBe(firstCloseResults);
    });

    it('should maintain stable clearError reference', () => {
      const { result, rerender } = renderHook(() =>
        useQueryExecution({ variableData: mockVariableData })
      );

      const firstClearError = result.current.clearError;
      rerender();

      expect(result.current.clearError).toBe(firstClearError);
    });

    it('should update executeQuery when variableData changes', () => {
      const { result, rerender } = renderHook(
        ({ variableData }) => useQueryExecution({ variableData }),
        { initialProps: { variableData: mockVariableData } }
      );

      const firstExecuteQuery = result.current.executeQuery;

      const newVariableData: VariableData = {
        localVarsTree: [
          {
            key: 'newVar',
            value: '20',
            path: 'newVar',
            type: 'string',
            children: [],
            isDraggable: true,
          },
        ],
        loopVarsTree: [],
        loopContext: {
          isInLoopScope: false,
          loopNames: [],
        },
        ruleRequestTree: [],
        ruleConfigTree: [],
        ruleResultTree: [],
      };

      rerender({ variableData: newVariableData });

      expect(result.current.executeQuery).not.toBe(firstExecuteQuery);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple concurrent executions', async () => {
      mockUnwrap
        .mockResolvedValueOnce({ result: [{ id: 1 }] })
        .mockResolvedValueOnce({ result: [{ id: 2 }] });

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        const promise1 = result.current.executeQuery('SELECT * FROM users WHERE id = 1');
        const promise2 = result.current.executeQuery('SELECT * FROM users WHERE id = 2');
        await Promise.all([promise1, promise2]);
      });

      await waitFor(() => {
        expect(result.current.isExecuting).toBe(false);
      });
    });

    it('should handle result with nested objects', async () => {
      const complexResults = [
        {
          id: 1,
          user: { name: 'Alice', profile: { age: 30 } },
          tags: ['admin', 'user'],
        },
      ];

      mockUnwrap.mockResolvedValue({ result: complexResults });

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM users');
      });

      await waitFor(() => {
        expect(result.current.queryResults).toEqual(complexResults);
      });
    });

    it('should handle very large result sets', async () => {
      const largeResults = Array.from({ length: 10000 }, (_, i) => ({ id: i }));
      mockUnwrap.mockResolvedValue({ result: largeResults });

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('SELECT * FROM large_table');
      });

      await waitFor(() => {
        expect(result.current.totalCount).toBe(10000);
        expect(result.current.displayCount).toBe(10000);
      });
    });

    it('should handle empty query string', async () => {
      mockUnwrap.mockResolvedValue({ result: [] });

      const { result } = renderHook(() => useQueryExecution({ variableData: mockVariableData }));

      await act(async () => {
        await result.current.executeQuery('');
      });

      expect(mockedExtractQueryParameters).toHaveBeenCalledWith('', mockVariableData);
    });
  });
});
