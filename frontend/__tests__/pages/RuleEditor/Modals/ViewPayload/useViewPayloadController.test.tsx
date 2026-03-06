import { renderHook } from '@testing-library/react';
import useViewPayloadController, { type IViewPayload } from '../../../../../src/pages/RuleEditor/Modals/ViewPayload/useViewPayloadController';

describe('useViewPayloadController', () => {
  describe('Hook Initialization', () => {
    it('should return values object with payload and result', () => {
      const props: IViewPayload = {
        data: {
          old_data: { key: 'value' },
          new_data: { result: 'success' },
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current).toHaveProperty('values');
      expect(result.current.values).toHaveProperty('payload');
      expect(result.current.values).toHaveProperty('result');
    });

    it('should extract payload from data.old_data', () => {
      const oldData = { transaction: 'tx123', amount: 1000 };
      const props: IViewPayload = {
        data: {
          old_data: oldData,
          new_data: {},
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current.values.payload).toEqual(oldData);
    });

    it('should extract result from data.new_data', () => {
      const newData = { status: 'processed', score: 0.95 };
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: newData,
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current.values.result).toEqual(newData);
    });

    it('should handle both old_data and new_data simultaneously', () => {
      const oldData = { input: 'data' };
      const newData = { output: 'result' };
      const props: IViewPayload = {
        data: {
          old_data: oldData,
          new_data: newData,
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current.values.payload).toEqual(oldData);
      expect(result.current.values.result).toEqual(newData);
    });
  });

  describe('Data Handling', () => {
    it('should handle undefined old_data', () => {
      const props: IViewPayload = {
        data: {
          new_data: { result: 'value' },
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current.values.payload).toBeUndefined();
    });

    it('should handle undefined new_data', () => {
      const props: IViewPayload = {
        data: {
          old_data: { payload: 'value' },
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current.values.result).toBeUndefined();
    });

    it('should handle empty data object', () => {
      const props: IViewPayload = {
        data: {},
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current.values.payload).toBeUndefined();
      expect(result.current.values.result).toBeUndefined();
    });

    it('should handle null values in old_data', () => {
      const props: IViewPayload = {
        data: {
          old_data: null,
          new_data: {},
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current.values.payload).toBeNull();
    });

    it('should handle null values in new_data', () => {
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: null,
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current.values.result).toBeNull();
    });

    it('should handle complex nested data structures', () => {
      const complexOldData = {
        transaction: {
          id: 'tx123',
          details: {
            amount: 1000,
            currency: 'USD',
          },
        },
        metadata: {
          timestamp: '2024-01-01',
          source: 'API',
        },
      };
      const complexNewData = {
        analysis: {
          risk_score: 0.75,
          flags: ['high_amount', 'new_account'],
        },
      };

      const props: IViewPayload = {
        data: {
          old_data: complexOldData,
          new_data: complexNewData,
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current.values.payload).toEqual(complexOldData);
      expect(result.current.values.result).toEqual(complexNewData);
    });

    it('should handle arrays in data', () => {
      const oldDataWithArray = {
        items: [1, 2, 3, 4, 5],
        records: [{ id: 1 }, { id: 2 }],
      };

      const props: IViewPayload = {
        data: {
          old_data: oldDataWithArray,
          new_data: {},
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current.values.payload).toEqual(oldDataWithArray);
      expect((result.current.values.payload as typeof oldDataWithArray).items).toHaveLength(5);
    });

    it('should handle data with various JavaScript types', () => {
      const mixedData = {
        string: 'text',
        number: 42,
        boolean: true,
        nullValue: null,
        undefinedValue: undefined,
        array: [1, 2, 3],
        object: { nested: 'value' },
      };

      const props: IViewPayload = {
        data: {
          old_data: mixedData,
          new_data: mixedData,
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current.values.payload).toEqual(mixedData);
      expect(result.current.values.result).toEqual(mixedData);
    });

    it('should handle empty arrays and objects', () => {
      const emptyData = {
        emptyArray: [],
        emptyObject: {},
      };

      const props: IViewPayload = {
        data: {
          old_data: emptyData,
          new_data: emptyData,
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current.values.payload).toEqual(emptyData);
      expect(result.current.values.result).toEqual(emptyData);
    });
  });

  describe('Props Updates', () => {
    it('should update payload when props change', () => {
      const initialProps: IViewPayload = {
        data: {
          old_data: { version: 1 },
          new_data: {},
        },
      };

      const { result, rerender } = renderHook(
        ({ props }) => useViewPayloadController(props),
        { initialProps: { props: initialProps } }
      );

      expect(result.current.values.payload).toEqual({ version: 1 });

      const updatedProps: IViewPayload = {
        data: {
          old_data: { version: 2 },
          new_data: {},
        },
      };

      rerender({ props: updatedProps });

      expect(result.current.values.payload).toEqual({ version: 2 });
    });

    it('should update result when props change', () => {
      const initialProps: IViewPayload = {
        data: {
          old_data: {},
          new_data: { status: 'pending' },
        },
      };

      const { result, rerender } = renderHook(
        ({ props }) => useViewPayloadController(props),
        { initialProps: { props: initialProps } }
      );

      expect(result.current.values.result).toEqual({ status: 'pending' });

      const updatedProps: IViewPayload = {
        data: {
          old_data: {},
          new_data: { status: 'completed' },
        },
      };

      rerender({ props: updatedProps });

      expect(result.current.values.result).toEqual({ status: 'completed' });
    });

    it('should update both values when props change', () => {
      const initialProps: IViewPayload = {
        data: {
          old_data: { input: 'A' },
          new_data: { output: 'X' },
        },
      };

      const { result, rerender } = renderHook(
        ({ props }) => useViewPayloadController(props),
        { initialProps: { props: initialProps } }
      );

      expect(result.current.values.payload).toEqual({ input: 'A' });
      expect(result.current.values.result).toEqual({ output: 'X' });

      const updatedProps: IViewPayload = {
        data: {
          old_data: { input: 'B' },
          new_data: { output: 'Y' },
        },
      };

      rerender({ props: updatedProps });

      expect(result.current.values.payload).toEqual({ input: 'B' });
      expect(result.current.values.result).toEqual({ output: 'Y' });
    });

    it('should handle multiple consecutive updates', () => {
      const initialProps: IViewPayload = {
        data: {
          old_data: { count: 0 },
          new_data: { result: 0 },
        },
      };

      const { result, rerender } = renderHook(
        ({ props }) => useViewPayloadController(props),
        { initialProps: { props: initialProps } }
      );

      for (let i = 1; i <= 5; i++) {
        const updatedProps: IViewPayload = {
          data: {
            old_data: { count: i },
            new_data: { result: i * 2 },
          },
        };

        rerender({ props: updatedProps });

        expect(result.current.values.payload).toEqual({ count: i });
        expect(result.current.values.result).toEqual({ result: i * 2 });
      }
    });
  });

  describe('Return Structure Validation', () => {
    it('should return object with values property', () => {
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: {},
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current).toHaveProperty('values');
      expect(typeof result.current.values).toBe('object');
    });

    it('should return values with exactly payload and result keys', () => {
      const props: IViewPayload = {
        data: {
          old_data: {},
          new_data: {},
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      const keys = Object.keys(result.current.values);
      expect(keys).toContain('payload');
      expect(keys).toContain('result');
      expect(keys).toHaveLength(2);
    });

    it('should maintain consistent structure across rerenders', () => {
      const props: IViewPayload = {
        data: {
          old_data: { test: 'data' },
          new_data: { test: 'result' },
        },
      };

      const { result, rerender } = renderHook(() => useViewPayloadController(props));

      const initialKeys = Object.keys(result.current);
      const initialValueKeys = Object.keys(result.current.values);

      rerender();

      const rerenderKeys = Object.keys(result.current);
      const rerenderValueKeys = Object.keys(result.current.values);

      expect(initialKeys).toEqual(rerenderKeys);
      expect(initialValueKeys).toEqual(rerenderValueKeys);
    });
  });

  describe('Edge Cases', () => {
    it('should handle data with special characters', () => {
      const specialData = {
        text: 'Special <>&"\' characters',
        unicode: '🚀 emoji test',
        escaped: 'Line 1\nLine 2\tTabbed',
      };

      const props: IViewPayload = {
        data: {
          old_data: specialData,
          new_data: specialData,
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current.values.payload).toEqual(specialData);
      expect(result.current.values.result).toEqual(specialData);
    });

    it('should handle very large data objects', () => {
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item_${i}` })),
      };

      const props: IViewPayload = {
        data: {
          old_data: largeData,
          new_data: largeData,
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect((result.current.values.payload as typeof largeData).items).toHaveLength(1000);
      expect((result.current.values.result as typeof largeData).items).toHaveLength(1000);
    });

    it('should handle deeply nested objects', () => {
      const deepData = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: 'deep',
                },
              },
            },
          },
        },
      };

      const props: IViewPayload = {
        data: {
          old_data: deepData,
          new_data: deepData,
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect((result.current.values.payload as typeof deepData).level1.level2.level3.level4.level5.value).toBe('deep');
    });

    it('should handle data with Date objects', () => {
      const dateData = {
        timestamp: new Date('2024-01-01'),
        createdAt: new Date('2024-01-15T10:30:00'),
      };

      const props: IViewPayload = {
        data: {
          old_data: dateData,
          new_data: {},
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current.values.payload).toEqual(dateData);
    });

    it('should handle data with numeric keys', () => {
      const numericKeyData = {
        '0': 'zero',
        '1': 'one',
        '2': 'two',
      };

      const props: IViewPayload = {
        data: {
          old_data: numericKeyData,
          new_data: {},
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current.values.payload).toEqual(numericKeyData);
    });

    it('should handle reference equality for same data', () => {
      const sharedData = { shared: 'data' };
      const props: IViewPayload = {
        data: {
          old_data: sharedData,
          new_data: sharedData,
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current.values.payload).toBe(sharedData);
      expect(result.current.values.result).toBe(sharedData);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle transaction payload and simulation result', () => {
      const transactionPayload = {
        transaction_id: 'tx_123456',
        amount: 5000,
        currency: 'USD',
        sender: {
          account: 'ACC001',
          name: 'John Doe',
        },
        receiver: {
          account: 'ACC002',
          name: 'Jane Smith',
        },
        timestamp: '2024-01-15T10:30:00Z',
      };

      const simulationResult = {
        risk_score: 0.85,
        fraud_indicators: ['high_amount', 'new_receiver', 'unusual_time'],
        recommendation: 'review',
        rules_triggered: [
          { rule_id: 'R001', name: 'High Amount Rule', score: 0.3 },
          { rule_id: 'R002', name: 'New Account Rule', score: 0.25 },
        ],
        typologies_matched: ['Money Laundering', 'Fraud'],
      };

      const props: IViewPayload = {
        data: {
          old_data: transactionPayload,
          new_data: simulationResult,
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current.values.payload).toEqual(transactionPayload);
      expect(result.current.values.result).toEqual(simulationResult);
      expect((result.current.values.result as typeof simulationResult).rules_triggered).toHaveLength(2);
    });

    it('should handle rule configuration payload', () => {
      const ruleConfig = {
        rule_id: 'R001',
        name: 'High Value Transaction Rule',
        config: {
          threshold: 10000,
          currency: 'USD',
          timeframe: '24h',
        },
        active: true,
      };

      const validationResult = {
        valid: true,
        errors: [],
        warnings: ['Currency conversion may affect accuracy'],
      };

      const props: IViewPayload = {
        data: {
          old_data: ruleConfig,
          new_data: validationResult,
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect((result.current.values.payload as typeof ruleConfig).rule_id).toBe('R001');
      expect((result.current.values.result as typeof validationResult).valid).toBe(true);
    });

    it('should handle empty simulation result', () => {
      const payload = {
        transaction_id: 'tx_789',
        amount: 100,
      };

      const props: IViewPayload = {
        data: {
          old_data: payload,
          new_data: {},
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current.values.payload).toEqual(payload);
      expect(result.current.values.result).toEqual({});
    });
  });

  describe('Type Interface', () => {
    it('should accept IViewPayload interface', () => {
      const props: IViewPayload = {
        data: {
          old_data: { test: 'value' },
          new_data: { result: 'success' },
        },
      };

      expect(() => renderHook(() => useViewPayloadController(props))).not.toThrow();
    });

    it('should accept data with unknown type values', () => {
      const props: IViewPayload = {
        data: {
          old_data: 'string value',
          new_data: 123,
          extra_field: true,
        },
      };

      const { result } = renderHook(() => useViewPayloadController(props));

      expect(result.current.values.payload).toBe('string value');
      expect(result.current.values.result).toBe(123);
    });
  });

  describe('Hook Export', () => {
    it('should export the hook as default', () => {
      expect(useViewPayloadController).toBeDefined();
      expect(typeof useViewPayloadController).toBe('function');
    });

    it('should export IViewPayload interface', () => {
      const props: IViewPayload = {
        data: {},
      };

      expect(props).toBeDefined();
    });
  });
});
