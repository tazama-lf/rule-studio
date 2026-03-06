 
import { renderHook, act } from '@testing-library/react';
import usePagination from '../../src/hooks/usePagination';

describe('usePagination', () => {
  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePagination());

      expect(result.current.offset).toBe(0);
      expect(result.current.limit).toBe(10);
    });

    it('should initialize with custom default offset', () => {
      const { result } = renderHook(() => usePagination({ default_offset: 20 }));

      expect(result.current.offset).toBe(20);
      expect(result.current.limit).toBe(10);
    });

    it('should initialize with custom default limit', () => {
      const { result } = renderHook(() => usePagination({ default_limit: 50 }));

      expect(result.current.offset).toBe(0);
      expect(result.current.limit).toBe(50);
    });

    it('should initialize with both custom offset and limit', () => {
      const { result } = renderHook(() =>
        usePagination({ default_offset: 30, default_limit: 25 })
      );

      expect(result.current.offset).toBe(30);
      expect(result.current.limit).toBe(25);
    });
  });

  describe('Return Value Structure', () => {
    it('should return all required properties', () => {
      const { result } = renderHook(() => usePagination());

      expect(result.current).toHaveProperty('offset');
      expect(result.current).toHaveProperty('limit');
      expect(result.current).toHaveProperty('setOffset');
      expect(result.current).toHaveProperty('setLimit');
      expect(result.current).toHaveProperty('getPaginationParams');
      expect(result.current).toHaveProperty('resetPagination');
    });

    it('should return offset as number', () => {
      const { result } = renderHook(() => usePagination());

      expect(typeof result.current.offset).toBe('number');
    });

    it('should return limit as number', () => {
      const { result } = renderHook(() => usePagination());

      expect(typeof result.current.limit).toBe('number');
    });

    it('should return setOffset as function', () => {
      const { result } = renderHook(() => usePagination());

      expect(typeof result.current.setOffset).toBe('function');
    });

    it('should return setLimit as function', () => {
      const { result } = renderHook(() => usePagination());

      expect(typeof result.current.setLimit).toBe('function');
    });

    it('should return getPaginationParams as function', () => {
      const { result } = renderHook(() => usePagination());

      expect(typeof result.current.getPaginationParams).toBe('function');
    });

    it('should return resetPagination as function', () => {
      const { result } = renderHook(() => usePagination());

      expect(typeof result.current.resetPagination).toBe('function');
    });
  });

  describe('Offset Updates', () => {
    it('should update offset when setOffset is called', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setOffset(100);
      });

      expect(result.current.offset).toBe(100);
    });

    it('should handle multiple offset updates', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setOffset(10);
      });

      expect(result.current.offset).toBe(10);

      act(() => {
        result.current.setOffset(20);
      });

      expect(result.current.offset).toBe(20);
    });

    it('should set offset to zero', () => {
      const { result } = renderHook(() => usePagination({ default_offset: 50 }));

      act(() => {
        result.current.setOffset(0);
      });

      expect(result.current.offset).toBe(0);
    });
  });

  describe('Limit Updates', () => {
    it('should update limit when setLimit is called', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setLimit(25);
      });

      expect(result.current.limit).toBe(25);
    });

    it('should handle multiple limit updates', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setLimit(50);
      });

      expect(result.current.limit).toBe(50);

      act(() => {
        result.current.setLimit(100);
      });

      expect(result.current.limit).toBe(100);
    });

    it('should update limit independently of offset', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setOffset(30);
        result.current.setLimit(20);
      });

      expect(result.current.offset).toBe(30);
      expect(result.current.limit).toBe(20);
    });
  });

  describe('getPaginationParams', () => {
    it('should return current offset and limit', () => {
      const { result } = renderHook(() => usePagination());

      const params = result.current.getPaginationParams();

      expect(params).toEqual({
        offset: 0,
        limit: 10,
      });
    });

    it('should return updated values after changes', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setOffset(40);
        result.current.setLimit(15);
      });

      const params = result.current.getPaginationParams();

      expect(params).toEqual({
        offset: 40,
        limit: 15,
      });
    });

    it('should return object with offset and limit properties', () => {
      const { result } = renderHook(() => usePagination());

      const params = result.current.getPaginationParams();

      expect(params).toHaveProperty('offset');
      expect(params).toHaveProperty('limit');
      expect(Object.keys(params)).toHaveLength(2);
    });
  });

  describe('resetPagination', () => {
    it('should reset to default values', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setOffset(50);
        result.current.setLimit(25);
      });

      act(() => {
        result.current.resetPagination();
      });

      expect(result.current.offset).toBe(0);
      expect(result.current.limit).toBe(10);
    });

    it('should reset to custom default values', () => {
      const { result } = renderHook(() =>
        usePagination({ default_offset: 20, default_limit: 30 })
      );

      act(() => {
        result.current.setOffset(100);
        result.current.setLimit(50);
      });

      act(() => {
        result.current.resetPagination();
      });

      expect(result.current.offset).toBe(20);
      expect(result.current.limit).toBe(30);
    });

    it('should be callable multiple times', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setOffset(100);
        result.current.resetPagination();
      });

      expect(result.current.offset).toBe(0);

      act(() => {
        result.current.setOffset(200);
        result.current.resetPagination();
      });

      expect(result.current.offset).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative offset', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setOffset(-10);
      });

      expect(result.current.offset).toBe(-10);
    });

    it('should handle large offset values', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setOffset(999999);
      });

      expect(result.current.offset).toBe(999999);
    });

    it('should handle limit of 1', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setLimit(1);
      });

      expect(result.current.limit).toBe(1);
    });

    it('should handle very large limit', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setLimit(10000);
      });

      expect(result.current.limit).toBe(10000);
    });

    it('should handle zero limit', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setLimit(0);
      });

      expect(result.current.limit).toBe(0);
    });
  });

  describe('Integration', () => {
    it('should work with typical pagination flow', () => {
      const { result } = renderHook(() => usePagination({ default_limit: 10 }));

      // Page 1
      expect(result.current.getPaginationParams()).toEqual({
        offset: 0,
        limit: 10,
      });

      // Go to page 2
      act(() => {
        result.current.setOffset(10);
      });

      expect(result.current.getPaginationParams()).toEqual({
        offset: 10,
        limit: 10,
      });

      // Go to page 3
      act(() => {
        result.current.setOffset(20);
      });

      expect(result.current.getPaginationParams()).toEqual({
        offset: 20,
        limit: 10,
      });

      // Change page size
      act(() => {
        result.current.setLimit(25);
        result.current.setOffset(0);
      });

      expect(result.current.getPaginationParams()).toEqual({
        offset: 0,
        limit: 25,
      });
    });

    it('should maintain independence of offset and limit', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setOffset(50);
      });

      expect(result.current.limit).toBe(10);

      act(() => {
        result.current.setLimit(30);
      });

      expect(result.current.offset).toBe(50);
    });
  });
});
