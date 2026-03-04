import { renderHook, act, waitFor } from '@testing-library/react';
import useFilters from '../../src/hooks/useFilters';

describe('useFilters', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useFilters());

      expect(result.current.search).toBe('');
      expect(result.current.debouncedSearch).toBe('');
      expect(result.current.offset).toBe(0);
      expect(result.current.limit).toBe(10);
    });

    it('should initialize with custom default offset', () => {
      const { result } = renderHook(() => useFilters({ default_offset: 20 }));

      expect(result.current.offset).toBe(20);
    });

    it('should initialize with custom default limit', () => {
      const { result } = renderHook(() => useFilters({ default_limit: 25 }));

      expect(result.current.limit).toBe(25);
    });

    it('should initialize with custom initial search', () => {
      const { result } = renderHook(() => useFilters({ initial_search: 'test' }));

      expect(result.current.search).toBe('test');
      expect(result.current.debouncedSearch).toBe('test');
    });

    it('should initialize with all custom options', () => {
      const { result } = renderHook(() =>
        useFilters({
          default_offset: 30,
          default_limit: 50,
          search_delay: 1000,
          initial_search: 'initial',
        })
      );

      expect(result.current.offset).toBe(30);
      expect(result.current.limit).toBe(50);
      expect(result.current.search).toBe('initial');
      expect(result.current.debouncedSearch).toBe('initial');
    });
  });

  describe('Return Value Structure', () => {
    it('should return all required properties', () => {
      const { result } = renderHook(() => useFilters());

      expect(result.current).toHaveProperty('search');
      expect(result.current).toHaveProperty('debouncedSearch');
      expect(result.current).toHaveProperty('setSearch');
      expect(result.current).toHaveProperty('offset');
      expect(result.current).toHaveProperty('limit');
      expect(result.current).toHaveProperty('setOffset');
      expect(result.current).toHaveProperty('setLimit');
      expect(result.current).toHaveProperty('getPaginationParams');
      expect(result.current).toHaveProperty('resetPagination');
    });

    it('should return correct types', () => {
      const { result } = renderHook(() => useFilters());

      expect(typeof result.current.search).toBe('string');
      expect(typeof result.current.debouncedSearch).toBe('string');
      expect(typeof result.current.setSearch).toBe('function');
      expect(typeof result.current.offset).toBe('number');
      expect(typeof result.current.limit).toBe('number');
      expect(typeof result.current.setOffset).toBe('function');
      expect(typeof result.current.setLimit).toBe('function');
      expect(typeof result.current.getPaginationParams).toBe('function');
      expect(typeof result.current.resetPagination).toBe('function');
    });
  });

  describe('Search Functionality', () => {
    it('should update search immediately', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setSearch('query');
      });

      expect(result.current.search).toBe('query');
      expect(result.current.debouncedSearch).toBe('');
    });

    it('should debounce search with default delay', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setSearch('debounced');
      });

      expect(result.current.debouncedSearch).toBe('');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.debouncedSearch).toBe('debounced');
    });

    it('should debounce search with custom delay', () => {
      const { result } = renderHook(() => useFilters({ search_delay: 1000 }));

      act(() => {
        result.current.setSearch('custom');
      });

      act(() => {
        jest.advanceTimersByTime(999);
      });

      expect(result.current.debouncedSearch).toBe('');

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current.debouncedSearch).toBe('custom');
    });
  });

  describe('Pagination Functionality', () => {
    it('should update offset', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setOffset(50);
      });

      expect(result.current.offset).toBe(50);
    });

    it('should update limit', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setLimit(25);
      });

      expect(result.current.limit).toBe(25);
    });

    it('should return pagination params', () => {
      const { result } = renderHook(() => useFilters());

      const params = result.current.getPaginationParams();

      expect(params).toEqual({
        offset: 0,
        limit: 10,
      });
    });

    it('should reset pagination to defaults', () => {
      const { result } = renderHook(() => useFilters({ default_offset: 0, default_limit: 10 }));

      act(() => {
        result.current.setOffset(100);
        result.current.setLimit(50);
      });

      act(() => {
        result.current.resetPagination();
      });

      expect(result.current.offset).toBe(0);
      expect(result.current.limit).toBe(10);
    });
  });

  describe('Integration: Search and Pagination', () => {
    it('should reset offset when debounced search changes', () => {
      const { result } = renderHook(() => useFilters({ default_offset: 0 }));

      act(() => {
        result.current.setOffset(50);
      });

      expect(result.current.offset).toBe(50);

      act(() => {
        result.current.setSearch('new search');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.offset).toBe(0);
    });

    it('should not reset offset on immediate search value change', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setOffset(50);
      });

      act(() => {
        result.current.setSearch('typing');
      });

      expect(result.current.offset).toBe(50);
    });

    it('should reset offset to custom default on search', () => {
      const { result } = renderHook(() => useFilters({ default_offset: 20 }));

      act(() => {
        result.current.setOffset(100);
      });

      act(() => {
        result.current.setSearch('query');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.offset).toBe(20);
    });

    it('should maintain limit when search changes', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setLimit(25);
      });

      act(() => {
        result.current.setSearch('query');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.limit).toBe(25);
    });
  });

  describe('Typical Usage Flow', () => {
    it('should handle complete filtering and pagination flow', () => {
      const { result } = renderHook(() => useFilters());

      // Initial state
      expect(result.current.search).toBe('');
      expect(result.current.offset).toBe(0);
      expect(result.current.limit).toBe(10);

      // User types search query
      act(() => {
        result.current.setSearch('product');
      });

      expect(result.current.search).toBe('product');

      // After debounce, search happens and offset resets
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.debouncedSearch).toBe('product');
      expect(result.current.offset).toBe(0);

      // User goes to page 2
      act(() => {
        result.current.setOffset(10);
      });

      expect(result.current.offset).toBe(10);

      // User changes page size
      act(() => {
        result.current.setLimit(25);
      });

      expect(result.current.limit).toBe(25);

      // User searches again
      act(() => {
        result.current.setSearch('new search');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.debouncedSearch).toBe('new search');
      expect(result.current.offset).toBe(0);
      expect(result.current.limit).toBe(25);
    });

    it('should handle clearing search', () => {
      const { result } = renderHook(() => useFilters({ initial_search: 'initial' }));

      act(() => {
        result.current.setOffset(30);
      });

      act(() => {
        result.current.setSearch('');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.debouncedSearch).toBe('');
      expect(result.current.offset).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid search changes', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setSearch('a');
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      act(() => {
        result.current.setSearch('ab');
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      act(() => {
        result.current.setSearch('abc');
      });

      expect(result.current.search).toBe('abc');
      expect(result.current.debouncedSearch).toBe('');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.debouncedSearch).toBe('abc');
    });

    it('should handle zero search delay', () => {
      const { result } = renderHook(() => useFilters({ search_delay: 0 }));

      act(() => {
        result.current.setSearch('instant');
      });

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current.debouncedSearch).toBe('instant');
    });

    it('should handle multiple offset resets', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setOffset(50);
      });

      act(() => {
        result.current.setSearch('first');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.offset).toBe(0);

      act(() => {
        result.current.setOffset(30);
      });

      act(() => {
        result.current.setSearch('second');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.offset).toBe(0);
    });

    it('should not reset offset if search value returns to same debounced value', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setSearch('test');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      act(() => {
        result.current.setOffset(50);
      });

      act(() => {
        result.current.setSearch('tes');
      });

      act(() => {
        result.current.setSearch('test');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Offset stays as debounced search didn't actually change
      expect(result.current.offset).toBe(50);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset pagination while maintaining search', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setSearch('query');
        result.current.setOffset(100);
        result.current.setLimit(50);
      });

      act(() => {
        result.current.resetPagination();
      });

      expect(result.current.search).toBe('query');
      expect(result.current.offset).toBe(0);
      expect(result.current.limit).toBe(10);
    });
  });
});
