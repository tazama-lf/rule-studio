import { renderHook } from '@testing-library/react';
import { useNodeRenderer } from '../../../src/hooks/RuleBuilder/useNodeRenderer';
import * as nodeTemplateService from '../../../src/utils/Flow/nodeTemplateService';
import { useNodeStyles } from '../../../src/hooks/RuleBuilder/EditableNode/useNodeStyles';
import { useNodeHandles } from '../../../src/hooks/RuleBuilder/EditableNode/useNodeHandles';
import type { EditableNodeData } from '../../../src/components/RuleBuilder/EditableNode';

jest.mock('../../../src/utils/Flow/nodeTemplateService');
jest.mock('../../../src/hooks/RuleBuilder/EditableNode/useNodeStyles');
jest.mock('../../../src/hooks/RuleBuilder/EditableNode/useNodeHandles');

const mockedTemplateService = nodeTemplateService as jest.Mocked<typeof nodeTemplateService>;
const mockedUseNodeStyles = useNodeStyles as jest.MockedFunction<typeof useNodeStyles>;
const mockedUseNodeHandles = useNodeHandles as jest.MockedFunction<typeof useNodeHandles>;

describe('useNodeRenderer', () => {
  const mockTemplate = {
    type: 'TestNode',
    nodeType: 'TestNode',
    displayName: 'Test Node',
    inputs: [],
    handles: { source: true, target: true },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockedTemplateService.getNodeTemplate.mockReturnValue(mockTemplate as any);
    mockedUseNodeStyles.mockReturnValue({
      backgroundColor: '#e3f2fd',
      borderColor: '#2196f3',
    });
    mockedUseNodeHandles.mockReturnValue({
      targetHandle: 'targetHandleElement' as any,
      sourceHandles: ['sourceHandleElement'] as any,
    });
  });

  describe('Initialization', () => {
    it('should return all expected properties', () => {
      const nodeData: any = {
        label: 'Test',
        nodeType: 'TestNode',
        params: {},
      };

      const { result } = renderHook(() => useNodeRenderer(nodeData));

      expect(result.current).toHaveProperty('template');
      expect(result.current).toHaveProperty('backgroundColor');
      expect(result.current).toHaveProperty('borderColor');
      expect(result.current).toHaveProperty('label');
      expect(result.current).toHaveProperty('localParams');
      expect(result.current).toHaveProperty('isSpecialNode');
      expect(result.current).toHaveProperty('conditions');
      expect(result.current).toHaveProperty('targetHandle');
      expect(result.current).toHaveProperty('sourceHandles');
    });
  });

  describe('Mode Handling', () => {
    it('should use mode from data', () => {
      const nodeData: any = {
        label: 'Test',
        nodeType: 'TestNode',
        mode: 'async',
        params: {},
      };

      renderHook(() => useNodeRenderer(nodeData));

      expect(mockedTemplateService.getNodeTemplate).toHaveBeenCalledWith('TestNode', 'async');
    });

    it('should use generation_type when mode is not present', () => {
      const nodeData: any = {
        label: 'Test',
        nodeType: 'TestNode',
        generation_type: 'function',
        params: {},
      };

      renderHook(() => useNodeRenderer(nodeData));

      expect(mockedTemplateService.getNodeTemplate).toHaveBeenCalledWith('TestNode', 'function');
    });

    it('should prefer mode over generation_type', () => {
      const nodeData: any = {
        label: 'Test',
        nodeType: 'TestNode',
        mode: 'async',
        generation_type: 'function',
        params: {},
      };

      renderHook(() => useNodeRenderer(nodeData));

      expect(mockedTemplateService.getNodeTemplate).toHaveBeenCalledWith('TestNode', 'async');
    });

    it('should handle no mode or generation_type', () => {
      const nodeData: any = {
        label: 'Test',
        nodeType: 'TestNode',
        params: {},
      };

      renderHook(() => useNodeRenderer(nodeData));

      expect(mockedTemplateService.getNodeTemplate).toHaveBeenCalledWith('TestNode', undefined);
    });
  });

  describe('NodeType Cleaning', () => {
    it('should clean nodeType with :: separator', () => {
      const nodeData: any = {
        label: 'Test',
        nodeType: 'TestNode::variant',
        params: {},
      };

      renderHook(() => useNodeRenderer(nodeData));

      expect(mockedTemplateService.getNodeTemplate).toHaveBeenCalledWith('TestNode', undefined);
    });

    it('should keep nodeType without :: separator', () => {
      const nodeData: any = {
        label: 'Test',
        nodeType: 'SimpleNode',
        params: {},
      };

      renderHook(() => useNodeRenderer(nodeData));

      expect(mockedTemplateService.getNodeTemplate).toHaveBeenCalledWith('SimpleNode', undefined);
    });
  });

  describe('Template Retrieval', () => {
    it('should retrieve template from service', () => {
      const nodeData: any = {
        label: 'Test',
        nodeType: 'TestNode',
        params: {},
      };

      const { result } = renderHook(() => useNodeRenderer(nodeData));

      expect(result.current.template).toEqual(mockTemplate);
    });

    it('should handle undefined template', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue(undefined);

      const nodeData: any = {
        label: 'Test',
        nodeType: 'UnknownNode',
        params: {},
      };

      const { result } = renderHook(() => useNodeRenderer(nodeData));

      expect(result.current.template).toBeUndefined();
    });
  });

  describe('Styling', () => {
    it('should get colors from useNodeStyles', () => {
      const nodeData: any = {
        label: 'Test',
        nodeType: 'TestNode',
        params: {},
      };

      const { result } = renderHook(() => useNodeRenderer(nodeData));

      expect(result.current.backgroundColor).toBe('#e3f2fd');
      expect(result.current.borderColor).toBe('#2196f3');
    });

    it('should call useNodeStyles with clean nodeType', () => {
      const nodeData: any = {
        label: 'Test',
        nodeType: 'TestNode::variant',
        params: {},
      };

      renderHook(() => useNodeRenderer(nodeData));

      expect(mockedUseNodeStyles).toHaveBeenCalledWith('TestNode');
    });
  });

  describe('Label and Params', () => {
    it('should return label from nodeData', () => {
      const nodeData: any = {
        label: 'My Custom Label',
        nodeType: 'TestNode',
        params: {},
      };

      const { result } = renderHook(() => useNodeRenderer(nodeData));

      expect(result.current.label).toBe('My Custom Label');
    });

    it('should return params from nodeData', () => {
      const params = {
        key1: 'value1',
        key2: 'value2',
      };

      const nodeData: any = {
        label: 'Test',
        nodeType: 'TestNode',
        params,
      };

      const { result } = renderHook(() => useNodeRenderer(nodeData));

      expect(result.current.localParams).toEqual(params);
    });

    it('should return empty object when no params', () => {
      const nodeData: any = {
        label: 'Test',
        nodeType: 'TestNode',
      };

      const { result } = renderHook(() => useNodeRenderer(nodeData));

      expect(result.current.localParams).toEqual({});
    });
  });

  describe('Special Node Detection', () => {
    it('should detect Start as special node', () => {
      const nodeData: any = {
        label: 'Start',
        nodeType: 'Start',
        params: {},
      };

      const { result } = renderHook(() => useNodeRenderer(nodeData));

      expect(result.current.isSpecialNode).toBe(true);
    });

    it('should detect End as special node', () => {
      const nodeData: any = {
        label: 'End',
        nodeType: 'End',
        params: {},
      };

      const { result } = renderHook(() => useNodeRenderer(nodeData));

      expect(result.current.isSpecialNode).toBe(true);
    });

    it('should detect HandleTransaction as special node', () => {
      const nodeData: any = {
        label: 'Handle',
        nodeType: 'HandleTransaction',
        params: {},
      };

      const { result } = renderHook(() => useNodeRenderer(nodeData));

      expect(result.current.isSpecialNode).toBe(true);
    });

    it('should not mark regular nodes as special', () => {
      const nodeData: any = {
        label: 'Regular',
        nodeType: 'SetVariable',
        params: {},
      };

      const { result } = renderHook(() => useNodeRenderer(nodeData));

      expect(result.current.isSpecialNode).toBe(false);
    });
  });

  describe('If Node Conditions', () => {
    it('should parse conditions for If node', () => {
      const conditions = [
        { type: 'if', condition: 'x > 5' },
        { type: 'else-if', condition: 'x < 0' },
      ];

      const nodeData: any = {
        label: 'If',
        nodeType: 'If',
        params: {
          conditions: JSON.stringify(conditions),
        },
      };

      const { result } = renderHook(() => useNodeRenderer(nodeData));

      expect(result.current.conditions).toEqual(conditions);
    });

    it('should use default condition for If node with no conditions param', () => {
      const nodeData: any = {
        label: 'If',
        nodeType: 'If',
        params: {},
      };

      const { result } = renderHook(() => useNodeRenderer(nodeData));

      expect(result.current.conditions).toEqual([{ type: 'if', condition: 'x > 5' }]);
    });

    it('should handle invalid JSON in conditions', () => {
      const nodeData: any = {
        label: 'If',
        nodeType: 'If',
        params: {
          conditions: 'invalid json',
        },
      };

      const { result } = renderHook(() => useNodeRenderer(nodeData));

      expect(result.current.conditions).toEqual([{ type: 'if', condition: 'x > 5' }]);
    });

    it('should return empty array for non-If nodes', () => {
      const nodeData: any = {
        label: 'SetVar',
        nodeType: 'SetVariable',
        params: {},
      };

      const { result } = renderHook(() => useNodeRenderer(nodeData));

      expect(result.current.conditions).toEqual([]);
    });
  });

  describe('Handles', () => {
    it('should determine handle visibility from template', () => {
      const templateWithHandles = {
        ...mockTemplate,
        handles: { source: true, target: true },
      };

      mockedTemplateService.getNodeTemplate.mockReturnValue(templateWithHandles as any);

      const nodeData: any = {
        label: 'Test',
        nodeType: 'TestNode',
        params: {},
      };

      renderHook(() => useNodeRenderer(nodeData));

      expect(mockedUseNodeHandles).toHaveBeenCalledWith(
        'TestNode',
        true,
        true,
        []
      );
    });

    it('should default to true when handles not in template', () => {
      const templateWithoutHandles = {
        type: 'TestNode',
        nodeType: 'TestNode',
        displayName: 'Test',
      };

      mockedTemplateService.getNodeTemplate.mockReturnValue(templateWithoutHandles as any);

      const nodeData: any = {
        label: 'Test',
        nodeType: 'TestNode',
        params: {},
      };

      renderHook(() => useNodeRenderer(nodeData));

      expect(mockedUseNodeHandles).toHaveBeenCalledWith(
        'TestNode',
        true,
        true,
        []
      );
    });

    it('should pass conditions to useNodeHandles for If nodes', () => {
      const conditions = [
        { type: 'if', condition: 'x > 5' },
        { type: 'else-if', condition: 'x < 0' },
      ];

      const nodeData: any = {
        label: 'If',
        nodeType: 'If',
        params: {
          conditions: JSON.stringify(conditions),
        },
      };

      renderHook(() => useNodeRenderer(nodeData));

      expect(mockedUseNodeHandles).toHaveBeenCalledWith(
        'If',
        true,
        true,
        conditions
      );
    });

    it('should return handles from useNodeHandles', () => {
      const mockHandles = {
        targetHandle: 'targetHandleElement' as any,
        sourceHandles: ['sourceHandleElement'] as any,
      };

      mockedUseNodeHandles.mockReturnValue(mockHandles);

      const nodeData: any = {
        label: 'Test',
        nodeType: 'TestNode',
        params: {},
      };

      const { result } = renderHook(() => useNodeRenderer(nodeData));

      expect(result.current.targetHandle).toBe(mockHandles.targetHandle);
      expect(result.current.sourceHandles).toBe(mockHandles.sourceHandles);
    });
  });

  describe('Memoization', () => {
    it('should memoize template when nodeType and mode do not change', () => {
      const nodeData: any = {
        label: 'Test',
        nodeType: 'TestNode',
        mode: 'async',
        params: {},
      };

      const { result, rerender } = renderHook(() => useNodeRenderer(nodeData));

      const firstTemplate = result.current.template;
      rerender();

      expect(result.current.template).toBe(firstTemplate);
    });

    it('should recompute when nodeType changes', () => {
      const { result, rerender } = renderHook(
        ({ nodeType }) =>
          useNodeRenderer({
            label: 'Test',
            nodeType,
            params: {},
          }),
        { initialProps: { nodeType: 'TestNode' } }
      );

      mockedTemplateService.getNodeTemplate.mockClear();

      rerender({ nodeType: 'DifferentNode' });

      expect(mockedTemplateService.getNodeTemplate).toHaveBeenCalledWith('DifferentNode', undefined);
    });

    it('should memoize params when not changed', () => {
      const params = { key: 'value' };
      const nodeData: any = {
        label: 'Test',
        nodeType: 'TestNode',
        params,
      };

      const { result, rerender } = renderHook(() => useNodeRenderer(nodeData));

      const firstParams = result.current.localParams;
      rerender();

      expect(result.current.localParams).toBe(firstParams);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty nodeType', () => {
      const nodeData: any = {
        label: 'Test',
        nodeType: '',
        params: {},
      };

      renderHook(() => useNodeRenderer(nodeData));

      expect(mockedTemplateService.getNodeTemplate).toHaveBeenCalledWith('', undefined);
    });

    it('should handle nodeType with multiple :: separators', () => {
      const nodeData: any = {
        label: 'Test',
        nodeType: 'Category::SubCategory::NodeType',
        params: {},
      };

      renderHook(() => useNodeRenderer(nodeData));

      expect(mockedTemplateService.getNodeTemplate).toHaveBeenCalledWith('Category', undefined);
    });

    it('should handle params with complex objects', () => {
      const params: any = {
        simple: 'string',
        complex: { nested: { value: 123 } },
        array: [1, 2, 3],
      };

      const nodeData: any = {
        label: 'Test',
        nodeType: 'TestNode',
        params,
      };

      const { result } = renderHook(() => useNodeRenderer(nodeData));

      expect(result.current.localParams).toEqual(params);
    });
  });
});
