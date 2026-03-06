import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import useRuleConfigController from '../../../../../src/pages/RuleEditor/Modals/RuleConfig/useRuleConfigController';
import type { DropdownOption } from '../../../../../src/components/DropDown';

const mockHandleRuleValue = jest.fn();
const mockSubmit = jest.fn();
const mockRuleConfigsData = [
  { ruleid: 'rule1', rulecfg: 'config1', tenantid: 'tenant1' },
  { ruleid: 'rule2', rulecfg: 'config2', tenantid: 'tenant2' },
  { ruleid: 'rule3', rulecfg: 'config3', tenantid: 'tenant3' },
];

jest.mock('../../../../../src/redux/Api/Rules', () => ({
  useGetRuleConfigsIdsQuery: jest.fn(() => ({
    data: mockRuleConfigsData,
    isLoading: false,
  })),
  useLazyGetRuleConfigQuery: jest.fn(() => [
    mockSubmit,
    { isLoading: false },
  ]),
}));

describe('useRuleConfigController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmit.mockResolvedValue({
      data: { config: 'test config data' },
    });
    
    // Reset the RTK Query mocks
    const { useGetRuleConfigsIdsQuery, useLazyGetRuleConfigQuery } = require('../../../../../src/redux/Api/Rules');
    useGetRuleConfigsIdsQuery.mockReturnValue({
      data: mockRuleConfigsData,
      isLoading: false,
    });
    useLazyGetRuleConfigQuery.mockReturnValue([
      mockSubmit,
      { isLoading: false },
    ]);
  });

  describe('Hook Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current.values).toBeDefined();
      expect(result.current.functions).toBeDefined();
    });

    it('should have ruleConfigs array', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current.values.ruleConfigs).toBeDefined();
      expect(Array.isArray(result.current.values.ruleConfigs)).toBe(true);
    });

    it('should have ruleId state', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current.values.ruleId).toBeDefined();
    });

    it('should have isLoading state', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current.values.isLoading).toBeDefined();
      expect(typeof result.current.values.isLoading).toBe('boolean');
    });

    it('should have configLoader state', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current.values.configLoader).toBeDefined();
      expect(typeof result.current.values.configLoader).toBe('boolean');
    });

    it('should have json state', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current.values).toHaveProperty('json');
    });

    it('should have isView computed value', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current.values.isView).toBeDefined();
      expect(typeof result.current.values.isView).toBe('boolean');
    });
  });

  describe('Props Handling', () => {
    it('should initialize with ruleConfigId when provided', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: 'rule1',
          mode: null,
        })
      );

      expect(result.current.values.ruleId).toEqual({
        label: 'rule1',
        value: 'rule1',
      });
    });

    it('should initialize with null ruleId when no ruleConfigId provided', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current.values.ruleId).toBeNull();
    });

    it('should set isView to true when mode is "view"', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: 'view',
        })
      );

      expect(result.current.values.isView).toBe(true);
    });

    it('should set isView to true when mode is "edit"', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: 'edit',
        })
      );

      expect(result.current.values.isView).toBe(true);
    });

    it('should set isView to false when mode is null', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current.values.isView).toBe(false);
    });

    it('should set isView to false when mode is neither view nor edit', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: 'create',
        })
      );

      expect(result.current.values.isView).toBe(false);
    });
  });

  describe('RTK Query Integration', () => {
    it('should call useGetRuleConfigsIdsQuery', () => {
      const { useGetRuleConfigsIdsQuery } = require('../../../../../src/redux/Api/Rules');

      renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(useGetRuleConfigsIdsQuery).toHaveBeenCalledWith({});
    });

    it('should call useLazyGetRuleConfigQuery', () => {
      const { useLazyGetRuleConfigQuery } = require('../../../../../src/redux/Api/Rules');

      renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(useLazyGetRuleConfigQuery).toHaveBeenCalled();
    });

    it('should handle loading state from query', () => {
      const { useGetRuleConfigsIdsQuery } = require('../../../../../src/redux/Api/Rules');
      useGetRuleConfigsIdsQuery.mockReturnValue({
        data: null,
        isLoading: true,
      });

      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current.values.isLoading).toBe(true);
    });

    it('should map rule configs data to dropdown options', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current.values.ruleConfigs).toEqual([
        { label: 'rule1', value: 'rule1' },
        { label: 'rule2', value: 'rule2' },
        { label: 'rule3', value: 'rule3' },
      ]);
    });

    it('should handle undefined data from query', () => {
      const { useGetRuleConfigsIdsQuery } = require('../../../../../src/redux/Api/Rules');
      useGetRuleConfigsIdsQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current.values.ruleConfigs).toBeUndefined();
    });
  });

  describe('Rule Config Fetching', () => {
    it('should fetch config when ruleId is set initially', async () => {
      renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: 'rule1',
          mode: null,
        })
      );

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({ id: 'rule1' });
      });
    });

    it('should not fetch config when ruleId is null', () => {
      renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('should update json state when config is fetched', async () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: 'rule1',
          mode: null,
        })
      );

      await waitFor(() => {
        expect(result.current.values.json).toEqual({ config: 'test config data' });
      });
    });

    it('should handle fetch error gracefully', async () => {
      mockSubmit.mockResolvedValue({
        data: null,
      });

      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: 'rule1',
          mode: null,
        })
      );

      await waitFor(() => {
        expect(result.current.values.json).toBeNull();
      });
    });
  });

  describe('handleRuleId Function', () => {
    it('should have handleRuleId function', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current.functions.handleRuleId).toBeDefined();
      expect(typeof result.current.functions.handleRuleId).toBe('function');
    });

    it('should update ruleId state when handleRuleId is called', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      const newValue: DropdownOption = { label: 'rule2', value: 'rule2' };

      act(() => {
        result.current.functions.handleRuleId(newValue);
      });

      expect(result.current.values.ruleId).toEqual(newValue);
    });

    it('should call handleRuleValue prop when handleRuleId is called', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      const newValue: DropdownOption = { label: 'rule2', value: 'rule2' };

      act(() => {
        result.current.functions.handleRuleId(newValue);
      });

      expect(mockHandleRuleValue).toHaveBeenCalledWith(newValue);
    });

    it('should trigger config fetch when ruleId changes', async () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      const newValue: DropdownOption = { label: 'rule2', value: 'rule2' };

      act(() => {
        result.current.functions.handleRuleId(newValue);
      });

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({ id: 'rule2' });
      });
    });
  });

  describe('useEffect Dependencies', () => {
    it('should refetch when ruleId changes', async () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: 'rule1',
          mode: null,
        })
      );

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({ id: 'rule1' });
      });

      const initialCallCount = mockSubmit.mock.calls.length;

      await act(async () => {
        result.current.functions.handleRuleId({ label: 'rule3', value: 'rule3' });
      });

      await waitFor(() => {
        expect(mockSubmit.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it('should not call submit when ruleId is set to null', async () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: 'rule1',
          mode: null,
        })
      );

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled();
      });

      mockSubmit.mockClear();

      await act(async () => {
        result.current.functions.handleRuleId(null as unknown as DropdownOption);
      });

      // Give it a moment to potentially call submit
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Return Structure', () => {
    it('should return object with values and functions', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current).toHaveProperty('values');
      expect(result.current).toHaveProperty('functions');
    });

    it('should have correct values structure', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current.values).toHaveProperty('ruleConfigs');
      expect(result.current.values).toHaveProperty('ruleId');
      expect(result.current.values).toHaveProperty('isLoading');
      expect(result.current.values).toHaveProperty('configLoader');
      expect(result.current.values).toHaveProperty('json');
      expect(result.current.values).toHaveProperty('isView');
    });

    it('should have correct functions structure', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current.functions).toHaveProperty('handleRuleId');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty rule configs array', () => {
      const { useGetRuleConfigsIdsQuery } = require('../../../../../src/redux/Api/Rules');
      useGetRuleConfigsIdsQuery.mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current.values.ruleConfigs).toEqual([]);
    });

    it('should handle null data from lazy query', async () => {
      mockSubmit.mockResolvedValue({
        data: null,
      });

      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: 'rule1',
          mode: null,
        })
      );

      await waitFor(() => {
        expect(result.current.values.json).toBeNull();
      });
    });

    it('should handle undefined response from lazy query', async () => {
      mockSubmit.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: 'rule1',
          mode: null,
        })
      );

      await waitFor(() => {
        expect(result.current.values.json).toBeNull();
      });
    });

    it('should handle various mode values', () => {
      const modes = ['view', 'edit', 'create', 'update', null];

      modes.forEach(mode => {
        const { result } = renderHook(() =>
          useRuleConfigController({
            handleRuleValue: mockHandleRuleValue,
            ruleConfigId: undefined,
            mode,
          })
        );

        const expectedIsView = mode === 'view' || mode === 'edit';
        expect(result.current.values.isView).toBe(expectedIsView);
      });
    });
  });

  describe('Config Loader State', () => {
    it('should reflect loading state from lazy query', () => {
      const { useLazyGetRuleConfigQuery } = require('../../../../../src/redux/Api/Rules');
      useLazyGetRuleConfigQuery.mockReturnValue([
        mockSubmit,
        { isLoading: true },
      ]);

      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current.values.configLoader).toBe(true);
    });

    it('should update configLoader when lazy query completes', () => {
      const { useLazyGetRuleConfigQuery } = require('../../../../../src/redux/Api/Rules');
      useLazyGetRuleConfigQuery.mockReturnValue([
        mockSubmit,
        { isLoading: false },
      ]);

      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current.values.configLoader).toBe(false);
    });
  });

  describe('Data Mapping', () => {
    it('should correctly map ruleid to label and value', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      const firstConfig = result.current.values.ruleConfigs?.[0];
      expect(firstConfig).toEqual({ label: 'rule1', value: 'rule1' });
    });

    it('should preserve all items from data', () => {
      const { result } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: undefined,
          mode: null,
        })
      );

      expect(result.current.values.ruleConfigs).toHaveLength(mockRuleConfigsData.length);
    });
  });

  describe('Integration', () => {
    it('should work with all props provided', () => {
      expect(() => {
        renderHook(() =>
          useRuleConfigController({
            handleRuleValue: mockHandleRuleValue,
            ruleConfigId: 'rule1',
            mode: 'view',
          })
        );
      }).not.toThrow();
    });

    it('should work with minimal props', () => {
      expect(() => {
        renderHook(() =>
          useRuleConfigController({
            handleRuleValue: mockHandleRuleValue,
            ruleConfigId: undefined,
            mode: null,
          })
        );
      }).not.toThrow();
    });

    it('should maintain state across re-renders', () => {
      const { result, rerender } = renderHook(() =>
        useRuleConfigController({
          handleRuleValue: mockHandleRuleValue,
          ruleConfigId: 'rule1',
          mode: null,
        })
      );

      const initialRuleId = result.current.values.ruleId;

      rerender();

      expect(result.current.values.ruleId).toEqual(initialRuleId);
    });
  });
});
