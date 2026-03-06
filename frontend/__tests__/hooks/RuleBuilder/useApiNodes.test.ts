import { renderHook } from '@testing-library/react';
import { useApiNodes } from '../../../src/hooks/RuleBuilder/useApiNodes';
import * as apiNodeMapper from '../../../src/utils/Flow/apiNodeMapper';
import type { ApiNode } from '../../../src/utils/Flow/apiNodeMapper';

jest.mock('../../../src/utils/Flow/apiNodeMapper');

const mockedApiNodeMapper = apiNodeMapper as jest.Mocked<typeof apiNodeMapper>;

describe('useApiNodes', () => {
  const mockApiNodes: ApiNode[] = [
    {
      id: 1,
      name: 'Test Node 1',
      description: 'Test description 1',
      nodeType: 'TestNode1',
      category: 'test',
      params: {},
    },
    {
      id: 2,
      name: 'Test Node 2',
      description: 'Test description 2',
      nodeType: 'TestNode2',
      category: 'test',
      params: {},
    },
  ] as any;

  const mockNodeTemplates = [
    { id: '1', name: 'Test Node 1', nodeType: 'TestNode1' },
    { id: '2', name: 'Test Node 2', nodeType: 'TestNode2' },
  ];

  const mockNodeTemplatesMap = {
    TestNode1: { id: '1', name: 'Test Node 1', nodeType: 'TestNode1' },
    TestNode2: { id: '2', name: 'Test Node 2', nodeType: 'TestNode2' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiNodeMapper.mapApiNodesToArray.mockReturnValue(mockNodeTemplates as any);
    mockedApiNodeMapper.mapApiNodesToTemplates.mockReturnValue(mockNodeTemplatesMap as any);
  });

  describe('Initialization', () => {
    it('should return empty arrays when no apiNodes provided', () => {
      const { result } = renderHook(() =>
        useApiNodes({ apiNodes: [] })
      );

      expect(result.current.nodeTemplates).toEqual([]);
      expect(result.current.nodeTemplatesMap).toEqual({});
      expect(result.current.hasNodes).toBe(false);
    });

    it('should map apiNodes to templates', () => {
      const { result } = renderHook(() =>
        useApiNodes({ apiNodes: mockApiNodes })
      );

      expect(mockedApiNodeMapper.mapApiNodesToArray).toHaveBeenCalledWith(mockApiNodes);
      expect(result.current.nodeTemplates).toEqual(mockNodeTemplates);
      expect(result.current.hasNodes).toBe(true);
    });

    it('should map apiNodes to templates map', () => {
      const { result } = renderHook(() =>
        useApiNodes({ apiNodes: mockApiNodes })
      );

      expect(mockedApiNodeMapper.mapApiNodesToTemplates).toHaveBeenCalledWith(mockApiNodes);
      expect(result.current.nodeTemplatesMap).toEqual(mockNodeTemplatesMap);
    });

    it('should handle isLoading state', () => {
      const { result } = renderHook(() =>
        useApiNodes({ apiNodes: [], isLoading: true })
      );

      expect(result.current.isLoading).toBe(true);
    });

    it('should handle error state', () => {
      const error = new Error('API error');
      const { result } = renderHook(() =>
        useApiNodes({ apiNodes: [], error })
      );

      expect(result.current.error).toBe(error);
    });
  });

  describe('useMemo Optimization', () => {
    it('should memoize nodeTemplates when apiNodes do not change', () => {
      const { result, rerender } = renderHook(
        ({ nodes }) => useApiNodes({ apiNodes: nodes }),
        { initialProps: { nodes: mockApiNodes } }
      );

      const firstTemplates = result.current.nodeTemplates;

      rerender({ nodes: mockApiNodes });

      expect(result.current.nodeTemplates).toBe(firstTemplates);
      expect(mockedApiNodeMapper.mapApiNodesToArray).toHaveBeenCalledTimes(1);
    });

    it('should recompute when apiNodes change', () => {
      const { result, rerender } = renderHook(
        ({ nodes }) => useApiNodes({ apiNodes: nodes }),
        { initialProps: { nodes: mockApiNodes } }
      );

      const newApiNodes: ApiNode[] = [
        {
          id: 3,
          name: 'Test Node 3',
          description: 'Test description 3',
          nodeType: 'TestNode3',
          category: 'test',
          params: {},
        },
      ] as any;

      rerender({ nodes: newApiNodes });

      expect(mockedApiNodeMapper.mapApiNodesToArray).toHaveBeenCalledTimes(2);
      expect(mockedApiNodeMapper.mapApiNodesToArray).toHaveBeenLastCalledWith(newApiNodes);
    });

    it('should memoize nodeTemplatesMap when apiNodes do not change', () => {
      const { result, rerender } = renderHook(
        ({ nodes }) => useApiNodes({ apiNodes: nodes }),
        { initialProps: { nodes: mockApiNodes } }
      );

      const firstMap = result.current.nodeTemplatesMap;

      rerender({ nodes: mockApiNodes });

      expect(result.current.nodeTemplatesMap).toBe(firstMap);
      expect(mockedApiNodeMapper.mapApiNodesToTemplates).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined apiNodes', () => {
      const { result } = renderHook(() =>
        useApiNodes({ apiNodes: undefined })
      );

      expect(result.current.nodeTemplates).toEqual([]);
      expect(result.current.nodeTemplatesMap).toEqual({});
      expect(result.current.hasNodes).toBe(false);
    });

    it('should return hasNodes as true when templates exist', () => {
      const { result } = renderHook(() =>
        useApiNodes({ apiNodes: mockApiNodes })
      );

      expect(result.current.hasNodes).toBe(true);
    });

    it('should return hasNodes as false when no templates', () => {
      mockedApiNodeMapper.mapApiNodesToArray.mockReturnValue([]);

      const { result } = renderHook(() =>
        useApiNodes({ apiNodes: mockApiNodes })
      );

      expect(result.current.hasNodes).toBe(false);
    });

    it('should default isLoading to false when not provided', () => {
      const { result } = renderHook(() =>
        useApiNodes({ apiNodes: [] })
      );

      expect(result.current.isLoading).toBe(false);
    });
  });
});
