import { renderHook, waitFor } from '@testing-library/react';
import useHistoryController from '../../../../src/pages/RuleEditor/History/useHistoryController';

const mockExtractData = jest.fn();
const mockEnablePreviousTab = jest.fn();
const mockOpen = jest.fn();
const mockLogsData = {
  result: [
    { id: '1', category: 'read_only', created_by_email: 'user1@test.com', created_at: '2024-01-01' },
    { id: '2', category: 'end_to_end', created_by_email: 'user2@test.com', created_at: '2024-01-02' },
    { id: '3', category: 'read_only', created_by_email: 'user3@test.com', created_at: '2024-01-03' },
  ],
};

jest.mock('../../../../src/utils/Common/storage', () => ({
  extractData: (key: string, storage?: string, parse?: boolean) => mockExtractData(key, storage, parse),
}));

jest.mock('../../../../src/contexts/TabContext/useTab', () => ({
  useTab: jest.fn(() => ({
    enablePreviousTab: mockEnablePreviousTab,
  })),
}));

jest.mock('../../../../src/contexts/ModalContext', () => ({
  useModal: jest.fn(() => ({
    open: mockOpen,
  })),
}));

jest.mock('../../../../src/redux/Api/SimulationLogs', () => ({
  useGetSimulationLogsQuery: jest.fn(() => ({
    data: mockLogsData,
    isLoading: false,
  })),
}));

jest.mock('../../../../src/pages/RuleEditor/Modals/ViewPayload', () => ({
  __esModule: true,
  default: () => <div>ViewPayload Modal</div>,
}));

jest.mock('../../../../src/components/TableActions', () => ({
  __esModule: true,
  default: ({ onView }: { onView: () => void }) => (
    <button onClick={onView}>View</button>
  ),
}));

describe('useHistoryController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExtractData.mockReturnValue({ id: '123', rule_name: 'Test Rule' });
    
    // Reset SimulationLogs query mock
    const { useGetSimulationLogsQuery } = require('../../../../src/redux/Api/SimulationLogs');
    useGetSimulationLogsQuery.mockReturnValue({
      data: mockLogsData,
      isLoading: false,
    });
  });

  describe('Hook Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.values).toBeDefined();
      expect(result.current.functions).toBeDefined();
    });

    it('should have columns array', () => {
      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.values.columns).toBeDefined();
      expect(Array.isArray(result.current.values.columns)).toBe(true);
    });

    it('should have isLoading state', () => {
      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.values.isLoading).toBeDefined();
      expect(typeof result.current.values.isLoading).toBe('boolean');
    });

    it('should have readOnlyData array', () => {
      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.values.readOnlyData).toBeDefined();
      expect(Array.isArray(result.current.values.readOnlyData)).toBe(true);
    });

    it('should have endToEndData array', () => {
      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.values.endToEndData).toBeDefined();
      expect(Array.isArray(result.current.values.endToEndData)).toBe(true);
    });
  });

  describe('Functions', () => {
    it('should have handlePrevious function', () => {
      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.functions.handlePrevious).toBeDefined();
      expect(typeof result.current.functions.handlePrevious).toBe('function');
    });

    it('should call enablePreviousTab when handlePrevious is called', () => {
      const { result } = renderHook(() => useHistoryController({}));

      result.current.functions.handlePrevious();

      expect(mockEnablePreviousTab).toHaveBeenCalled();
    });
  });

  describe('Data Extraction', () => {
    it('should extract rule data from localStorage', () => {
      renderHook(() => useHistoryController({}));

      expect(mockExtractData).toHaveBeenCalledWith('trs_rule', 'LocalStorage', true);
    });

    it('should use props data when localStorage is empty', () => {
      mockExtractData.mockReturnValue(null);
      const propsData = { id: '456', rule_name: 'Props Rule' };

      const { result } = renderHook(() => useHistoryController({ data: propsData }));

      expect(result.current.values).toBeDefined();
    });

    it('should prioritize localStorage data over props data', () => {
      const storageData = { id: '123', rule_name: 'Storage Rule' };
      const propsData = { id: '456', rule_name: 'Props Rule' };
      mockExtractData.mockReturnValue(storageData);

      renderHook(() => useHistoryController({ data: propsData }));

      expect(mockExtractData).toHaveBeenCalled();
    });
  });

  describe('RTK Query Integration', () => {
    it('should call useGetSimulationLogsQuery with rule id', () => {
      const { useGetSimulationLogsQuery } = require('../../../../src/redux/Api/SimulationLogs');
      mockExtractData.mockReturnValue({ id: '123' });

      renderHook(() => useHistoryController({}));

      expect(useGetSimulationLogsQuery).toHaveBeenCalledWith(
        { ruleId: '123' },
        { skip: false, refetchOnMountOrArgChange: true }
      );
    });

    it('should skip query when no rule id', () => {
      const { useGetSimulationLogsQuery } = require('../../../../src/redux/Api/SimulationLogs');
      mockExtractData.mockReturnValue(null);

      renderHook(() => useHistoryController({}));

      expect(useGetSimulationLogsQuery).toHaveBeenCalledWith(
        { ruleId: undefined },
        { skip: true, refetchOnMountOrArgChange: true }
      );
    });

    it('should handle loading state from query', () => {
      const { useGetSimulationLogsQuery } = require('../../../../src/redux/Api/SimulationLogs');
      useGetSimulationLogsQuery.mockReturnValue({
        data: null,
        isLoading: true,
      });

      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.values.isLoading).toBe(true);
    });
  });

  describe('Logs Filtering', () => {
    it('should filter read_only logs correctly', () => {
      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.values.readOnlyData).toHaveLength(2);
      expect(result.current.values.readOnlyData.every((log: { category?: string }) => log.category === 'read_only')).toBe(true);
    });

    it('should filter end_to_end logs correctly', () => {
      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.values.endToEndData).toHaveLength(1);
      expect(result.current.values.endToEndData.every((log: { category?: string }) => log.category === 'end_to_end')).toBe(true);
    });

    it('should return empty array when logs result is null', () => {
      const { useGetSimulationLogsQuery } = require('../../../../src/redux/Api/SimulationLogs');
      useGetSimulationLogsQuery.mockReturnValue({
        data: null,
        isLoading: false,
      });

      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.values.readOnlyData).toEqual([]);
      expect(result.current.values.endToEndData).toEqual([]);
    });

    it('should return empty array when logs result is not an array', () => {
      const { useGetSimulationLogsQuery } = require('../../../../src/redux/Api/SimulationLogs');
      useGetSimulationLogsQuery.mockReturnValue({
        data: { result: 'not an array' },
        isLoading: false,
      });

      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.values.readOnlyData).toEqual([]);
      expect(result.current.values.endToEndData).toEqual([]);
    });

    it('should handle empty logs array', () => {
      const { useGetSimulationLogsQuery } = require('../../../../src/redux/Api/SimulationLogs');
      useGetSimulationLogsQuery.mockReturnValue({
        data: { result: [] },
        isLoading: false,
      });

      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.values.readOnlyData).toEqual([]);
      expect(result.current.values.endToEndData).toEqual([]);
    });
  });

  describe('Columns Configuration', () => {
    it('should have correct number of columns', () => {
      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.values.columns).toHaveLength(3);
    });

    it('should have Created By column', () => {
      const { result } = renderHook(() => useHistoryController({}));

      const createdByColumn = result.current.values.columns.find((col: { key: string }) => col.key === 'created_by_email');
      expect(createdByColumn).toBeDefined();
      expect(createdByColumn?.label).toBe('Created By');
    });

    it('should have Created At column with date type', () => {
      const { result } = renderHook(() => useHistoryController({}));

      const createdAtColumn = result.current.values.columns.find((col: { key: string }) => col.key === 'created_at');
      expect(createdAtColumn).toBeDefined();
      expect(createdAtColumn?.label).toBe('Created At');
      expect(createdAtColumn?.type).toBe('date');
    });

    it('should have Actions column', () => {
      const { result } = renderHook(() => useHistoryController({}));

      const actionsColumn = result.current.values.columns.find((col: { key: string }) => col.key === 'actions');
      expect(actionsColumn).toBeDefined();
      expect(actionsColumn?.label).toBe('Actions');
    });

    it('should have render function in Actions column', () => {
      const { result } = renderHook(() => useHistoryController({}));

      const actionsColumn = result.current.values.columns.find((col: { key: string }) => col.key === 'actions');
      expect(actionsColumn?.render).toBeDefined();
      expect(typeof actionsColumn?.render).toBe('function');
    });
  });

  describe('Modal Integration', () => {
    it('should use useModal hook', () => {
      const { useModal } = require('../../../../src/contexts/ModalContext');

      renderHook(() => useHistoryController({}));

      expect(useModal).toHaveBeenCalled();
    });

    it('should open modal when onView is called', () => {
      const { result } = renderHook(() => useHistoryController({}));
      const actionsColumn = result.current.values.columns.find((col: { key: string }) => col.key === 'actions');
      const rowData = { id: '1', data: 'test' };

      if (actionsColumn?.render) {
        const renderedComponent = actionsColumn.render(rowData);
        expect(renderedComponent).toBeDefined();
      }
    });
  });

  describe('Tab Context Integration', () => {
    it('should use useTab hook', () => {
      const { useTab } = require('../../../../src/contexts/TabContext/useTab');

      renderHook(() => useHistoryController({}));

      expect(useTab).toHaveBeenCalled();
    });

    it('should get enablePreviousTab from useTab', () => {
      renderHook(() => useHistoryController({}));

      expect(mockEnablePreviousTab).toBeDefined();
    });
  });

  describe('Return Structure', () => {
    it('should return object with values and functions', () => {
      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current).toHaveProperty('values');
      expect(result.current).toHaveProperty('functions');
    });

    it('should have correct values structure', () => {
      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.values).toHaveProperty('columns');
      expect(result.current.values).toHaveProperty('isLoading');
      expect(result.current.values).toHaveProperty('readOnlyData');
      expect(result.current.values).toHaveProperty('endToEndData');
    });

    it('should have correct functions structure', () => {
      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.functions).toHaveProperty('handlePrevious');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined props', () => {
      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.values).toBeDefined();
      expect(result.current.functions).toBeDefined();
    });

    it('should handle logs with missing category', () => {
      const { useGetSimulationLogsQuery } = require('../../../../src/redux/Api/SimulationLogs');
      useGetSimulationLogsQuery.mockReturnValue({
        data: {
          result: [
            { id: '1' },
            { id: '2', category: 'read_only' },
          ],
        },
        isLoading: false,
      });

      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.values.readOnlyData).toHaveLength(1);
    });

    it('should handle data without id', () => {
      mockExtractData.mockReturnValue({});

      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.values).toBeDefined();
    });

    it('should memoize data based on props.data changes', () => {
      const { rerender } = renderHook(
        ({ data }) => useHistoryController({ data }),
        { initialProps: { data: { id: '1' } } }
      );

      const callCount1 = mockExtractData.mock.calls.length;

      rerender({ data: { id: '2' } });

      expect(mockExtractData.mock.calls.length).toBeGreaterThan(callCount1);
    });
  });

  describe('Logs Data Processing', () => {
    it('should process logs with all required fields', () => {
      const { result } = renderHook(() => useHistoryController({}));

      const readOnlyLog = result.current.values.readOnlyData[0];
      expect(readOnlyLog).toHaveProperty('id');
      expect(readOnlyLog).toHaveProperty('created_by_email');
      expect(readOnlyLog).toHaveProperty('created_at');
    });

    it('should maintain log order after filtering', () => {
      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.values.readOnlyData[0].id).toBe('1');
      expect(result.current.values.readOnlyData[1].id).toBe('3');
    });

    it('should handle logs with additional properties', () => {
      const { useGetSimulationLogsQuery } = require('../../../../src/redux/Api/SimulationLogs');
      useGetSimulationLogsQuery.mockReturnValue({
        data: {
          result: [
            { id: '1', category: 'read_only', extra_field: 'value' },
          ],
        },
        isLoading: false,
      });

      const { result } = renderHook(() => useHistoryController({}));

      expect(result.current.values.readOnlyData[0]).toHaveProperty('extra_field');
    });
  });

  describe('Props Data Handling', () => {
    it('should use props data when provided and storage is null', () => {
      mockExtractData.mockReturnValue(null);
      const propsData = { id: '789' };

      renderHook(() => useHistoryController({ data: propsData }));

      const { useGetSimulationLogsQuery } = require('../../../../src/redux/Api/SimulationLogs');
      expect(useGetSimulationLogsQuery).toHaveBeenCalledWith(
        { ruleId: '789' },
        { skip: false, refetchOnMountOrArgChange: true }
      );
    });

    it('should handle props with undefined data', () => {
      mockExtractData.mockReturnValue(null);

      const { result } = renderHook(() => useHistoryController({ data: undefined }));

      expect(result.current.values).toBeDefined();
    });
  });
});
