import { renderHook } from '@testing-library/react';
import useViewNetworkMapController from '../../../../../src/pages/RuleEditor/Modals/ViewNetworkMap/useViewNetworkMapController';
import { useGetNetworkMapQuery } from '../../../../../src/redux/Api/Rules';

// Mock the RTK Query hook
jest.mock('../../../../../src/redux/Api/Rules', () => ({
  useGetNetworkMapQuery: jest.fn(),
}));

const mockUseGetNetworkMapQuery = useGetNetworkMapQuery as jest.MockedFunction<typeof useGetNetworkMapQuery>;

describe('useViewNetworkMapController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    mockUseGetNetworkMapQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: jest.fn(),
    } as any);
  });

  describe('Hook Initialization', () => {
    it('should call useGetNetworkMapQuery with empty object', () => {
      renderHook(() => useViewNetworkMapController());
      
      expect(mockUseGetNetworkMapQuery).toHaveBeenCalledWith({});
    });

    it('should return the correct structure with values and functions', () => {
      const { result } = renderHook(() => useViewNetworkMapController());
      
      expect(result.current).toHaveProperty('values');
      expect(result.current).toHaveProperty('functions');
    });

    it('should return values object with data and isLoading', () => {
      const { result } = renderHook(() => useViewNetworkMapController());
      
      expect(result.current.values).toHaveProperty('data');
      expect(result.current.values).toHaveProperty('isLoading');
    });

    it('should return an empty functions object', () => {
      const { result } = renderHook(() => useViewNetworkMapController());
      
      expect(result.current.functions).toEqual({});
      expect(Object.keys(result.current.functions)).toHaveLength(0);
    });

    it('should initialize with default values when query returns undefined', () => {
      const { result } = renderHook(() => useViewNetworkMapController());
      
      expect(result.current.values.data).toBeUndefined();
      expect(result.current.values.isLoading).toBe(false);
    });
  });

  describe('RTK Query Integration', () => {
    it('should reflect loading state from useGetNetworkMapQuery', () => {
      mockUseGetNetworkMapQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      const { result } = renderHook(() => useViewNetworkMapController());
      
      expect(result.current.values.isLoading).toBe(true);
    });

    it('should reflect data from useGetNetworkMapQuery when available', () => {
      const mockData = {
        nodes: [{ id: 1, name: 'Node 1' }],
        edges: [{ from: 1, to: 2 }],
      };

      mockUseGetNetworkMapQuery.mockReturnValue({
        data: mockData,
        isLoading: false,
        isError: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      const { result } = renderHook(() => useViewNetworkMapController());
      
      expect(result.current.values.data).toEqual(mockData);
    });

    it('should handle when query returns null data', () => {
      mockUseGetNetworkMapQuery.mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      const { result } = renderHook(() => useViewNetworkMapController());
      
      expect(result.current.values.data).toBeNull();
    });

    it('should handle when query is in loading state with no data', () => {
      mockUseGetNetworkMapQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      const { result } = renderHook(() => useViewNetworkMapController());
      
      expect(result.current.values.isLoading).toBe(true);
      expect(result.current.values.data).toBeUndefined();
    });
  });

  describe('Data Handling', () => {
    it('should handle empty network map data', () => {
      mockUseGetNetworkMapQuery.mockReturnValue({
        data: {},
        isLoading: false,
        isError: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      const { result } = renderHook(() => useViewNetworkMapController());
      
      expect(result.current.values.data).toEqual({});
    });

    it('should handle complex network map data structure', () => {
      const complexData = {
        nodes: [
          { id: 1, label: 'Start', type: 'entry' },
          { id: 2, label: 'Process', type: 'processor' },
          { id: 3, label: 'End', type: 'exit' },
        ],
        edges: [
          { from: 1, to: 2, label: 'flow1' },
          { from: 2, to: 3, label: 'flow2' },
        ],
        metadata: {
          version: '1.0',
          timestamp: '2024-01-01',
        },
      };

      mockUseGetNetworkMapQuery.mockReturnValue({
        data: complexData,
        isLoading: false,
        isError: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      const { result } = renderHook(() => useViewNetworkMapController());
      
      expect(result.current.values.data).toEqual(complexData);
      expect(result.current.values.data.nodes).toHaveLength(3);
      expect(result.current.values.data.edges).toHaveLength(2);
    });

    it('should handle network map data with only nodes', () => {
      const dataWithOnlyNodes = {
        nodes: [{ id: 1, name: 'Single Node' }],
      };

      mockUseGetNetworkMapQuery.mockReturnValue({
        data: dataWithOnlyNodes,
        isLoading: false,
        isError: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      const { result } = renderHook(() => useViewNetworkMapController());
      
      expect(result.current.values.data).toEqual(dataWithOnlyNodes);
    });

    it('should handle network map data with only edges', () => {
      const dataWithOnlyEdges = {
        edges: [{ from: 1, to: 2 }],
      };

      mockUseGetNetworkMapQuery.mockReturnValue({
        data: dataWithOnlyEdges,
        isLoading: false,
        isError: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      const { result } = renderHook(() => useViewNetworkMapController());
      
      expect(result.current.values.data).toEqual(dataWithOnlyEdges);
    });
  });

  describe('Loading State Management', () => {
    it('should transition from loading to loaded state', () => {
      mockUseGetNetworkMapQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      const { result, rerender } = renderHook(() => useViewNetworkMapController());
      
      expect(result.current.values.isLoading).toBe(true);

      mockUseGetNetworkMapQuery.mockReturnValue({
        data: { nodes: [], edges: [] },
        isLoading: false,
        isError: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      rerender();
      
      expect(result.current.values.isLoading).toBe(false);
      expect(result.current.values.data).toEqual({ nodes: [], edges: [] });
    });

    it('should maintain data structure during loading', () => {
      const existingData = { nodes: [{ id: 1 }] };

      mockUseGetNetworkMapQuery.mockReturnValue({
        data: existingData,
        isLoading: true,
        isError: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      const { result } = renderHook(() => useViewNetworkMapController());
      
      expect(result.current.values.isLoading).toBe(true);
      expect(result.current.values.data).toEqual(existingData);
    });

    it('should handle multiple loading cycles', () => {
      const { result, rerender } = renderHook(() => useViewNetworkMapController());

      // First load
      mockUseGetNetworkMapQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);
      rerender();
      expect(result.current.values.isLoading).toBe(true);

      // Loaded
      mockUseGetNetworkMapQuery.mockReturnValue({
        data: { nodes: [] },
        isLoading: false,
        isError: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);
      rerender();
      expect(result.current.values.isLoading).toBe(false);

      // Second load
      mockUseGetNetworkMapQuery.mockReturnValue({
        data: { nodes: [] },
        isLoading: true,
        isError: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);
      rerender();
      expect(result.current.values.isLoading).toBe(true);
    });
  });

  describe('Return Structure Validation', () => {
    it('should consistently return the same structure', () => {
      const { result, rerender } = renderHook(() => useViewNetworkMapController());
      
      const firstStructure = Object.keys(result.current);
      const firstValuesStructure = Object.keys(result.current.values);
      
      rerender();
      
      const secondStructure = Object.keys(result.current);
      const secondValuesStructure = Object.keys(result.current.values);
      
      expect(firstStructure).toEqual(secondStructure);
      expect(firstValuesStructure).toEqual(secondValuesStructure);
    });

    it('should have only values and functions in return object', () => {
      const { result } = renderHook(() => useViewNetworkMapController());
      
      const keys = Object.keys(result.current);
      expect(keys).toEqual(['values', 'functions']);
    });

    it('should have only data and isLoading in values object', () => {
      const { result } = renderHook(() => useViewNetworkMapController());
      
      const valueKeys = Object.keys(result.current.values);
      expect(valueKeys).toContain('data');
      expect(valueKeys).toContain('isLoading');
      expect(valueKeys).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle when RTK Query returns error state', () => {
      mockUseGetNetworkMapQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: { status: 500, data: 'Server Error' },
        refetch: jest.fn(),
      } as any);

      const { result } = renderHook(() => useViewNetworkMapController());
      
      expect(result.current.values.isLoading).toBe(false);
      expect(result.current.values.data).toBeUndefined();
    });

    it('should handle very large network map data', () => {
      const largeData = {
        nodes: Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Node ${i}` })),
        edges: Array.from({ length: 2000 }, (_, i) => ({ from: i, to: i + 1 })),
      };

      mockUseGetNetworkMapQuery.mockReturnValue({
        data: largeData,
        isLoading: false,
        isError: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      const { result } = renderHook(() => useViewNetworkMapController());
      
      expect(result.current.values.data.nodes).toHaveLength(1000);
      expect(result.current.values.data.edges).toHaveLength(2000);
    });

    it('should handle network map data with special characters', () => {
      const dataWithSpecialChars = {
        nodes: [
          { id: 1, label: 'Node with "quotes"' },
          { id: 2, label: 'Node with \'apostrophe\'' },
          { id: 3, label: 'Node with <html> tags' },
        ],
      };

      mockUseGetNetworkMapQuery.mockReturnValue({
        data: dataWithSpecialChars,
        isLoading: false,
        isError: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      const { result } = renderHook(() => useViewNetworkMapController());
      
      expect(result.current.values.data).toEqual(dataWithSpecialChars);
    });

    it('should handle consecutive rerenders without issues', () => {
      const { result, rerender } = renderHook(() => useViewNetworkMapController());
      
      const initialResult = result.current;
      
      for (let i = 0; i < 10; i++) {
        rerender();
      }
      
      expect(result.current.values.isLoading).toBe(initialResult.values.isLoading);
      expect(result.current.values.data).toBe(initialResult.values.data);
    });
  });

  describe('Integration Tests', () => {
    it('should work correctly with real-world network map structure', () => {
      const realWorldData = {
        nodes: [
          { id: 'rule_001', type: 'rule', name: 'Fraud Detection Rule', status: 'active' },
          { id: 'rule_002', type: 'rule', name: 'Risk Assessment Rule', status: 'active' },
          { id: 'typology_001', type: 'typology', name: 'Money Laundering', status: 'active' },
        ],
        edges: [
          { from: 'rule_001', to: 'typology_001', weight: 0.8 },
          { from: 'rule_002', to: 'typology_001', weight: 0.6 },
        ],
        metadata: {
          totalRules: 2,
          totalTypologies: 1,
          lastUpdated: '2024-01-15T10:30:00Z',
        },
      };

      mockUseGetNetworkMapQuery.mockReturnValue({
        data: realWorldData,
        isLoading: false,
        isError: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      const { result } = renderHook(() => useViewNetworkMapController());
      
      expect(result.current.values.data).toEqual(realWorldData);
      expect(result.current.values.data.nodes).toHaveLength(3);
      expect(result.current.values.data.edges).toHaveLength(2);
      expect(result.current.values.data.metadata.totalRules).toBe(2);
    });

    it('should maintain consistent behavior across multiple hook instances', () => {
      const mockData = { nodes: [{ id: 1 }] };

      mockUseGetNetworkMapQuery.mockReturnValue({
        data: mockData,
        isLoading: false,
        isError: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      const { result: result1 } = renderHook(() => useViewNetworkMapController());
      const { result: result2 } = renderHook(() => useViewNetworkMapController());
      
      expect(result1.current.values.data).toEqual(result2.current.values.data);
      expect(result1.current.values.isLoading).toEqual(result2.current.values.isLoading);
    });

    it('should correctly expose RTK Query data without modification', () => {
      const originalData = {
        nodes: [{ id: 1, custom: 'property' }],
        customField: 'customValue',
      };

      mockUseGetNetworkMapQuery.mockReturnValue({
        data: originalData,
        isLoading: false,
        isError: false,
        error: undefined,
        refetch: jest.fn(),
      } as any);

      const { result } = renderHook(() => useViewNetworkMapController());
      
      expect(result.current.values.data).toEqual(originalData);
      expect(result.current.values.data).toHaveProperty('customField');
    });
  });

  describe('Hook Export', () => {
    it('should export the hook as default', () => {
      expect(useViewNetworkMapController).toBeDefined();
      expect(typeof useViewNetworkMapController).toBe('function');
    });
  });
});
