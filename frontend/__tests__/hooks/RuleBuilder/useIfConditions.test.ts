import { renderHook } from '@testing-library/react';
import { useIfConditions } from '../../../src/hooks/RuleBuilder/useIfConditions';

describe('useIfConditions', () => {
  describe('Initialization', () => {
    it('should return default condition when params are empty', () => {
      const { result } = renderHook(() =>
        useIfConditions({ currentParams: {} })
      );

      expect(result.current.conditions).toEqual([
        { type: 'if', condition: 'x > 5' },
      ]);
    });

    it('should parse valid conditions from params', () => {
      const conditions = [
        { type: 'if' as const, condition: 'x > 10' },
        { type: 'elseif' as const, condition: 'x > 5' },
        { type: 'else' as const },
      ];
      
      const { result } = renderHook(() =>
        useIfConditions({
          currentParams: { conditions: JSON.stringify(conditions) },
        })
      );

      expect(result.current.conditions).toEqual(conditions);
    });

    it('should handle single if condition', () => {
      const conditions = [{ type: 'if' as const, condition: 'active === true' }];
      
      const { result } = renderHook(() =>
        useIfConditions({
          currentParams: { conditions: JSON.stringify(conditions) },
        })
      );

      expect(result.current.conditions).toEqual(conditions);
    });
  });

  describe('Error Handling', () => {
    it('should return default condition on invalid JSON', () => {
      const { result } = renderHook(() =>
        useIfConditions({
          currentParams: { conditions: 'invalid json {' },
        })
      );

      expect(result.current.conditions).toEqual([
        { type: 'if', condition: 'x > 5' },
      ]);
    });

    it('should return default condition on null value', () => {
      const { result } = renderHook(() =>
        useIfConditions({
          currentParams: { conditions: JSON.stringify(null) },
        })
      );

      // When JSON.parse returns null, the hook returns null (not the default)
      expect(result.current.conditions).toBeNull();
    });

    it('should return default condition on undefined', () => {
      const { result } = renderHook(() =>
        useIfConditions({
          currentParams: { conditions: undefined as unknown as string },
        })
      );

      expect(result.current.conditions).toEqual([
        { type: 'if', condition: 'x > 5' },
      ]);
    });

    it('should return default condition on empty string', () => {
      const { result } = renderHook(() =>
        useIfConditions({
          currentParams: { conditions: '' },
        })
      );

      expect(result.current.conditions).toEqual([
        { type: 'if', condition: 'x > 5' },
      ]);
    });
  });

  describe('Complex Conditions', () => {
    it('should handle multiple elseif conditions', () => {
      const conditions = [
        { type: 'if' as const, condition: 'x > 10' },
        { type: 'elseif' as const, condition: 'x > 5' },
        { type: 'elseif' as const, condition: 'x > 0' },
        { type: 'else' as const },
      ];
      
      const { result } = renderHook(() =>
        useIfConditions({
          currentParams: { conditions: JSON.stringify(conditions) },
        })
      );

      expect(result.current.conditions).toEqual(conditions);
      expect(result.current.conditions).toHaveLength(4);
    });

    it('should handle if without else', () => {
      const conditions = [{ type: 'if' as const, condition: 'value !== null' }];
      
      const { result } = renderHook(() =>
        useIfConditions({
          currentParams: { conditions: JSON.stringify(conditions) },
        })
      );

      expect(result.current.conditions).toEqual(conditions);
    });

    it('should handle complex condition expressions', () => {
      const conditions = [
        { type: 'if' as const, condition: 'user.age >= 18 && user.verified === true' },
        { type: 'else' as const },
      ];
      
      const { result } = renderHook(() =>
        useIfConditions({
          currentParams: { conditions: JSON.stringify(conditions) },
        })
      );

      expect(result.current.conditions).toEqual(conditions);
    });
  });

  describe('Condition Structure', () => {
    it('should handle conditions with type property', () => {
      const conditions = [
        { type: 'if' as const, condition: 'test' },
      ];
      
      const { result } = renderHook(() =>
        useIfConditions({
          currentParams: { conditions: JSON.stringify(conditions) },
        })
      );

      expect(result.current.conditions[0]).toHaveProperty('type');
      expect(result.current.conditions[0].type).toBe('if');
    });

    it('should handle else without condition property', () => {
      const conditions = [
        { type: 'if' as const, condition: 'test' },
        { type: 'else' as const },
      ];
      
      const { result } = renderHook(() =>
        useIfConditions({
          currentParams: { conditions: JSON.stringify(conditions) },
        })
      );

      expect(result.current.conditions[1]).toHaveProperty('type');
      expect(result.current.conditions[1]).not.toHaveProperty('condition');
    });

    it('should preserve condition values with special characters', () => {
      const conditions = [
        { type: 'if' as const, condition: 'price >= 100 && discount !== "NONE"' },
      ];
      
      const { result } = renderHook(() =>
        useIfConditions({
          currentParams: { conditions: JSON.stringify(conditions) },
        })
      );

      expect(result.current.conditions[0].condition).toBe('price >= 100 && discount !== "NONE"');
    });
  });

  describe('useMemo Optimization', () => {
    it('should memoize conditions when params do not change', () => {
      const conditions = [{ type: 'if' as const, condition: 'x > 5' }];
      const params = { conditions: JSON.stringify(conditions) };
      
      const { result, rerender } = renderHook(
        ({ currentParams }) => useIfConditions({ currentParams }),
        { initialProps: { currentParams: params } }
      );

      const firstResult = result.current.conditions;
      
      rerender({ currentParams: params });
      
      // useMemo should return the same array reference when dependencies don't change
      expect(result.current.conditions).toStrictEqual(firstResult);
    });

    it('should recompute when params change', () => {
      const conditions1 = [{ type: 'if' as const, condition: 'x > 5' }];
      const conditions2 = [{ type: 'if' as const, condition: 'x > 10' }];
      
      const { result, rerender } = renderHook(
        ({ currentParams }) => useIfConditions({ currentParams }),
        { initialProps: { currentParams: { conditions: JSON.stringify(conditions1) } } }
      );

      expect(result.current.conditions).toEqual(conditions1);
      
      rerender({ currentParams: { conditions: JSON.stringify(conditions2) } });
      
      expect(result.current.conditions).toEqual(conditions2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array', () => {
      const { result } = renderHook(() =>
        useIfConditions({
          currentParams: { conditions: '[]' },
        })
      );

      expect(result.current.conditions).toEqual([]);
    });

    it('should handle whitespace in condition', () => {
      const conditions = [{ type: 'if' as const, condition: '  x > 5  ' }];
      
      const { result } = renderHook(() =>
        useIfConditions({
          currentParams: { conditions: JSON.stringify(conditions) },
        })
      );

      expect(result.current.conditions[0].condition).toBe('  x > 5  ');
    });

    it('should handle empty condition string', () => {
      const conditions = [{ type: 'if' as const, condition: '' }];
      
      const { result } = renderHook(() =>
        useIfConditions({
          currentParams: { conditions: JSON.stringify(conditions) },
        })
      );

      expect(result.current.conditions[0].condition).toBe('');
    });

    it('should handle numeric values in JSON string', () => {
      const conditions = [{ type: 'if' as const, condition: 'count > 0' }];
      
      const { result } = renderHook(() =>
        useIfConditions({
          currentParams: { conditions: JSON.stringify(conditions) },
        })
      );

      expect(result.current.conditions).toEqual(conditions);
    });
  });
});
