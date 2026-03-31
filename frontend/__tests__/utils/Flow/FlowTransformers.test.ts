import {
  transformApiNodeToCanvasNode,
  transformApiEdgeToCanvasEdge,
  transformApiFlowData,
} from '../../../src/utils/Flow/FlowTransformers';
import type { ApiNode, ApiEdge } from '../../../src/utils/Flow/FlowTransformers';

jest.mock('../../../src/utils/Common/helpers', () => ({
  getLabelForHandle: jest.fn((handle: string) => `label-${handle}`),
  getColorForHandle: jest.fn((handle: string) => `#${handle}`),
}));

describe('FlowTransformers', () => {
  describe('transformApiNodeToCanvasNode', () => {
    const baseNode: ApiNode = {
      id: 'n1',
      type: 'SetVariable',
      label: 'Set Var',
      params: { name: 'x', value: '10' },
    };

    it('should preserve id and map to editableNode type', () => {
      const result = transformApiNodeToCanvasNode(baseNode);
      expect(result.id).toBe('n1');
      expect(result.type).toBe('editableNode');
    });

    it('should default position when missing', () => {
      const result = transformApiNodeToCanvasNode(baseNode);
      expect(result.position).toEqual({ x: 0, y: 0 });
    });

    it('should map data fields and include mode metadata when provided', () => {
      const result = transformApiNodeToCanvasNode({
        ...baseNode,
        mode: 'definition',
        generation_type: 'definition',
        function_name: 'myFn',
      });
      expect(result.data.label).toBe('Set Var');
      expect(result.data.nodeType).toBe('SetVariable');
      expect(result.data.mode).toBe('definition');
      expect(result.data.generation_type).toBe('definition');
      expect(result.data.function_name).toBe('myFn');
    });
  });

  describe('transformApiEdgeToCanvasEdge', () => {
    const baseEdge: ApiEdge = { id: 'e1', source: 'n1', target: 'n2' };

    it('should map base edge defaults', () => {
      const result = transformApiEdgeToCanvasEdge(baseEdge);
      expect(result.type).toBe('smoothstep');
      expect(result.animated).toBe(false);
    });

    it('should include source and target handles when provided', () => {
      const result = transformApiEdgeToCanvasEdge({ ...baseEdge, sourceHandle: 'if', targetHandle: 't' });
      expect(result.sourceHandle).toBe('if');
      expect(result.targetHandle).toBe('t');
    });

    it('should use provided label and style when present', () => {
      const style = { stroke: '#f00', strokeWidth: 3 };
      const result = transformApiEdgeToCanvasEdge({ ...baseEdge, label: 'if', style });
      expect(result.label).toBe('if');
      expect(result.style).toEqual(style);
    });

    it('should reconstruct label and style from sourceHandle when missing', () => {
      const result = transformApiEdgeToCanvasEdge({ ...baseEdge, sourceHandle: 'else' });
      expect(result.label).toBe('label-else');
      expect((result.style as Record<string, unknown>).stroke).toBe('#else');
      expect((result.style as Record<string, unknown>).strokeWidth).toBe(2);
    });

    it('should reconstruct style while preserving explicit label when label exists but style is missing', () => {
      const result = transformApiEdgeToCanvasEdge({ ...baseEdge, sourceHandle: 'if', label: '{{ myVar }}' });
      expect(result.label).toBe('{{ myVar }}');
      expect(result.style).toBeDefined();
      expect((result.style as Record<string, unknown>).strokeWidth).toBe(2);
    });
  });

  describe('transformApiFlowData', () => {
    it('should transform nodes, edges and nestedFlows', () => {
      const nodes: ApiNode[] = [
        {
          id: 'n1',
          type: 'Start',
          label: 'Start',
          nestedFlow: {
            nodes: [{ id: 'nested-n1', type: 'Log', label: 'Inner Log' }],
            edges: [{ id: 'nested-e1', source: 'nested-n1', target: 'nested-n1' }],
          },
        },
      ];
      const edges: ApiEdge[] = [{ id: 'e1', source: 'n1', target: 'n1' }];

      const result = transformApiFlowData(nodes, edges);
      expect(result.nodes).toHaveLength(1);
      expect(result.edges).toHaveLength(1);
      expect(result.nestedFlows.n1.nodes).toHaveLength(1);
      expect(result.nestedFlows.n1.edges).toHaveLength(1);
    });

    it('should return empty structures for empty input', () => {
      const result = transformApiFlowData([], []);
      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
      expect(result.nestedFlows).toEqual({});
    });
  });
});