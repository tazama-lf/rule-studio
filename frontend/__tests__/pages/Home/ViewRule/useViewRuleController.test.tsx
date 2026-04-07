import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import useViewRuleController from '../../../../src/pages/Home/ViewRule/useViewRuleController';

describe('useViewRuleController', () => {
  const mockData = {
    rule_name: 'Test Rule',
    txtp: 'Transaction Type A',
    version: '1.0.0',
    status: 'Active',
    publishing_status: 'Published',
    created_at: '2024-01-01T00:00:00Z',
    description: 'Test description',
  };

  describe('Hook Initialization', () => {
    it('should initialize with provided data', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      expect(result.current.values.data).toEqual(mockData);
    });

    it('should return values and functions objects', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      expect(result.current.values).toBeDefined();
      expect(result.current.functions).toBeDefined();
    });

    it('should have data in values', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      expect(result.current.values).toHaveProperty('data');
    });

    it('should have empty functions object', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      expect(result.current.functions).toEqual({});
    });
  });

  describe('Data Handling', () => {
    it('should handle rule_name field', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      expect(result.current.values.data.rule_name).toBe('Test Rule');
    });

    it('should handle txtp field', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      expect(result.current.values.data.txtp).toBe('Transaction Type A');
    });

    it('should handle version field', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      expect(result.current.values.data.version).toBe('1.0.0');
    });

    it('should handle status field', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      expect(result.current.values.data.status).toBe('Active');
    });

    it('should handle publishing_status field', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      expect(result.current.values.data.publishing_status).toBe('Published');
    });

    it('should handle created_at field', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      expect(result.current.values.data.created_at).toBe(
        '2024-01-01T00:00:00Z'
      );
    });

    it('should handle description field', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      expect(result.current.values.data.description).toBe('Test description');
    });
  });

  describe('Props Handling', () => {
    it('should accept ViewRuleProps interface', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      expect(result.current.values.data).toBeTruthy();
    });

    it('should destructure data from props', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      expect(result.current.values.data).toEqual(mockData);
    });

    it('should handle empty string values', () => {
      const emptyData = {
        rule_name: '',
        txtp: '',
        version: '',
        status: '',
        publishing_status: '',
        created_at: '',
        description: '',
      };

      const { result } = renderHook(() =>
        useViewRuleController({ data: emptyData })
      );

      expect(result.current.values.data).toEqual(emptyData);
    });
  });

  describe('Return Structure', () => {
    it('should return object with values and functions', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      expect(Object.keys(result.current)).toEqual(['values', 'functions']);
    });

    it('should have data property in values', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      expect(Object.keys(result.current.values)).toEqual(['data']);
    });

    it('should maintain data immutability', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      const originalData = result.current.values.data;
      expect(originalData).toEqual(mockData);
    });
  });

  describe('Edge Cases', () => {
    it('should handle partial data', () => {
      const partialData = {
        rule_name: 'Partial Rule',
        txtp: 'Type A',
      } as Record<string, string>;

      const { result } = renderHook(() =>
        useViewRuleController({ data: partialData })
      );

      expect(result.current.values.data.rule_name).toBe('Partial Rule');
      expect(result.current.values.data.txtp).toBe('Type A');
    });

    it('should handle additional properties', () => {
      const extendedData = {
        ...mockData,
        extraField: 'Extra Value',
      };

      const { result } = renderHook(() =>
        useViewRuleController({ data: extendedData })
      );

      expect(result.current.values.data).toHaveProperty('extraField');
    });

    it('should handle data updates', () => {
      const { result, rerender } = renderHook(
        ({ data }) => useViewRuleController({ data }),
        { initialProps: { data: mockData } }
      );

      const newData = { ...mockData, rule_name: 'Updated Rule' };
      rerender({ data: newData });

      expect(result.current.values.data.rule_name).toBe('Updated Rule');
    });
  });

  describe('Hook Stability', () => {
    it('should be stable across re-renders', () => {
      const { result, rerender } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      const firstRender = result.current;
      rerender();
      const secondRender = result.current;

      expect(firstRender.values.data).toEqual(secondRender.values.data);
    });

    it('should maintain reference equality for functions object', () => {
      const { result, rerender } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      const firstFunctions = result.current.functions;
      rerender();
      const secondFunctions = result.current.functions;

      expect(firstFunctions).toEqual(secondFunctions);
    });
  });

  describe('Type Safety', () => {
    it('should accept Record<string, string> type', () => {
      const stringRecord: Record<string, string> = {
        rule_name: 'Test',
        txtp: 'Type',
      };

      const { result } = renderHook(() =>
        useViewRuleController({ data: stringRecord })
      );

      expect(result.current.values.data).toEqual(stringRecord);
    });

    it('should handle all string values', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      Object.values(result.current.values.data).forEach((value) => {
        expect(typeof value).toBe('string');
      });
    });
  });

  describe('Data Access', () => {
    it('should provide direct access to all fields', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      const data = result.current.values.data;
      expect(data.rule_name).toBeDefined();
      expect(data.txtp).toBeDefined();
      expect(data.version).toBeDefined();
      expect(data.status).toBeDefined();
      expect(data.publishing_status).toBeDefined();
      expect(data.created_at).toBeDefined();
      expect(data.description).toBeDefined();
    });

    it('should maintain data integrity', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      expect(result.current.values.data).toEqual(mockData);
    });
  });

  describe('Hook Behavior', () => {
    it('should not have side effects', () => {
      const { result } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      expect(result.current.values.data).toEqual(mockData);
    });

    it('should be a pure hook', () => {
      const { result: result1 } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );
      const { result: result2 } = renderHook(() =>
        useViewRuleController({ data: mockData })
      );

      expect(result1.current.values.data).toEqual(result2.current.values.data);
    });
  });
});
