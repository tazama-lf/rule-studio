 
import { renderHook, act } from '@testing-library/react';
import { useTernaryConditions } from '../../../src/hooks/RuleBuilder/useTernaryConditions';
import type { TernaryNode } from '../../../src/components/RuleBuilder/RightSidebar/components/TernaryConditionEditor';

describe('useTernaryConditions', () => {
  const mockOnParamChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should return default ternary tree when params are empty', () => {
      const { result } = renderHook(() =>
        useTernaryConditions({ currentParams: {}, onParamChange: mockOnParamChange })
      );

      expect(result.current.ternaryTree).toEqual({
        condition: 'true',
        trueValue: { type: 'value', value: "'yes'" },
        falseValue: { type: 'value', value: "'no'" },
      });
    });

    it('should parse valid ternary tree from params', () => {
      const tree = {
        condition: 'x > 10',
        trueValue: { type: 'value', value: "'high'" },
        falseValue: { type: 'value', value: "'low'" },
      };

      const { result } = renderHook(() =>
        useTernaryConditions({
          currentParams: { ternaryTree: JSON.stringify(tree) },
          onParamChange: mockOnParamChange,
        })
      );

      expect(result.current.ternaryTree).toEqual(tree);
    });

    it('should return all handler functions', () => {
      const { result } = renderHook(() =>
        useTernaryConditions({ currentParams: {}, onParamChange: mockOnParamChange })
      );

      expect(typeof result.current.handleTreeChange).toBe('function');
      expect(typeof result.current.handleStoreResultChange).toBe('function');
      expect(typeof result.current.handleResultVarChange).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should return default tree on invalid JSON', () => {
      const { result } = renderHook(() =>
        useTernaryConditions({
          currentParams: { ternaryTree: 'invalid json {' },
          onParamChange: mockOnParamChange,
        })
      );

      expect(result.current.ternaryTree).toEqual({
        condition: 'true',
        trueValue: { type: 'value', value: "'yes'" },
        falseValue: { type: 'value', value: "'no'" },
      });
    });

    it('should return default tree on malformed data', () => {
      const { result } = renderHook(() =>
        useTernaryConditions({
          currentParams: { ternaryTree: '{"incomplete": true' },
          onParamChange: mockOnParamChange,
        })
      );

      expect(result.current.ternaryTree).toEqual({
        condition: 'true',
        trueValue: { type: 'value', value: "'yes'" },
        falseValue: { type: 'value', value: "'no'" },
      });
    });

    it('should return default tree on null', () => {
      const { result } = renderHook(() =>
        useTernaryConditions({
          currentParams: { ternaryTree: JSON.stringify(null) },
          onParamChange: mockOnParamChange,
        })
      );

      // When JSON.parse returns null, the hook returns null (not the default)
      expect(result.current.ternaryTree).toBeNull();
    });
  });

  describe('handleTreeChange', () => {
    it('should call onParamChange with stringified tree', () => {
      const { result } = renderHook(() =>
        useTernaryConditions({ currentParams: {}, onParamChange: mockOnParamChange })
      );

      const newTree: TernaryNode = {
        condition: 'status === "active"',
        trueValue: { type: 'value', value: '1' },
        falseValue: { type: 'value', value: '0' },
      };

      act(() => {
        result.current.handleTreeChange(newTree);
      });

      expect(mockOnParamChange).toHaveBeenCalledWith('ternaryTree', JSON.stringify(newTree));
      expect(mockOnParamChange).toHaveBeenCalledTimes(1);
    });

    it('should handle nested ternary in trueValue', () => {
      const { result } = renderHook(() =>
        useTernaryConditions({ currentParams: {}, onParamChange: mockOnParamChange })
      );

      const nestedTree: TernaryNode = {
        condition: 'x > 10',
        trueValue: {
          type: 'nested',
          nested: {
            condition: 'x > 20',
            trueValue: { type: 'value', value: "'very high'" },
            falseValue: { type: 'value', value: "'high'" },
          },
        },
        falseValue: { type: 'value', value: "'low'" },
      };

      act(() => {
        result.current.handleTreeChange(nestedTree);
      });

      expect(mockOnParamChange).toHaveBeenCalledWith('ternaryTree', JSON.stringify(nestedTree));
    });

    it('should maintain function stability across rerenders', () => {
      const { result, rerender } = renderHook(() =>
        useTernaryConditions({ currentParams: {}, onParamChange: mockOnParamChange })
      );

      const firstHandler = result.current.handleTreeChange;
      
      rerender();
      
      expect(result.current.handleTreeChange).toBe(firstHandler);
    });
  });

  describe('handleStoreResultChange', () => {
    it('should call onParamChange with string "true" when checked is true', () => {
      const { result } = renderHook(() =>
        useTernaryConditions({ currentParams: {}, onParamChange: mockOnParamChange })
      );

      act(() => {
        result.current.handleStoreResultChange(true);
      });

      expect(mockOnParamChange).toHaveBeenCalledWith('storeResult', 'true');
      expect(mockOnParamChange).toHaveBeenCalledTimes(1);
    });

    it('should call onParamChange with string "false" when checked is false', () => {
      const { result } = renderHook(() =>
        useTernaryConditions({ currentParams: {}, onParamChange: mockOnParamChange })
      );

      act(() => {
        result.current.handleStoreResultChange(false);
      });

      expect(mockOnParamChange).toHaveBeenCalledWith('storeResult', 'false');
      expect(mockOnParamChange).toHaveBeenCalledTimes(1);
    });

    it('should maintain function stability across rerenders', () => {
      const { result, rerender } = renderHook(() =>
        useTernaryConditions({ currentParams: {}, onParamChange: mockOnParamChange })
      );

      const firstHandler = result.current.handleStoreResultChange;
      
      rerender();
      
      expect(result.current.handleStoreResultChange).toBe(firstHandler);
    });
  });

  describe('handleResultVarChange', () => {
    it('should call onParamChange with new variable name', () => {
      const { result } = renderHook(() =>
        useTernaryConditions({ currentParams: {}, onParamChange: mockOnParamChange })
      );

      act(() => {
        result.current.handleResultVarChange('resultVariable');
      });

      expect(mockOnParamChange).toHaveBeenCalledWith('resultVar', 'resultVariable');
      expect(mockOnParamChange).toHaveBeenCalledTimes(1);
    });

    it('should handle empty string', () => {
      const { result } = renderHook(() =>
        useTernaryConditions({ currentParams: {}, onParamChange: mockOnParamChange })
      );

      act(() => {
        result.current.handleResultVarChange('');
      });

      expect(mockOnParamChange).toHaveBeenCalledWith('resultVar', '');
    });

    it('should handle special characters in variable name', () => {
      const { result } = renderHook(() =>
        useTernaryConditions({ currentParams: {}, onParamChange: mockOnParamChange })
      );

      act(() => {
        result.current.handleResultVarChange('my_result_123');
      });

      expect(mockOnParamChange).toHaveBeenCalledWith('resultVar', 'my_result_123');
    });

    it('should maintain function stability across rerenders', () => {
      const { result, rerender } = renderHook(() =>
        useTernaryConditions({ currentParams: {}, onParamChange: mockOnParamChange })
      );

      const firstHandler = result.current.handleResultVarChange;
      
      rerender();
      
      expect(result.current.handleResultVarChange).toBe(firstHandler);
    });
  });

  describe('Complex Ternary Trees', () => {
    it('should handle deeply nested ternary expressions', () => {
      const deeplyNestedTree = {
        condition: 'level1',
        trueValue: {
          type: 'ternary' as const,
          value: {
            condition: 'level2',
            trueValue: {
              type: 'ternary' as const,
              value: {
                condition: 'level3',
                trueValue: { type: 'value' as const, value: "'deep'" },
                falseValue: { type: 'value' as const, value: "'shallow'" },
              },
            },
            falseValue: { type: 'value' as const, value: "'mid'" },
          },
        },
        falseValue: { type: 'value' as const, value: "'root'" },
      };

      const { result } = renderHook(() =>
        useTernaryConditions({
          currentParams: { ternaryTree: JSON.stringify(deeplyNestedTree) },
          onParamChange: mockOnParamChange,
        })
      );

      expect(result.current.ternaryTree).toEqual(deeplyNestedTree);
    });

    it('should handle ternary with boolean values', () => {
      const tree = {
        condition: 'isValid',
        trueValue: { type: 'value', value: 'true' },
        falseValue: { type: 'value', value: 'false' },
      };

      const { result } = renderHook(() =>
        useTernaryConditions({
          currentParams: { ternaryTree: JSON.stringify(tree) },
          onParamChange: mockOnParamChange,
        })
      );

      expect(result.current.ternaryTree).toEqual(tree);
    });

    it('should handle ternary with numeric values', () => {
      const tree = {
        condition: 'count > 0',
        trueValue: { type: 'value', value: '1' },
        falseValue: { type: 'value', value: '0' },
      };

      const { result } = renderHook(() =>
        useTernaryConditions({
          currentParams: { ternaryTree: JSON.stringify(tree) },
          onParamChange: mockOnParamChange,
        })
      );

      expect(result.current.ternaryTree).toEqual(tree);
    });
  });

  describe('useMemo Optimization', () => {
    it('should memoize ternaryTree when params do not change', () => {
      const tree = {
        condition: 'test',
        trueValue: { type: 'value' as const, value: "'yes'" },
        falseValue: { type: 'value' as const, value: "'no'" },
      };
      const params = { ternaryTree: JSON.stringify(tree) };

      const { result, rerender } = renderHook(
        ({ currentParams }) =>
          useTernaryConditions({ currentParams, onParamChange: mockOnParamChange }),
        { initialProps: { currentParams: params } }
      );

      const firstTree = result.current.ternaryTree;
      
      rerender({ currentParams: params });
      
      expect(result.current.ternaryTree).toBe(firstTree);
    });

    it('should recompute when ternaryTree param changes', () => {
      const tree1 = {
        condition: 'test1',
        trueValue: { type: 'value' as const, value: "'yes'" },
        falseValue: { type: 'value' as const, value: "'no'" },
      };
      const tree2 = {
        condition: 'test2',
        trueValue: { type: 'value' as const, value: "'yes'" },
        falseValue: { type: 'value' as const, value: "'no'" },
      };

      const { result, rerender } = renderHook(
        ({ currentParams }) =>
          useTernaryConditions({ currentParams, onParamChange: mockOnParamChange }),
        { initialProps: { currentParams: { ternaryTree: JSON.stringify(tree1) } } }
      );

      expect(result.current.ternaryTree.condition).toBe('test1');
      
      rerender({ currentParams: { ternaryTree: JSON.stringify(tree2) } });
      
      expect(result.current.ternaryTree.condition).toBe('test2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty object as tree', () => {
      const { result } = renderHook(() =>
        useTernaryConditions({
          currentParams: { ternaryTree: '{}' },
          onParamChange: mockOnParamChange,
        })
      );

      expect(result.current.ternaryTree).toEqual({});
    });

    it('should handle whitespace in condition', () => {
      const tree = {
        condition: '  x > 5  ',
        trueValue: { type: 'value', value: "'yes'" },
        falseValue: { type: 'value', value: "'no'" },
      };

      const { result } = renderHook(() =>
        useTernaryConditions({
          currentParams: { ternaryTree: JSON.stringify(tree) },
          onParamChange: mockOnParamChange,
        })
      );

      expect(result.current.ternaryTree.condition).toBe('  x > 5  ');
    });

    it('should handle tree with additional properties', () => {
      const tree = {
        condition: 'test',
        trueValue: { type: 'value', value: "'yes'" },
        falseValue: { type: 'value', value: "'no'" },
        extraProp: 'extra',
      };

      const { result } = renderHook(() =>
        useTernaryConditions({
          currentParams: { ternaryTree: JSON.stringify(tree) },
          onParamChange: mockOnParamChange,
        })
      );

      expect(result.current.ternaryTree).toEqual(tree);
    });
  });
});
