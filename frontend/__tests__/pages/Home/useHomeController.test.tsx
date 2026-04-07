import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import useHomeController from '../../../src/pages/Home/useHomeController';

const mockNavigate = jest.fn();
const mockOpen = jest.fn();
const mockUnwrap = jest.fn().mockResolvedValue({ rules: [], total: 0 });
const mockGetRules = jest.fn(() => ({
  unwrap: mockUnwrap,
}));
const mockExtractData = jest.fn();
const mockInsertData = jest.fn();
const mockRemoveData = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../src/contexts/ModalContext', () => ({
  useModal: () => ({ open: mockOpen }),
}));

jest.mock('../../../src/redux/Api/Rules', () => ({
  useGetRulesMutation: () => [
    mockGetRules,
    { isLoading: false },
  ],
  useGetStatusQuery: () => ({
    data: ['In Progress', 'On Hold', 'Under Review'],
    isLoading: false,
  }),
}));

jest.mock('../../../src/hooks/useFilters', () => ({
  __esModule: true,
  default: () => ({
    offset: 0,
    limit: 10,
    setOffset: jest.fn(),
  }),
}));

jest.mock('../../../src/redux/Api/Simulation', () => ({
  useMergeBranchMutation: jest.fn(() => [
    jest.fn(),
    {
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: undefined,
      data: undefined,
    },
  ]),
  useCreateRepoMutation: jest.fn(() => [
    jest.fn(),
    {
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: undefined,
      data: undefined,
    },
  ]),
  useUploadCodeMutation: jest.fn(() => [
    jest.fn(),
    {
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: undefined,
      data: undefined,
    },
  ]),
  useLazyGetReportQuery: jest.fn(() => [
    jest.fn(),
    {
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: undefined,
      data: undefined,
    },
  ]),
  useLazyGetReportStatusQuery: jest.fn(() => [
    jest.fn(),
    {
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: undefined,
      data: undefined,
    },
  ]),
}));

jest.mock('../../../src/utils/Common/storage', () => ({
  extractData: (key: string) => mockExtractData(key),
  insertData: (...args: unknown[]) => mockInsertData(...args),
  removeData: (...args: unknown[]) => mockRemoveData(...args),
}));

describe('useHomeController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExtractData.mockReturnValue({ claims: 'editor' });
    mockUnwrap.mockResolvedValue({ rules: [], total: 0 });
  });

  describe('Hook Initialization', () => {
    it('should initialize with default state', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values).toBeDefined();
        expect(result.current.functions).toBeDefined();
      });
    });

    it('should have values object', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values).toHaveProperty('columns');
        expect(result.current.values).toHaveProperty('data');
        expect(result.current.values).toHaveProperty('isLoading');
      });
    });

    it('should have functions object', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.functions).toHaveProperty('handleCreateEdit');
        expect(result.current.functions).toHaveProperty('setSearchTerm');
        expect(result.current.functions).toHaveProperty('setStatus');
      });
    });

    it('should extract user data on mount', async () => {
      renderHook(() => useHomeController());

      await waitFor(() => {
        expect(mockExtractData).toHaveBeenCalledWith('user');
      });
    });
  });

  describe('State Management', () => {
    it('should initialize searchTerm as empty string', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values.searchTerm).toBe('');
      });
    });

    it('should initialize status as null', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values.status).toBeNull();
      });
    });

    it('should initialize ruleType as null', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values.ruleType).toBeNull();
      });
    });

    it('should update searchTerm', async () => {
      const { result } = renderHook(() => useHomeController());

      await act(async () => {
        result.current.functions.setSearchTerm('test');
      });

      await waitFor(() => {
        expect(result.current.values.searchTerm).toBe('test');
      });
    });

    it('should update status', async () => {
      const { result } = renderHook(() => useHomeController());

      const statusOption = { label: 'Active', value: 'active' };

      await act(async () => {
        result.current.functions.setStatus(statusOption);
      });

      await waitFor(() => {
        expect(result.current.values.status).toEqual(statusOption);
      });
    });

    it('should update ruleType', async () => {
      const { result } = renderHook(() => useHomeController());

      const ruleTypeOption = { label: 'Type A', value: 'typeA' };

      await act(async () => {
        result.current.functions.setRuleType(ruleTypeOption);
      });

      await waitFor(() => {
        expect(result.current.values.ruleType).toEqual(ruleTypeOption);
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch rules on mount', async () => {
      renderHook(() => useHomeController());

      await waitFor(() => {
        expect(mockGetRules).toHaveBeenCalled();
      });
    });

    it('should call getRules with correct params', async () => {
      renderHook(() => useHomeController());

      await waitFor(() => {
        expect(mockGetRules).toHaveBeenCalledWith({
          params: { offset: 0, limit: 10 },
          body: {
            ruleName: undefined,
            status: undefined,
            ruleType: undefined,
          },
        });
      });
    });

    it('should handle successful data fetch', async () => {
      const mockRules = [
        { id: '1', rule_name: 'Rule 1' },
        { id: '2', rule_name: 'Rule 2' },
      ];

      mockUnwrap.mockResolvedValueOnce({ rules: mockRules, total: 2 });

      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values.data).toEqual(mockRules);
      });
    });

    it('should update total count', async () => {
      mockUnwrap.mockResolvedValueOnce({ rules: [], total: 5 });

      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values.pagination.total).toBe(5);
      });
    });
  });

  describe('Filter Functions', () => {
    it('should reset all filters', async () => {
      const { result } = renderHook(() => useHomeController());

      await act(async () => {
        result.current.functions.setSearchTerm('test');
        result.current.functions.setStatus({ label: 'Active', value: 'active' });
        result.current.functions.setRuleType({ label: 'Type', value: 'type' });
      });

      await act(async () => {
        result.current.functions.resetFilter();
      });

      await waitFor(() => {
        expect(result.current.values.searchTerm).toBe('');
        expect(result.current.values.status).toBeNull();
        expect(result.current.values.ruleType).toBeNull();
      });
    });

    it('should fetch rules after filter change', async () => {
      const { result } = renderHook(() => useHomeController());

      mockGetRules.mockClear();

      await act(async () => {
        result.current.functions.setSearchTerm('test rule');
      });

      await waitFor(() => {
        expect(mockGetRules).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation Functions', () => {
    it('should navigate to editor on create', async () => {
      const { result } = renderHook(() => useHomeController());

      await act(async () => {
        result.current.functions.handleCreateEdit();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/editor');
      });
    });

    it('should remove data on create', async () => {
      const { result } = renderHook(() => useHomeController());

      await act(async () => {
        result.current.functions.handleCreateEdit();
      });

      await waitFor(() => {
        expect(mockRemoveData).toHaveBeenCalled();
      });
    });

    it('should navigate to edit mode with row data', async () => {
      const { result } = renderHook(() => useHomeController());

      const row = { id: '123', rule_name: 'Test Rule' };

      await act(async () => {
        result.current.functions.handleCreateEdit(row);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/editor/123?mode=edit');
      });
    });
  });

  describe('Columns Configuration', () => {
    it('should have correct column structure', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values.columns).toBeDefined();
        expect(Array.isArray(result.current.values.columns)).toBe(true);
      });
    });

    it('should include Rule Name column', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        const ruleNameCol = result.current.values.columns.find(
          (col: { key: string }) => col.key === 'rule_name'
        );
        expect(ruleNameCol).toBeDefined();
      });
    });

    it('should include Status column', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        const statusCol = result.current.values.columns.find(
          (col: { key: string }) => col.key === 'status'
        );
        expect(statusCol).toBeDefined();
      });
    });

    it('should include Actions column', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        const actionsCol = result.current.values.columns.find(
          (col: { key: string }) => col.key === 'actions'
        );
        expect(actionsCol).toBeDefined();
      });
    });
  });

  describe('Pagination', () => {
    it('should have pagination object', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values.pagination).toBeDefined();
        expect(result.current.values.pagination).toHaveProperty('offset');
        expect(result.current.values.pagination).toHaveProperty('limit');
        expect(result.current.values.pagination).toHaveProperty('total');
      });
    });

    it('should initialize with offset 0', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values.pagination.offset).toBe(0);
      });
    });

    it('should have limit of 10', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values.pagination.limit).toBe(10);
      });
    });
  });

  describe('Status Options', () => {
    it('should have statusOptions array', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values.statusOptions).toBeDefined();
        expect(Array.isArray(result.current.values.statusOptions)).toBe(true);
      });
    });

    it('should include All option', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        const allOption = result.current.values.statusOptions.find(
          (opt: { label: string }) => opt.label === 'All'
        );
        expect(allOption).toBeDefined();
      });
    });

    it('should map status data correctly', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values.statusOptions.length).toBeGreaterThan(1);
      });
    });
  });

  describe('Rule Type Options', () => {
    it('should have ruleTypes array', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values.ruleTypes).toBeDefined();
        expect(Array.isArray(result.current.values.ruleTypes)).toBe(true);
      });
    });

    it('should include All option for rule types', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        const allOption = result.current.values.ruleTypes.find(
          (opt: { label: string }) => opt.label === 'All'
        );
        expect(allOption).toBeDefined();
      });
    });
  });

  describe('User Permissions', () => {
    it('should extract user data', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values.user).toBeDefined();
      });
    });

    it('should check editor claims', async () => {
      mockExtractData.mockReturnValue({ claims: 'editor' });

      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values.user.claims).toBe('editor');
      });
    });
  });

  describe('Loading States', () => {
    it('should have isLoading state', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values).toHaveProperty('isLoading');
      });
    });

    it('should have statusLoad state', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values).toHaveProperty('statusLoad');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      mockUnwrap.mockRejectedValueOnce(new Error('Fetch failed'));

      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values.data).toEqual([]);
      });
    });
  });

  describe('Publishing Options', () => {
    it('should have publishingOptions array', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(result.current.values.publishingOptions).toBeDefined();
        expect(Array.isArray(result.current.values.publishingOptions)).toBe(true);
      });
    });
  });

  describe('Hook Stability', () => {
    it('should maintain function references', async () => {
      const { result } = renderHook(() => useHomeController());

      await waitFor(() => {
        expect(typeof result.current.functions.handleCreateEdit).toBe('function');
        expect(typeof result.current.functions.setSearchTerm).toBe('function');
        expect(typeof result.current.functions.setStatus).toBe('function');
        expect(typeof result.current.functions.setRuleType).toBe('function');
        expect(typeof result.current.functions.resetFilter).toBe('function');
      });
    });
  });
});
