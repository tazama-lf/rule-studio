 
import { renderHook } from '@testing-library/react';
import { useNodeScope } from '../../../src/hooks/RuleBuilder/useNodeScope';
import type { Node, Edge } from '@xyflow/react';

describe('useNodeScope', () => {
  const createNode = (id: string, nodeType: string, params: Record<string, string> = {}): Node => ({
    id,
    type: 'custom',
    position: { x: 0, y: 0 },
    data: {
      nodeType,
      params,
    },
  });

  const createEdge = (source: string, target: string, sourceHandle?: string): Edge => ({
    id: `${source}-${target}`,
    source,
    target,
    sourceHandle,
  });

  describe('Initialization', () => {
    it('should return empty parentLoops when nodeId is null', () => {
      const { result } = renderHook(() =>
        useNodeScope({ nodeId: null, edges: [], nodes: [] })
      );

      expect(result.current.parentLoops).toEqual([]);
      expect(result.current.isInLoopScope).toBe(false);
    });

    it('should return empty parentLoops when no edges', () => {
      const { result } = renderHook(() =>
        useNodeScope({ nodeId: 'node-1', edges: [], nodes: [] })
      );

      expect(result.current.parentLoops).toEqual([]);
      expect(result.current.isInLoopScope).toBe(false);
    });

    it('should return empty parentLoops when node has no incoming edges', () => {
      const nodes = [createNode('node-1', 'SetVariable')];
      const edges: Edge[] = [];

      const { result } = renderHook(() =>
        useNodeScope({ nodeId: 'node-1', edges, nodes })
      );

      expect(result.current.parentLoops).toEqual([]);
      expect(result.current.isInLoopScope).toBe(false);
    });
  });

  describe('Single Loop Detection', () => {
    it('should detect parent loop when node is inside loop body', () => {
      const nodes = [
        createNode('loop-1', 'Loop', {
          itemVariable: 'item',
          indexVariable: 'i',
          arrayVariable: 'items',
          loopType: 'forEach',
        }),
        createNode('node-1', 'SetVariable'),
      ];
      const edges = [createEdge('loop-1', 'node-1', 'loopBody')];

      const { result } = renderHook(() =>
        useNodeScope({ nodeId: 'node-1', edges, nodes })
      );

      expect(result.current.parentLoops).toHaveLength(1);
      expect(result.current.isInLoopScope).toBe(true);
      expect(result.current.parentLoops[0]).toEqual({
        loopNode: nodes[0],
        itemVariable: 'item',
        indexVariable: 'i',
        arrayVariable: 'items',
        loopType: 'forEach',
      });
    });

    it('should use default variable names when not provided', () => {
      const nodes = [
        createNode('loop-1', 'Loop', {}),
        createNode('node-1', 'SetVariable'),
      ];
      const edges = [createEdge('loop-1', 'node-1', 'loopBody')];

      const { result } = renderHook(() =>
        useNodeScope({ nodeId: 'node-1', edges, nodes })
      );

      expect(result.current.parentLoops[0]).toEqual({
        loopNode: nodes[0],
        itemVariable: 'item',
        indexVariable: 'index',
        arrayVariable: 'items',
        loopType: 'forEach',
      });
    });

    it('should not detect loop when sourceHandle is not loopBody', () => {
      const nodes = [
        createNode('loop-1', 'Loop', { itemVariable: 'item' }),
        createNode('node-1', 'SetVariable'),
      ];
      const edges = [createEdge('loop-1', 'node-1', 'exit')];

      const { result } = renderHook(() =>
        useNodeScope({ nodeId: 'node-1', edges, nodes })
      );

      expect(result.current.parentLoops).toEqual([]);
      expect(result.current.isInLoopScope).toBe(false);
    });

    it('should not detect loop for non-Loop node types', () => {
      const nodes = [
        createNode('if-1', 'If', {}),
        createNode('node-1', 'SetVariable'),
      ];
      const edges = [createEdge('if-1', 'node-1', 'loopBody')];

      const { result } = renderHook(() =>
        useNodeScope({ nodeId: 'node-1', edges, nodes })
      );

      expect(result.current.parentLoops).toEqual([]);
      expect(result.current.isInLoopScope).toBe(false);
    });
  });

  describe('Nested Loops', () => {
    it('should detect multiple parent loops for nested structures', () => {
      const nodes = [
        createNode('outer-loop', 'Loop', {
          itemVariable: 'outerItem',
          indexVariable: 'i',
          arrayVariable: 'outerArray',
          loopType: 'forEach',
        }),
        createNode('inner-loop', 'Loop', {
          itemVariable: 'innerItem',
          indexVariable: 'j',
          arrayVariable: 'innerArray',
          loopType: 'forEach',
        }),
        createNode('node-1', 'SetVariable'),
      ];
      const edges = [
        createEdge('outer-loop', 'inner-loop', 'loopBody'),
        createEdge('inner-loop', 'node-1', 'loopBody'),
      ];

      const { result } = renderHook(() =>
        useNodeScope({ nodeId: 'node-1', edges, nodes })
      );

      expect(result.current.parentLoops).toHaveLength(2);
      expect(result.current.isInLoopScope).toBe(true);
      
      // Inner loop should be first (immediate parent)
      expect(result.current.parentLoops[0].itemVariable).toBe('innerItem');
      // Outer loop should be second
      expect(result.current.parentLoops[1].itemVariable).toBe('outerItem');
    });

    it('should detect deeply nested loops', () => {
      const nodes = [
        createNode('loop-1', 'Loop', { itemVariable: 'item1' }),
        createNode('loop-2', 'Loop', { itemVariable: 'item2' }),
        createNode('loop-3', 'Loop', { itemVariable: 'item3' }),
        createNode('node-1', 'SetVariable'),
      ];
      const edges = [
        createEdge('loop-1', 'loop-2', 'loopBody'),
        createEdge('loop-2', 'loop-3', 'loopBody'),
        createEdge('loop-3', 'node-1', 'loopBody'),
      ];

      const { result } = renderHook(() =>
        useNodeScope({ nodeId: 'node-1', edges, nodes })
      );

      expect(result.current.parentLoops).toHaveLength(3);
      expect(result.current.parentLoops.map(l => l.itemVariable)).toEqual(['item3', 'item2', 'item1']);
    });
  });

  describe('Complex Graph Structures', () => {
    it('should handle nodes with multiple incoming edges', () => {
      const nodes = [
        createNode('loop-1', 'Loop', { itemVariable: 'item' }),
        createNode('if-1', 'If'),
        createNode('node-1', 'SetVariable'),
      ];
      const edges = [
        createEdge('loop-1', 'if-1', 'loopBody'),
        createEdge('if-1', 'node-1', 'if'),
      ];

      const { result } = renderHook(() =>
        useNodeScope({ nodeId: 'node-1', edges, nodes })
      );

      expect(result.current.parentLoops).toHaveLength(1);
      expect(result.current.parentLoops[0].itemVariable).toBe('item');
    });

    it('should avoid infinite loops with circular references', () => {
      const nodes = [
        createNode('loop-1', 'Loop', { itemVariable: 'item' }),
        createNode('node-1', 'SetVariable'),
      ];
      // This would create a circular reference
      const edges = [
        createEdge('loop-1', 'node-1', 'loopBody'),
        createEdge('node-1', 'loop-1'),
      ];

      const { result } = renderHook(() =>
        useNodeScope({ nodeId: 'node-1', edges, nodes })
      );

      // Should still return a result without hanging
      expect(result.current.parentLoops).toHaveLength(1);
      expect(result.current.isInLoopScope).toBe(true);
    });

    it('should handle missing source nodes gracefully', () => {
      const nodes = [createNode('node-1', 'SetVariable')];
      const edges = [createEdge('missing-loop', 'node-1', 'loopBody')];

      const { result } = renderHook(() =>
        useNodeScope({ nodeId: 'node-1', edges, nodes })
      );

      expect(result.current.parentLoops).toEqual([]);
      expect(result.current.isInLoopScope).toBe(false);
    });
  });

  describe('useMemo Optimization', () => {
    it('should memoize result when inputs do not change', () => {
      const nodes = [
        createNode('loop-1', 'Loop', { itemVariable: 'item' }),
        createNode('node-1', 'SetVariable'),
      ];
      const edges = [createEdge('loop-1', 'node-1', 'loopBody')];

      const { result, rerender } = renderHook(
        ({ nodeId, e, n }) => useNodeScope({ nodeId, edges: e, nodes: n }),
        { initialProps: { nodeId: 'node-1', e: edges, n: nodes } }
      );

      const firstResult = result.current;

      rerender({ nodeId: 'node-1', e: edges, n: nodes });

      expect(result.current).toBe(firstResult);
    });

    it('should recompute when nodeId changes', () => {
      const nodes = [
        createNode('loop-1', 'Loop', { itemVariable: 'item' }),
        createNode('node-1', 'SetVariable'),
        createNode('node-2', 'SetVariable'),
      ];
      const edges = [
        createEdge('loop-1', 'node-1', 'loopBody'),
      ];

      const { result, rerender } = renderHook(
        ({ nodeId }) => useNodeScope({ nodeId, edges, nodes }),
        { initialProps: { nodeId: 'node-1' } }
      );

      expect(result.current.isInLoopScope).toBe(true);

      rerender({ nodeId: 'node-2' });

      expect(result.current.isInLoopScope).toBe(false);
    });

    it('should recompute when edges change', () => {
      const nodes = [
        createNode('loop-1', 'Loop', { itemVariable: 'item' }),
        createNode('node-1', 'SetVariable'),
      ];
      const edges1 = [createEdge('loop-1', 'node-1', 'loopBody')];
      const edges2: Edge[] = [];

      const { result, rerender } = renderHook(
        ({ e }) => useNodeScope({ nodeId: 'node-1', edges: e, nodes }),
        { initialProps: { e: edges1 } }
      );

      expect(result.current.isInLoopScope).toBe(true);

      rerender({ e: edges2 });

      expect(result.current.isInLoopScope).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty nodes array', () => {
      const edges = [createEdge('loop-1', 'node-1', 'loopBody')];

      const { result } = renderHook(() =>
        useNodeScope({ nodeId: 'node-1', edges, nodes: [] })
      );

      expect(result.current.parentLoops).toEqual([]);
      expect(result.current.isInLoopScope).toBe(false);
    });

    it('should handle node data without params', () => {
      const nodes = [
        {
          id: 'loop-1',
          type: 'custom',
          position: { x: 0, y: 0 },
          data: { nodeType: 'Loop' },
        } as Node,
        createNode('node-1', 'SetVariable'),
      ];
      const edges = [createEdge('loop-1', 'node-1', 'loopBody')];

      const { result } = renderHook(() =>
        useNodeScope({ nodeId: 'node-1', edges, nodes })
      );

      expect(result.current.parentLoops).toHaveLength(1);
      expect(result.current.parentLoops[0].itemVariable).toBe('item');
    });

    it('should handle node data without nodeType', () => {
      const nodes = [
        {
          id: 'node-1',
          type: 'custom',
          position: { x: 0, y: 0 },
          data: {},
        } as Node,
        createNode('node-2', 'SetVariable'),
      ];
      const edges = [createEdge('node-1', 'node-2', 'loopBody')];

      const { result } = renderHook(() =>
        useNodeScope({ nodeId: 'node-2', edges, nodes })
      );

      expect(result.current.parentLoops).toEqual([]);
      expect(result.current.isInLoopScope).toBe(false);
    });
  });
});
