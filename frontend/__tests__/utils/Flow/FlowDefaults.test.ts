import {
  resetCounters,
  generateNodeId,
  generateNestedNodeId,
  generateEdgeId,
  setCounters,
  setNestedNodeCounter,
  extractCountersFromFlow,
} from '../../../src/utils/Flow/FlowDefaults';
import type { Node, Edge } from '@xyflow/react';

describe('FlowDefaults (utils/Flow/FlowDefaults)', () => {
  beforeEach(() => {
    resetCounters();
  });

  // ─── generateNodeId ──────────────────────────────────────────────────────────

  describe('generateNodeId', () => {
    it('should return "node-1" on first call after reset', () => {
      expect(generateNodeId()).toBe('node-1');
    });

    it('should increment on each call', () => {
      expect(generateNodeId()).toBe('node-1');
      expect(generateNodeId()).toBe('node-2');
      expect(generateNodeId()).toBe('node-3');
    });

    it('should return a string', () => {
      expect(typeof generateNodeId()).toBe('string');
    });
  });

  // ─── generateNestedNodeId ────────────────────────────────────────────────────

  describe('generateNestedNodeId', () => {
    it('should return "nested-node-1" on first call after reset', () => {
      expect(generateNestedNodeId()).toBe('nested-node-1');
    });

    it('should increment independently from node counter', () => {
      generateNodeId();
      generateNodeId();
      expect(generateNestedNodeId()).toBe('nested-node-1');
    });

    it('should increment on each call', () => {
      expect(generateNestedNodeId()).toBe('nested-node-1');
      expect(generateNestedNodeId()).toBe('nested-node-2');
    });
  });

  // ─── generateEdgeId ──────────────────────────────────────────────────────────

  describe('generateEdgeId', () => {
    it('should return "edge-1" on first call after reset', () => {
      expect(generateEdgeId()).toBe('edge-1');
    });

    it('should increment on each call', () => {
      expect(generateEdgeId()).toBe('edge-1');
      expect(generateEdgeId()).toBe('edge-2');
    });

    it('should be independent of node counter', () => {
      generateNodeId();
      generateNodeId();
      expect(generateEdgeId()).toBe('edge-1');
    });
  });

  // ─── resetCounters ───────────────────────────────────────────────────────────

  describe('resetCounters', () => {
    it('should reset all counters to 0', () => {
      generateNodeId();
      generateNodeId();
      generateEdgeId();
      generateNestedNodeId();
      resetCounters();
      expect(generateNodeId()).toBe('node-1');
      expect(generateEdgeId()).toBe('edge-1');
    });

    it('should reset nested counter to 0', () => {
      generateNestedNodeId();
      generateNestedNodeId();
      resetCounters();
      expect(generateNestedNodeId()).toBe('nested-node-1');
    });
  });

  // ─── setCounters ─────────────────────────────────────────────────────────────

  describe('setCounters', () => {
    it('should set node counter so next id continues from given value', () => {
      setCounters(5, 0, 0);
      expect(generateNodeId()).toBe('node-6');
    });

    it('should set edge counter so next id continues from given value', () => {
      setCounters(0, 10, 0);
      expect(generateEdgeId()).toBe('edge-11');
    });

    it('should set nested counter so next id continues from given value', () => {
      setCounters(0, 0, 3);
      expect(generateNestedNodeId()).toBe('nested-node-4');
    });

    it('should set all three counters independently', () => {
      setCounters(2, 4, 6);
      expect(generateNodeId()).toBe('node-3');
      expect(generateEdgeId()).toBe('edge-5');
      expect(generateNestedNodeId()).toBe('nested-node-7');
    });
  });

  // ─── setNestedNodeCounter ────────────────────────────────────────────────────

  describe('setNestedNodeCounter', () => {
    it('should update nested counter to the given value if greater', () => {
      setNestedNodeCounter(10);
      expect(generateNestedNodeId()).toBe('nested-node-11');
    });

    it('should not decrease the counter if given value is smaller', () => {
      setNestedNodeCounter(5);
      setNestedNodeCounter(2);
      // counter stays at 5 (max), so next is 6
      expect(generateNestedNodeId()).toBe('nested-node-6');
    });
  });

  // ─── extractCountersFromFlow ─────────────────────────────────────────────────

  describe('extractCountersFromFlow', () => {
    it('should set counters based on node ids in given flow', () => {
      const nodes: Node[] = [
        { id: 'node-3', type: 'editableNode', position: { x: 0, y: 0 }, data: {} },
        { id: 'node-7', type: 'editableNode', position: { x: 0, y: 0 }, data: {} },
        { id: 'other-id', type: 'editableNode', position: { x: 0, y: 0 }, data: {} },
      ];
      const edges: Edge[] = [
        { id: 'edge-2', source: 'node-3', target: 'node-7' },
        { id: 'edge-5', source: 'node-7', target: 'other-id' },
      ];
      extractCountersFromFlow(nodes, edges, {});
      expect(generateNodeId()).toBe('node-8');
      expect(generateEdgeId()).toBe('edge-6');
    });

    it('should handle nested canvas data for nested-node ids', () => {
      const nodes: Node[] = [];
      const edges: Edge[] = [];
      const nestedCanvasData = {
        'node-1': {
          nodes: [
            { id: 'nested-node-4', type: 'editableNode', position: { x: 0, y: 0 }, data: {} },
          ] as Node[],
          edges: [
            { id: 'edge-3', source: 'nested-node-4', target: 'nested-node-4' },
          ] as Edge[],
        },
      };
      extractCountersFromFlow(nodes, edges, nestedCanvasData);
      expect(generateNestedNodeId()).toBe('nested-node-5');
    });

    it('should handle empty flow data', () => {
      extractCountersFromFlow([], [], {});
      expect(generateNodeId()).toBe('node-1');
      expect(generateEdgeId()).toBe('edge-1');
      expect(generateNestedNodeId()).toBe('nested-node-1');
    });

    it('should ignore nodes whose ids do not match the pattern', () => {
      const nodes: Node[] = [
        { id: 'custom-abc', type: 'editableNode', position: { x: 0, y: 0 }, data: {} },
      ];
      extractCountersFromFlow(nodes, [], {});
      expect(generateNodeId()).toBe('node-1');
    });

    it('should cover false branch when nested-canvas nodes have non-matching ids', () => {
      const nestedCanvasData = {
        'node-1': {
          nodes: [
            { id: 'custom-nested-id', type: 'editableNode', position: { x: 0, y: 0 }, data: {} },
          ] as Node[],
          edges: [
            { id: 'connection-abc', source: 'a', target: 'b' },
          ] as Edge[],
        },
      };
      extractCountersFromFlow([], [], nestedCanvasData);
      // IDs do not match patterns, counters stay at 0, next IDs are 1
      expect(generateNestedNodeId()).toBe('nested-node-1');
      expect(generateEdgeId()).toBe('edge-1');
    });

    it('should cover false branch of edge pattern in top-level edges', () => {
      const edges: Edge[] = [
        { id: 'connection-5', source: 'a', target: 'b' }, // does not match edge-N
      ];
      extractCountersFromFlow([], edges, {});
      expect(generateEdgeId()).toBe('edge-1');
    });

    it('should update maxEdgeId from nested canvas edge IDs', () => {
      const nestedCanvasData = {
        'node-1': {
          nodes: [] as Node[],
          edges: [
            { id: 'edge-9', source: 'a', target: 'b' },
          ] as Edge[],
        },
      };
      extractCountersFromFlow([], [], nestedCanvasData);
      expect(generateEdgeId()).toBe('edge-10');
    });
  });
});
