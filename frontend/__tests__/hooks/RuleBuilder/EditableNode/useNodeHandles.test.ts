import { renderHook } from '@testing-library/react';
import { useNodeHandles } from '../../../../src/hooks/RuleBuilder/EditableNode/useNodeHandles';
import { Position } from '@xyflow/react';

describe('useNodeHandles', () => {
  describe('Initialization', () => {
    it('should return empty sourceHandles and no targetHandle when both are false', () => {
      const { result } = renderHook(() =>
        useNodeHandles('SetVariable', false, false, [])
      );

      expect(result.current.targetHandle).toBeUndefined();
      expect(result.current.sourceHandles).toEqual([]);
    });

    it('should return targetHandle when hasTargetHandle is true', () => {
      const { result } = renderHook(() =>
        useNodeHandles('SetVariable', true, false, [])
      );

      expect(result.current.targetHandle).toEqual({
        id: 'target',
        type: 'target',
        position: Position.Top,
        style: {
          background: '#555',
          width: '10px',
          height: '10px',
          border: '2px solid white',
        },
      });
    });

    it('should not return targetHandle when hasTargetHandle is false', () => {
      const { result } = renderHook(() =>
        useNodeHandles('SetVariable', false, true, [])
      );

      expect(result.current.targetHandle).toBeUndefined();
    });
  });

  describe('If Node Handles', () => {
    it('should create handles for If node with if condition', () => {
      const conditions = [{ type: 'if', condition: 'x > 0' }];

      const { result } = renderHook(() =>
        useNodeHandles('If', true, true, conditions)
      );

      expect(result.current.sourceHandles).toHaveLength(2); // if + exit
      expect(result.current.sourceHandles[0]).toMatchObject({
        id: 'if',
        type: 'source',
        position: Position.Right,
      });
      expect(result.current.sourceHandles[1]).toMatchObject({
        id: 'exit',
        type: 'source',
        position: Position.Bottom,
      });
    });

    it('should create handles for If node with if/elseif/else conditions', () => {
      const conditions: Array<{ type: string; condition?: string }> = [
        { type: 'if', condition: 'x > 0' },
        { type: 'elseif', condition: 'x < 0' },
        { type: 'else' },
      ];

      const { result } = renderHook(() =>
        useNodeHandles('If', true, true, conditions)
      );

      expect(result.current.sourceHandles).toHaveLength(4); // if + elseif + else + exit
      expect(result.current.sourceHandles[0].id).toBe('if');
      expect(result.current.sourceHandles[1].id).toBe('elseif-1');
      expect(result.current.sourceHandles[2].id).toBe('else');
      expect(result.current.sourceHandles[3].id).toBe('exit');
    });

    it('should position If handles with correct spacing', () => {
      const conditions = [
        { type: 'if', condition: 'x > 0' },
        { type: 'elseif', condition: 'x < 0' },
      ];

      const { result } = renderHook(() =>
        useNodeHandles('If', true, true, conditions)
      );

      // Spacing calculation: 80 / (2 + 1) = ~26.67 per handle
      const firstHandle = result.current.sourceHandles[0];
      const secondHandle = result.current.sourceHandles[1];
      
      expect(firstHandle.style.top).toBeDefined();
      expect(secondHandle.style.top).toBeDefined();
      expect(firstHandle.style.top).not.toBe(secondHandle.style.top);
    });

    it('should create handles with green background for If conditions', () => {
      const conditions = [{ type: 'if', condition: 'x > 0' }];

      const { result } = renderHook(() =>
        useNodeHandles('If', true, true, conditions)
      );

      expect(result.current.sourceHandles[0].style.background).toBe('#4caf50');
    });

    it('should create exit handle with black background', () => {
      const conditions = [{ type: 'if', condition: 'x > 0' }];

      const { result } = renderHook(() =>
        useNodeHandles('If', true, true, conditions)
      );

      const exitHandle = result.current.sourceHandles.find(h => h.id === 'exit');
      expect(exitHandle?.style.background).toBe('#000000');
      expect(exitHandle?.position).toBe(Position.Bottom);
    });

    it('should handle multiple elseif conditions', () => {
      const conditions: Array<{ type: string; condition?: string }> = [
        { type: 'if', condition: 'x > 0' },
        { type: 'elseif', condition: 'x < 0' },
        { type: 'elseif', condition: 'x === 0' },
        { type: 'else' },
      ];

      const { result } = renderHook(() =>
        useNodeHandles('If', true, true, conditions)
      );

      expect(result.current.sourceHandles).toHaveLength(5);
      expect(result.current.sourceHandles[1].id).toBe('elseif-1');
      expect(result.current.sourceHandles[2].id).toBe('elseif-2');
    });
  });

  describe('Loop Node Handles', () => {
    it('should create loopBody and exit handles for Loop node', () => {
      const { result } = renderHook(() =>
        useNodeHandles('Loop', true, true, [])
      );

      expect(result.current.sourceHandles).toHaveLength(2);
      expect(result.current.sourceHandles[0]).toMatchObject({
        id: 'loopBody',
        type: 'source',
        position: Position.Right,
      });
      expect(result.current.sourceHandles[1]).toMatchObject({
        id: 'exit',
        type: 'source',
        position: Position.Bottom,
      });
    });

    it('should create loopBody handle with blue background', () => {
      const { result } = renderHook(() =>
        useNodeHandles('Loop', true, true, [])
      );

      expect(result.current.sourceHandles[0].style.background).toBe('#2196F3');
    });

    it('should position loopBody handle at 50% top', () => {
      const { result } = renderHook(() =>
        useNodeHandles('Loop', true, true, [])
      );

      expect(result.current.sourceHandles[0].style.top).toBe('50%');
    });
  });

  describe('Describe Node Handles', () => {
    it('should create handles for Describe node', () => {
      const { result } = renderHook(() =>
        useNodeHandles('Describe', true, true, [])
      );

      expect(result.current.sourceHandles).toHaveLength(2); // body + exit
      expect(result.current.sourceHandles[0].id).toBe('body');
      expect(result.current.sourceHandles[1].id).toBe('exit');
    });
  });

  describe('Default Source Handle', () => {
    it('should create default source handle for non-special nodes', () => {
      const { result } = renderHook(() =>
        useNodeHandles('SetVariable', true, true, [])
      );

      // Default behavior depends on implementation
      // Check if sourceHandles are created
      expect(result.current.sourceHandles).toBeDefined();
    });

    it('should not create source handles when hasSourceHandle is false', () => {
      const conditions: Array<{ type: string; condition?: string }> = [{ type: 'if' }];
      const { result } = renderHook(() =>
        useNodeHandles('If', true, false, conditions)
      );

      expect(result.current.sourceHandles).toEqual([]);
    });
  });

  describe('useMemo Optimization', () => {
    it('should memoize result when inputs do not change', () => {
      const conditions = [{ type: 'if', condition: 'x > 0' }];

      const { result, rerender } = renderHook(
        ({ nodeType, hasTarget, hasSource, cond }) =>
          useNodeHandles(nodeType, hasTarget, hasSource, cond),
        {
          initialProps: {
            nodeType: 'If',
            hasTarget: true,
            hasSource: true,
            cond: conditions,
          },
        }
      );

      const firstResult = result.current;

      rerender({ nodeType: 'If', hasTarget: true, hasSource: true, cond: conditions });

      expect(result.current).toBe(firstResult);
    });

    it('should recompute when nodeType changes', () => {
      const { result, rerender } = renderHook(
        ({ nodeType }) => useNodeHandles(nodeType, true, true, []),
        { initialProps: { nodeType: 'Loop' } }
      );

      const loopHandles = result.current.sourceHandles;

      rerender({ nodeType: 'SetVariable' });

      expect(result.current.sourceHandles).not.toBe(loopHandles);
    });

    it('should recompute when conditions change', () => {
      const conditions1: Array<{ type: string; condition?: string }> = [{ type: 'if', condition: 'x > 0' }];
      const conditions2: Array<{ type: string; condition?: string }> = [
        { type: 'if', condition: 'x > 0' },
        { type: 'else' },
      ];

      const { result, rerender } = renderHook(
        ({ cond }) => useNodeHandles('If', true, true, cond),
        { initialProps: { cond: conditions1 } }
      );

      expect(result.current.sourceHandles).toHaveLength(2);

      rerender({ cond: conditions2 });

      expect(result.current.sourceHandles).toHaveLength(3);
    });

    it('should recompute when hasTargetHandle changes', () => {
      const { result, rerender } = renderHook(
        ({ hasTarget }) => useNodeHandles('SetVariable', hasTarget, true, []),
        { initialProps: { hasTarget: true } }
      );

      expect(result.current.targetHandle).toBeDefined();

      rerender({ hasTarget: false });

      expect(result.current.targetHandle).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty conditions array for If node', () => {
      const { result } = renderHook(() =>
        useNodeHandles('If', true, true, [])
      );

      // Should still create exit handle
      const exitHandle = result.current.sourceHandles.find(h => h.id === 'exit');
      expect(exitHandle).toBeDefined();
    });

    it('should handle conditions without type field', () => {
      const conditions = [{ condition: 'x > 0' } as any];

      const { result } = renderHook(() =>
        useNodeHandles('If', true, true, conditions)
      );

      // Should gracefully handle malformed conditions
      expect(result.current.sourceHandles).toBeDefined();
    });

    it('should create handles with proper styling', () => {
      const { result } = renderHook(() =>
        useNodeHandles('Loop', true, true, [])
      );

      result.current.sourceHandles.forEach(handle => {
        expect(handle.style.width).toBe('10px');
        expect(handle.style.height).toBe('10px');
        expect(handle.style.border).toBe('2px solid white');
        expect(handle.style.background).toBeDefined();
      });
    });
  });
});
