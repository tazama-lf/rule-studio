import { renderHook, act } from '@testing-library/react';
import { useNestedCanvasManager } from '../../../src/hooks/RuleBuilder/useNestedCanvasManager';
import type { Node, Edge } from '@xyflow/react';

describe('useNestedCanvasManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      expect(result.current.activeNestedCanvas).toBeNull();
      expect(result.current.activeNestedCanvasLabel).toBe('Handle Transaction');
      expect(result.current.nestedCanvasData).toEqual({});
      expect(result.current.isTransitioning).toBe(false);
    });

    it('should provide all expected functions', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      expect(typeof result.current.setActiveNestedCanvas).toBe('function');
      expect(typeof result.current.setActiveNestedCanvasLabel).toBe('function');
      expect(typeof result.current.setNestedCanvasData).toBe('function');
      expect(typeof result.current.handleNestedCanvasBack).toBe('function');
      expect(typeof result.current.handleNestedCanvasSave).toBe('function');
      expect(typeof result.current.openNestedCanvas).toBe('function');
    });
  });

  describe('setActiveNestedCanvas', () => {
    it('should set active nested canvas', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      act(() => {
        result.current.setActiveNestedCanvas('canvas-1');
      });

      expect(result.current.activeNestedCanvas).toBe('canvas-1');
    });

    it('should clear active nested canvas', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      act(() => {
        result.current.setActiveNestedCanvas('canvas-1');
      });

      act(() => {
        result.current.setActiveNestedCanvas(null);
      });

      expect(result.current.activeNestedCanvas).toBeNull();
    });
  });

  describe('setActiveNestedCanvasLabel', () => {
    it('should set active nested canvas label', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      act(() => {
        result.current.setActiveNestedCanvasLabel('Custom Label');
      });

      expect(result.current.activeNestedCanvasLabel).toBe('Custom Label');
    });
  });

  describe('openNestedCanvas', () => {
    it('should open nested canvas with transition', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      act(() => {
        result.current.openNestedCanvas('node-1', 'My Canvas');
      });

      expect(result.current.isTransitioning).toBe(true);

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.activeNestedCanvas).toBe('node-1');
      expect(result.current.activeNestedCanvasLabel).toBe('My Canvas');
      expect(result.current.isTransitioning).toBe(false);
    });

    it('should handle multiple open calls', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      act(() => {
        result.current.openNestedCanvas('node-1', 'Canvas 1');
      });

      act(() => {
        jest.runAllTimers();
      });

      act(() => {
        result.current.openNestedCanvas('node-2', 'Canvas 2');
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.activeNestedCanvas).toBe('node-2');
      expect(result.current.activeNestedCanvasLabel).toBe('Canvas 2');
    });
  });

  describe('handleNestedCanvasBack', () => {
    it('should close nested canvas with transition', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      act(() => {
        result.current.setActiveNestedCanvas('node-1');
      });

      act(() => {
        result.current.handleNestedCanvasBack();
      });

      expect(result.current.isTransitioning).toBe(true);

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.activeNestedCanvas).toBeNull();
      expect(result.current.isTransitioning).toBe(false);
    });

    it('should handle back from null canvas', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      expect(result.current.activeNestedCanvas).toBeNull();

      act(() => {
        result.current.handleNestedCanvasBack();
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.activeNestedCanvas).toBeNull();
    });
  });

  describe('handleNestedCanvasSave', () => {
    it('should save nested canvas data', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      const nodes: Node[] = [
        {
          id: 'nested-1',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Nested Node' },
        },
      ];

      const edges: Edge[] = [
        {
          id: 'e1',
          source: 'nested-1',
          target: 'nested-2',
        } as Edge,
      ];

      act(() => {
        result.current.handleNestedCanvasSave('node-1', nodes, edges);
      });

      expect(result.current.nestedCanvasData).toHaveProperty('node-1');
      expect(result.current.nestedCanvasData['node-1'].nodes).toEqual(nodes);
      expect(result.current.nestedCanvasData['node-1'].edges).toEqual(edges);
    });

    it('should update existing nested canvas data', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      const nodes1: Node[] = [
        {
          id: 'node-1',
          type: 'editableNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node 1' },
        },
      ];

      const nodes2: Node[] = [
        {
          id: 'node-2',
          type: 'editableNode',
          position: { x: 100, y: 100 },
          data: { label: 'Node 2' },
        },
      ];

      act(() => {
        result.current.handleNestedCanvasSave('canvas-1', nodes1, []);
      });

      act(() => {
        result.current.handleNestedCanvasSave('canvas-1', nodes2, []);
      });

      expect(result.current.nestedCanvasData['canvas-1'].nodes).toEqual(nodes2);
    });

    it('should handle multiple nested canvases', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      const nodes1: Node[] = [{ id: '1', type: 'node', position: { x: 0, y: 0 }, data: {} }];
      const nodes2: Node[] = [{ id: '2', type: 'node', position: { x: 0, y: 0 }, data: {} }];

      act(() => {
        result.current.handleNestedCanvasSave('canvas-1', nodes1, []);
        result.current.handleNestedCanvasSave('canvas-2', nodes2, []);
      });

      expect(result.current.nestedCanvasData).toHaveProperty('canvas-1');
      expect(result.current.nestedCanvasData).toHaveProperty('canvas-2');
      expect(Object.keys(result.current.nestedCanvasData)).toHaveLength(2);
    });
  });

  describe('setNestedCanvasData', () => {
    it('should set nested canvas data directly', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      const data = {
        'canvas-1': {
          nodes: [{ id: '1', type: 'node', position: { x: 0, y: 0 }, data: {} }],
          edges: [] as Edge[],
        },
      };

      act(() => {
        result.current.setNestedCanvasData(data);
      });

      expect(result.current.nestedCanvasData).toEqual(data);
    });

    it('should accept updater function', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      const initialData = {
        'canvas-1': {
          nodes: [{ id: '1', type: 'node', position: { x: 0, y: 0 }, data: {} }],
          edges: [] as Edge[],
        },
      };

      act(() => {
        result.current.setNestedCanvasData(initialData);
      });

      act(() => {
        result.current.setNestedCanvasData((prev) => ({
          ...prev,
          'canvas-2': {
            nodes: [{ id: '2', type: 'node', position: { x: 100, y: 100 }, data: {} }],
            edges: [],
          },
        }));
      });

      expect(Object.keys(result.current.nestedCanvasData)).toHaveLength(2);
      expect(result.current.nestedCanvasData).toHaveProperty('canvas-1');
      expect(result.current.nestedCanvasData).toHaveProperty('canvas-2');
    });
  });

  describe('Workflow Integration', () => {
    it('should handle complete open-save-back workflow', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      // Open nested canvas
      act(() => {
        result.current.openNestedCanvas('node-1', 'My Canvas');
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.activeNestedCanvas).toBe('node-1');
      expect(result.current.activeNestedCanvasLabel).toBe('My Canvas');

      // Save data
      const nodes: Node[] = [
        { id: 'n1', type: 'node', position: { x: 0, y: 0 }, data: {} },
      ];
      const edges: Edge[] = [];

      act(() => {
        result.current.handleNestedCanvasSave('node-1', nodes, edges);
      });

      expect(result.current.nestedCanvasData['node-1']).toEqual({ nodes, edges });

      // Go back
      act(() => {
        result.current.handleNestedCanvasBack();
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.activeNestedCanvas).toBeNull();

      // Data should still be saved
      expect(result.current.nestedCanvasData['node-1']).toEqual({ nodes, edges });
    });

    it('should handle re-opening saved canvas', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      const nodes: Node[] = [
        { id: 'n1', type: 'node', position: { x: 0, y: 0 }, data: {} },
      ];

      act(() => {
        result.current.handleNestedCanvasSave('node-1', nodes, []);
      });

      act(() => {
        result.current.openNestedCanvas('node-1', 'Existing Canvas');
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.activeNestedCanvas).toBe('node-1');
      expect(result.current.nestedCanvasData['node-1'].nodes).toEqual(nodes);
    });
  });

  describe('Transition States', () => {
    it('should set isTransitioning during open', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      act(() => {
        result.current.openNestedCanvas('node-1', 'Canvas');
      });

      expect(result.current.isTransitioning).toBe(true);
    });

    it('should clear isTransitioning after open', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      act(() => {
        result.current.openNestedCanvas('node-1', 'Canvas');
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.isTransitioning).toBe(false);
    });

    it('should set isTransitioning during back', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      act(() => {
        result.current.setActiveNestedCanvas('node-1');
      });

      act(() => {
        result.current.handleNestedCanvasBack();
      });

      expect(result.current.isTransitioning).toBe(true);
    });

    it('should clear isTransitioning after back', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      act(() => {
        result.current.setActiveNestedCanvas('node-1');
      });

      act(() => {
        result.current.handleNestedCanvasBack();
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.isTransitioning).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty nodes and edges', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      act(() => {
        result.current.handleNestedCanvasSave('canvas-1', [], []);
      });

      expect(result.current.nestedCanvasData['canvas-1']).toEqual({
        nodes: [],
        edges: [],
      });
    });

    it('should handle rapid transitions', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      act(() => {
        result.current.openNestedCanvas('node-1', 'Canvas 1');
        result.current.handleNestedCanvasBack();
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.activeNestedCanvas).toBeNull();
    });

    it('should handle save without opening', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      const nodes: Node[] = [
        { id: '1', type: 'node', position: { x: 0, y: 0 }, data: {} },
      ];

      act(() => {
        result.current.handleNestedCanvasSave('canvas-1', nodes, []);
      });

      expect(result.current.activeNestedCanvas).toBeNull();
      expect(result.current.nestedCanvasData['canvas-1']).toEqual({
        nodes,
        edges: [],
      });
    });

    it('should handle setNestedCanvasData with empty object', () => {
      const { result } = renderHook(() => useNestedCanvasManager());

      act(() => {
        result.current.handleNestedCanvasSave('canvas-1', [], []);
      });

      act(() => {
        result.current.setNestedCanvasData({});
      });

      expect(result.current.nestedCanvasData).toEqual({});
    });
  });

  describe('Callback Stability', () => {
    it('should maintain setNestedCanvasData stability', () => {
      const { result, rerender } = renderHook(() => useNestedCanvasManager());

      const first = result.current.setNestedCanvasData;
      rerender();

      expect(result.current.setNestedCanvasData).toBe(first);
    });

    it('should maintain handleNestedCanvasBack stability', () => {
      const { result, rerender } = renderHook(() => useNestedCanvasManager());

      const first = result.current.handleNestedCanvasBack;
      rerender();

      expect(result.current.handleNestedCanvasBack).toBe(first);
    });

    it('should maintain handleNestedCanvasSave stability', () => {
      const { result, rerender } = renderHook(() => useNestedCanvasManager());

      const first = result.current.handleNestedCanvasSave;
      rerender();

      expect(result.current.handleNestedCanvasSave).toBe(first);
    });

    it('should maintain openNestedCanvas stability', () => {
      const { result, rerender } = renderHook(() => useNestedCanvasManager());

      const first = result.current.openNestedCanvas;
      rerender();

      expect(result.current.openNestedCanvas).toBe(first);
    });
  });
});
