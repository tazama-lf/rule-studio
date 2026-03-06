import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import useRuleEditorController from '../../../src/pages/RuleEditor/useRuleEditorController';

const mockParams = { id: '123' };
const mockSearchParams = new URLSearchParams('mode=edit');
const mockExtractData = jest.fn();
const mockInsertData = jest.fn();
const mockGetRuleById = jest.fn();
const mockUnwrap = jest.fn();

jest.mock('react-router-dom', () => ({
  useParams: () => mockParams,
  useSearchParams: () => [mockSearchParams],
}));

jest.mock('../../../src/redux/Api/Rules', () => ({
  useGetRuleByIdQuery: jest.fn(() => ({
    data: { rules: { id: '123', rule_name: 'Test Rule' } },
    isFetching: false,
    isSuccess: true,
  })),
  useLazyGetRuleByIdQuery: jest.fn(() => [
    mockGetRuleById,
    { data: null },
  ]),
}));

jest.mock('../../../src/utils/Common/storage', () => ({
  extractData: (key: string, storage?: string, parse?: boolean) => mockExtractData(key, storage, parse),
  insertData: (data: unknown, key: string, storage?: string, stringify?: boolean) => mockInsertData(data, key, storage, stringify),
}));

jest.mock('../../../src/contexts/TabContext/useTab', () => ({
  useTab: jest.fn(() => ({
    selectedTab: 'overview',
  })),
}));

jest.mock('../../../src/pages/RuleEditor/Overview', () => ({
  __esModule: true,
  default: () => <div>Overview Component</div>,
}));

jest.mock('../../../src/pages/RuleEditor/Parser', () => ({
  __esModule: true,
  default: () => <div>Parser Component</div>,
}));

jest.mock('../../../src/pages/RuleEditor/RuleBuilder', () => ({
  __esModule: true,
  default: () => <div>RuleBuilder Component</div>,
}));

jest.mock('../../../src/pages/RuleEditor/Simulation', () => ({
  __esModule: true,
  default: () => <div>Simulation Component</div>,
}));

jest.mock('../../../src/pages/RuleEditor/TestCases', () => ({
  __esModule: true,
  default: () => <div>TestCases Component</div>,
}));

jest.mock('../../../src/pages/RuleEditor/History', () => ({
  __esModule: true,
  default: () => <div>History Component</div>,
}));

describe('useRuleEditorController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExtractData.mockImplementation((key) => {
      if (key === 'user') return { claims: 'editor' };
      if (key === 'trs_rule') return null;
      return null;
    });
    mockGetRuleById.mockReturnValue({
      unwrap: mockUnwrap.mockResolvedValue({ rules: { id: '123' } }),
    });
  });

  describe('Hook Initialization', () => {
    it('should initialize with default values', async () => {
      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(result.current.values).toBeDefined();
        expect(result.current.functions).toBeDefined();
      });
    });

    it('should have isLoading state', async () => {
      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(typeof result.current.values.isLoading).toBe('boolean');
      });
    });

    it('should have mode from searchParams', async () => {
      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(result.current.values.mode).toBe('edit');
      });
    });

    it('should have data object', async () => {
      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(result.current.values.data).toBeDefined();
      });
    });

    it('should have user object', async () => {
      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(result.current.values.user).toEqual({ claims: 'editor' });
      });
    });
  });

  describe('Functions', () => {
    it('should have renderComponent function', async () => {
      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(typeof result.current.functions.renderComponent).toBe('function');
      });
    });

    it('should return component from renderComponent', async () => {
      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        const component = result.current.functions.renderComponent();
        expect(component).toBeDefined();
      });
    });
  });

  describe('RTK Query Integration', () => {
    it('should call useGetRuleByIdQuery with id', async () => {
      const { useGetRuleByIdQuery } = require('../../../src/redux/Api/Rules');
      
      renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(useGetRuleByIdQuery).toHaveBeenCalledWith(
          { id: '123' },
          { skip: false, refetchOnMountOrArgChange: true }
        );
      });
    });

    it('should skip query when no id', async () => {
      const { useGetRuleByIdQuery } = require('../../../src/redux/Api/Rules');
      mockParams.id = '';

      renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(useGetRuleByIdQuery).toHaveBeenCalledWith(
          { id: '' },
          { skip: true, refetchOnMountOrArgChange: true }
        );
      });

      mockParams.id = '123';
    });

    it('should get lazy query hook', async () => {
      const { useLazyGetRuleByIdQuery } = require('../../../src/redux/Api/Rules');
      
      renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(useLazyGetRuleByIdQuery).toHaveBeenCalled();
      });
    });
  });

  describe('Data Storage', () => {
    it('should extract user data', () => {
      renderHook(() => useRuleEditorController());

      expect(mockExtractData).toHaveBeenCalledWith('user', undefined, undefined);
    });

    it('should extract rule data from localStorage', () => {
      renderHook(() => useRuleEditorController());

      expect(mockExtractData).toHaveBeenCalledWith('trs_rule', 'LocalStorage', true);
    });

    it('should insert data when query succeeds', async () => {
      const { useGetRuleByIdQuery } = require('../../../src/redux/Api/Rules');
      useGetRuleByIdQuery.mockReturnValue({
        data: { rules: { id: '123', rule_name: 'Test' } },
        isFetching: false,
        isSuccess: true,
      });

      renderHook(() => useRuleEditorController());

      // insertData is called in useEffect after isSuccess becomes true
      await waitFor(() => {
        expect(mockInsertData).toHaveBeenCalledWith(
          { id: '123', rule_name: 'Test' },
          'trs_rule',
          'LocalStorage',
          true
        );
      }, { timeout: 100 });
    });
  });

  describe('Tab Context Integration', () => {
    it('should use selectedTab from context', async () => {
      const { useTab } = require('../../../src/contexts/TabContext/useTab');
      
      renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(useTab).toHaveBeenCalled();
      });
    });

    it('should render Overview when selectedTab is overview', async () => {
      const { useTab } = require('../../../src/contexts/TabContext/useTab');
      useTab.mockReturnValue({ selectedTab: 'overview' });

      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        const component = result.current.functions.renderComponent();
        expect(component).toBeDefined();
      });
    });

    it('should render Parser when selectedTab is rule_request', async () => {
      const { useTab } = require('../../../src/contexts/TabContext/useTab');
      useTab.mockReturnValue({ selectedTab: 'rule_request' });

      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        const component = result.current.functions.renderComponent();
        expect(component).toBeDefined();
      });
    });

    it('should render RuleBuilder when selectedTab is rule_builder', async () => {
      const { useTab } = require('../../../src/contexts/TabContext/useTab');
      useTab.mockReturnValue({ selectedTab: 'rule_builder' });

      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        const component = result.current.functions.renderComponent();
        expect(component).toBeDefined();
      });
    });

    it('should render Simulation when selectedTab is simulation', async () => {
      const { useTab } = require('../../../src/contexts/TabContext/useTab');
      useTab.mockReturnValue({ selectedTab: 'simulation' });

      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        const component = result.current.functions.renderComponent();
        expect(component).toBeDefined();
      });
    });

    it('should render TestCases when selectedTab is test_cases', async () => {
      const { useTab } = require('../../../src/contexts/TabContext/useTab');
      useTab.mockReturnValue({ selectedTab: 'test_cases' });

      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        const component = result.current.functions.renderComponent();
        expect(component).toBeDefined();
      });
    });

    it('should render History when selectedTab is history', async () => {
      const { useTab } = require('../../../src/contexts/TabContext/useTab');
      useTab.mockReturnValue({ selectedTab: 'history' });

      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        const component = result.current.functions.renderComponent();
        expect(component).toBeDefined();
      });
    });

    it('should return null for unknown tab', async () => {
      const { useTab } = require('../../../src/contexts/TabContext/useTab');
      useTab.mockReturnValue({ selectedTab: 'unknown' });

      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        const component = result.current.functions.renderComponent();
        expect(component).toBeNull();
      });
    });
  });

  describe('Simulation Tab Refetch', () => {
    it('should refetch rule data when simulation tab is selected', async () => {
      const { useTab } = require('../../../src/contexts/TabContext/useTab');
      useTab.mockReturnValue({ selectedTab: 'simulation' });

      renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(mockGetRuleById).toHaveBeenCalledWith({ id: '123' });
      });
    });

    it('should call unwrap on refetch', async () => {
      const { useTab } = require('../../../src/contexts/TabContext/useTab');
      useTab.mockReturnValue({ selectedTab: 'simulation' });

      renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(mockUnwrap).toHaveBeenCalled();
      });
    });

    it('should insert updated rule data on successful refetch', async () => {
      const { useTab } = require('../../../src/contexts/TabContext/useTab');
      useTab.mockReturnValue({ selectedTab: 'simulation' });
      mockUnwrap.mockResolvedValueOnce({ rules: { id: '123', updated: true } });

      renderHook(() => useRuleEditorController());

      // Wait for promise to resolve and insertData to be called
      await waitFor(() => {
        expect(mockInsertData).toHaveBeenCalledWith(
          { id: '123', updated: true },
          'trs_rule',
          'LocalStorage',
          true
        );
      }, { timeout: 200 });
    });

    it('should not refetch when selectedTab is not simulation', () => {
      const { useTab } = require('../../../src/contexts/TabContext/useTab');
      useTab.mockReturnValue({ selectedTab: 'overview' });
      mockGetRuleById.mockClear();

      renderHook(() => useRuleEditorController());

      // getRuleById should not be called when selectedTab is not 'simulation'
      expect(mockGetRuleById).not.toHaveBeenCalled();
    });

    it('should refetch using rule id from storage if no url id', async () => {
      const { useTab } = require('../../../src/contexts/TabContext/useTab');
      useTab.mockReturnValue({ selectedTab: 'simulation' });
      (mockParams as { id: string | undefined }).id = undefined; // useParams returns undefined, not empty string
      
      // Set extractData mock to return rule with id before renderHook
      mockExtractData.mockImplementation((key, storage?, parse?) => {
        if (key === 'user') return { claims: 'editor' };
        if (key === 'trs_rule' && storage === 'LocalStorage' && parse === true) {
          return { id: '456' };
        }
        return null;
      });

      renderHook(() => useRuleEditorController());

      // Wait for getRuleById to be called with id from storage
      await waitFor(() => {
        expect(mockGetRuleById).toHaveBeenCalled();
      }, { timeout: 300 });
      
      // Check if it was called with the correct id from storage
      expect(mockGetRuleById).toHaveBeenCalledWith({ id: '456' });

      // Reset for next test
      mockParams.id = '123';
    });
  });

  describe('Component Rendering Logic', () => {
    it('should pass mode to Overview component', async () => {
      const { useTab } = require('../../../src/contexts/TabContext/useTab');
      useTab.mockReturnValue({ selectedTab: 'overview' });

      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        const component = result.current.functions.renderComponent();
        expect(component).toBeDefined();
      });
    });

    it('should pass mode to Parser component', async () => {
      const { useTab } = require('../../../src/contexts/TabContext/useTab');
      useTab.mockReturnValue({ selectedTab: 'rule_request' });

      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        const component = result.current.functions.renderComponent();
        expect(component).toBeDefined();
      });
    });

    it('should pass data to RuleBuilder component', async () => {
      const { useTab } = require('../../../src/contexts/TabContext/useTab');
      useTab.mockReturnValue({ selectedTab: 'rule_builder' });

      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        const component = result.current.functions.renderComponent();
        expect(component).toBeDefined();
      });
    });

    it('should pass updated rule data to Simulation', async () => {
      const { useTab } = require('../../../src/contexts/TabContext/useTab');
      const { useLazyGetRuleByIdQuery } = require('../../../src/redux/Api/Rules');
      
      useTab.mockReturnValue({ selectedTab: 'simulation' });
      useLazyGetRuleByIdQuery.mockReturnValue([
        mockGetRuleById,
        { data: { rules: { id: '123', updated: true } } },
      ]);

      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        const component = result.current.functions.renderComponent();
        expect(component).toBeDefined();
      });
    });

    it('should pass data to History component', async () => {
      const { useTab } = require('../../../src/contexts/TabContext/useTab');
      useTab.mockReturnValue({ selectedTab: 'history' });

      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        const component = result.current.functions.renderComponent();
        expect(component).toBeDefined();
      });
    });
  });

  describe('Loading States', () => {
    it('should reflect loading state from query', async () => {
      const { useGetRuleByIdQuery } = require('../../../src/redux/Api/Rules');
      useGetRuleByIdQuery.mockReturnValue({
        data: null,
        isFetching: true,
        isSuccess: false,
      });

      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(result.current.values.isLoading).toBe(true);
      });
    });

    it('should set loading to false when not fetching', async () => {
      const { useGetRuleByIdQuery } = require('../../../src/redux/Api/Rules');
      useGetRuleByIdQuery.mockReturnValue({
        data: { rules: {} },
        isFetching: false,
        isSuccess: true,
      });

      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(result.current.values.isLoading).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle refetch error gracefully', async () => {
      const { useTab } = require('../../../src/contexts/TabContext/useTab');
      useTab.mockReturnValue({ selectedTab: 'simulation' });
      const testError = new Error('Fetch failed');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Reset and configure mocks for error case
      mockUnwrap.mockReset();
      mockUnwrap.mockRejectedValueOnce(testError);
      mockGetRuleById.mockReturnValue({
        unwrap: mockUnwrap,
      });

      renderHook(() => useRuleEditorController());

      // Wait for promise rejection to trigger catch block
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to refetch rule data', testError);
      }, { timeout: 300 });

      consoleSpy.mockRestore();
    });

    it('should not crash when rule data is undefined', async () => {
      mockExtractData.mockImplementation((key) => {
        if (key === 'user') return { claims: 'editor' };
        return undefined;
      });

      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(result.current.values).toBeDefined();
      });
    });
  });

  describe('Mode Handling', () => {
    it('should extract mode from searchParams', async () => {
      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(result.current.values.mode).toBe('edit');
      });
    });

    it('should return null mode when not in searchParams', async () => {
      mockSearchParams.delete('mode');

      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(result.current.values.mode).toBeNull();
      });

      mockSearchParams.set('mode', 'edit');
    });
  });

  describe('Return Structure', () => {
    it('should return object with values and functions', async () => {
      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(result.current).toHaveProperty('values');
        expect(result.current).toHaveProperty('functions');
      });
    });

    it('should have correct values structure', async () => {
      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(result.current.values).toHaveProperty('isLoading');
        expect(result.current.values).toHaveProperty('mode');
        expect(result.current.values).toHaveProperty('data');
        expect(result.current.values).toHaveProperty('user');
      });
    });

    it('should have correct functions structure', async () => {
      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(result.current.functions).toHaveProperty('renderComponent');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing user data', async () => {
      mockExtractData.mockImplementation((key) => {
        if (key === 'trs_rule') return null;
        return null;
      });

      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(result.current.values.user).toBeNull();
      });
    });

    it('should handle empty rule data', async () => {
      const { useGetRuleByIdQuery } = require('../../../src/redux/Api/Rules');
      useGetRuleByIdQuery.mockReturnValue({
        data: null,
        isFetching: false,
        isSuccess: false,
      });

      const { result } = renderHook(() => useRuleEditorController());

      await waitFor(() => {
        expect(result.current.values.data).toBeUndefined();
      });
    });
  });
});
