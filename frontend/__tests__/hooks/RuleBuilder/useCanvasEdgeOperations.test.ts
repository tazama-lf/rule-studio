import { renderHook, act } from '@testing-library/react';
import { useCanvasEdgeOperations } from '../../../src/hooks/RuleBuilder/useCanvasEdgeOperations';
import * as helpers from '../../../src/utils/Common/helpers';
import type { Edge, Connection } from '@xyflow/react';

jest.mock('../../../src/utils/Common/helpers');

const mockedHelpers = helpers as jest.Mocked<typeof helpers>;

describe('useCanvasEdgeOperations', () => {
  let mockSetEdges: jest.Mock;
  let mockSaveHistory: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetEdges = jest.fn();
    mockSaveHistory = jest.fn();
    mockedHelpers.getLabelForHandle.mockImplementation((handle: string) => `Label-${handle}`);
    mockedHelpers.getColorForHandle.mockImplementation((handle: string) => `#${handle}`);
  });

  describe('Initialization', () => {
    it('should return all expected functions', () => {
      const { result } = renderHook(() =>
        useCanvasEdgeOperations({
          setEdges: mockSetEdges,
          saveHistory: mockSaveHistory,
        })
      );

      expect(result.current).toBeDefined();
      expect(typeof result.current.onConnect).toBe('function');
      expect(typeof result.current.isValidConnection).toBe('function');
      expect(typeof result.current.getEdgeStyle).toBe('function');
    });
  });

  describe('onConnect', () => {
    it('should save history before connecting', () => {
      const { result } = renderHook(() =>
        useCanvasEdgeOperations({
          setEdges: mockSetEdges,
          saveHistory: mockSaveHistory,
        })
      );

      const connection: Connection = {
        source: 'node-1',
        target: 'node-2',
        sourceHandle: null,
        targetHandle: null,
      };

      act(() => {
        result.current.onConnect(connection);
      });

      expect(mockSaveHistory).toHaveBeenCalled();
    });

    it('should prevent multiple edges from single source when no handles', () => {
      mockSetEdges.mockImplementation((updater) => {
        const existingEdges: Edge[] = [
          {
            id: 'e1',
            source: 'node-1',
            target: 'node-3',
          } as Edge,
        ];
        updater(existingEdges);
      });

      const { result } = renderHook(() =>
        useCanvasEdgeOperations({
          setEdges: mockSetEdges,
          saveHistory: mockSaveHistory,
        })
      );

      const connection: Connection = {
        source: 'node-1',
        target: 'node-2',
        sourceHandle: null,
        targetHandle: null,
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      act(() => {
        result.current.onConnect(connection);
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith('Each node can only have one outgoing connection');
      consoleWarnSpy.mockRestore();
    });

    it('should allow edge when source has no existing edge', () => {
      mockSetEdges.mockImplementation((updater) => {
        const existingEdges: Edge[] = [];
        const result = updater(existingEdges);
        expect(result).toHaveLength(1);
      });

      const { result } = renderHook(() =>
        useCanvasEdgeOperations({
          setEdges: mockSetEdges,
          saveHistory: mockSaveHistory,
        })
      );

      const connection: Connection = {
        source: 'node-1',
        target: 'node-2',
        sourceHandle: null,
        targetHandle: null,
      };

      act(() => {
        result.current.onConnect(connection);
      });

      expect(mockSetEdges).toHaveBeenCalled();
    });

    it('should prevent duplicate handle connections', () => {
      mockSetEdges.mockImplementation((updater) => {
        const existingEdges: Edge[] = [
          {
            id: 'e1',
            source: 'node-1',
            target: 'node-3',
            sourceHandle: 'handle-a',
          } as Edge,
        ];
        updater(existingEdges);
      });

      const { result } = renderHook(() =>
        useCanvasEdgeOperations({
          setEdges: mockSetEdges,
          saveHistory: mockSaveHistory,
        })
      );

      const connection: Connection = {
        source: 'node-1',
        target: 'node-2',
        sourceHandle: 'handle-a',
        targetHandle: null,
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      act(() => {
        result.current.onConnect(connection);
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith('This handle already has a connection');
      consoleWarnSpy.mockRestore();
    });

    it('should allow multiple edges from different handles', () => {
      mockSetEdges.mockImplementation((updater) => {
        const existingEdges: Edge[] = [
          {
            id: 'e1',
            source: 'node-1',
            target: 'node-3',
            sourceHandle: 'handle-a',
          } as Edge,
        ];
        const result = updater(existingEdges);
        expect(result.length).toBeGreaterThan(1);
      });

      const { result } = renderHook(() =>
        useCanvasEdgeOperations({
          setEdges: mockSetEdges,
          saveHistory: mockSaveHistory,
        })
      );

      const connection: Connection = {
        source: 'node-1',
        target: 'node-2',
        sourceHandle: 'handle-b',
        targetHandle: null,
      };

      act(() => {
        result.current.onConnect(connection);
      });

      expect(mockSetEdges).toHaveBeenCalled();
    });

    it('should add label when sourceHandle is present', () => {
      mockSetEdges.mockImplementation((updater) => {
        const existingEdges: Edge[] = [];
        const result = updater(existingEdges);
        expect(result[0]).toHaveProperty('label', 'Label-handle-a');
      });

      const { result } = renderHook(() =>
        useCanvasEdgeOperations({
          setEdges: mockSetEdges,
          saveHistory: mockSaveHistory,
        })
      );

      const connection: Connection = {
        source: 'node-1',
        target: 'node-2',
        sourceHandle: 'handle-a',
        targetHandle: null,
      };

      act(() => {
        result.current.onConnect(connection);
      });

      expect(mockedHelpers.getLabelForHandle).toHaveBeenCalledWith('handle-a');
    });

    it('should add style when sourceHandle is present', () => {
      mockSetEdges.mockImplementation((updater) => {
        const existingEdges: Edge[] = [];
        const result = updater(existingEdges);
        expect(result[0]).toHaveProperty('style');
        expect(result[0].style).toEqual({
          stroke: '#handle-a',
          strokeWidth: 2,
        });
      });

      const { result } = renderHook(() =>
        useCanvasEdgeOperations({
          setEdges: mockSetEdges,
          saveHistory: mockSaveHistory,
        })
      );

      const connection: Connection = {
        source: 'node-1',
        target: 'node-2',
        sourceHandle: 'handle-a',
        targetHandle: null,
      };

      act(() => {
        result.current.onConnect(connection);
      });

      expect(mockedHelpers.getColorForHandle).toHaveBeenCalledWith('handle-a');
    });

    it('should not add label or style when no sourceHandle', () => {
      mockSetEdges.mockImplementation((updater) => {
        const existingEdges: Edge[] = [];
        const result = updater(existingEdges);
        expect(result[0].label).toBeUndefined();
        expect(result[0].style).toBeUndefined();
      });

      const { result } = renderHook(() =>
        useCanvasEdgeOperations({
          setEdges: mockSetEdges,
          saveHistory: mockSaveHistory,
        })
      );

      const connection: Connection = {
        source: 'node-1',
        target: 'node-2',
        sourceHandle: null,
        targetHandle: null,
      };

      act(() => {
        result.current.onConnect(connection);
      });

      expect(mockedHelpers.getLabelForHandle).not.toHaveBeenCalled();
      expect(mockedHelpers.getColorForHandle).not.toHaveBeenCalled();
    });
  });

  describe('isValidConnection', () => {
    it('should return true for different source and target', () => {
      const { result } = renderHook(() =>
        useCanvasEdgeOperations({
          setEdges: mockSetEdges,
          saveHistory: mockSaveHistory,
        })
      );

      const connection: Connection = {
        source: 'node-1',
        target: 'node-2',
        sourceHandle: null,
        targetHandle: null,
      };

      const isValid = result.current.isValidConnection(connection);
      expect(isValid).toBe(true);
    });

    it('should return false when source equals target', () => {
      const { result } = renderHook(() =>
        useCanvasEdgeOperations({
          setEdges: mockSetEdges,
          saveHistory: mockSaveHistory,
        })
      );

      const connection: Connection = {
        source: 'node-1',
        target: 'node-1',
        sourceHandle: null,
        targetHandle: null,
      };

      const isValid = result.current.isValidConnection(connection);
      expect(isValid).toBe(false);
    });
  });

  describe('getEdgeStyle', () => {
    it('should return style object for valid handle', () => {
      const { result } = renderHook(() =>
        useCanvasEdgeOperations({
          setEdges: mockSetEdges,
          saveHistory: mockSaveHistory,
        })
      );

      const style = result.current.getEdgeStyle('handle-a');

      expect(style).toEqual({
        stroke: '#handle-a',
        strokeWidth: 2,
      });
      expect(mockedHelpers.getColorForHandle).toHaveBeenCalledWith('handle-a');
    });

    it('should return undefined for null handle', () => {
      const { result } = renderHook(() =>
        useCanvasEdgeOperations({
          setEdges: mockSetEdges,
          saveHistory: mockSaveHistory,
        })
      );

      const style = result.current.getEdgeStyle(null);

      expect(style).toBeUndefined();
      expect(mockedHelpers.getColorForHandle).not.toHaveBeenCalled();
    });
  });

  describe('Callback Stability', () => {
    it('should maintain onConnect function stability', () => {
      const { result, rerender } = renderHook(() =>
        useCanvasEdgeOperations({
          setEdges: mockSetEdges,
          saveHistory: mockSaveHistory,
        })
      );

      const firstOnConnect = result.current.onConnect;
      rerender();

      expect(result.current.onConnect).toBe(firstOnConnect);
    });

    it('should maintain isValidConnection function stability', () => {
      const { result, rerender } = renderHook(() =>
        useCanvasEdgeOperations({
          setEdges: mockSetEdges,
          saveHistory: mockSaveHistory,
        })
      );

      const firstIsValid = result.current.isValidConnection;
      rerender();

      expect(result.current.isValidConnection).toBe(firstIsValid);
    });

    it('should maintain getEdgeStyle function stability', () => {
      const { result, rerender } = renderHook(() =>
        useCanvasEdgeOperations({
          setEdges: mockSetEdges,
          saveHistory: mockSaveHistory,
        })
      );

      const firstGetStyle = result.current.getEdgeStyle;
      rerender();

      expect(result.current.getEdgeStyle).toBe(firstGetStyle);
    });
  });

  describe('Edge Cases', () => {
    it('should handle connection with all handles specified', () => {
      mockSetEdges.mockImplementation((updater) => {
        const existingEdges: Edge[] = [];
        const result = updater(existingEdges);
        expect(result[0]).toMatchObject({
          source: 'node-1',
          target: 'node-2',
          sourceHandle: 'out-1',
          targetHandle: 'in-1',
        });
      });

      const { result } = renderHook(() =>
        useCanvasEdgeOperations({
          setEdges: mockSetEdges,
          saveHistory: mockSaveHistory,
        })
      );

      const connection: Connection = {
        source: 'node-1',
        target: 'node-2',
        sourceHandle: 'out-1',
        targetHandle: 'in-1',
      };

      act(() => {
        result.current.onConnect(connection);
      });

      expect(mockSetEdges).toHaveBeenCalled();
    });

    it('should handle empty string handle', () => {
      const { result } = renderHook(() =>
        useCanvasEdgeOperations({
          setEdges: mockSetEdges,
          saveHistory: mockSaveHistory,
        })
      );

      const style = result.current.getEdgeStyle('');

      expect(style).toBeUndefined();
    });
  });
});
