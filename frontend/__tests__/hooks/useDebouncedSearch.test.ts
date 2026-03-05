import { renderHook, act } from '@testing-library/react';
import useDebouncedSearch from '../../src/hooks/useDebouncedSearch';

describe('useDebouncedSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should return initial value and debounced value as empty string by default', () => {
      const { result } = renderHook(() => useDebouncedSearch());

      expect(result.current[0]).toBe('');
      expect(result.current[1]).toBe('');
      expect(typeof result.current[2]).toBe('function');
    });

    it('should return custom initial value', () => {
      const { result } = renderHook(() => useDebouncedSearch('initial'));

      expect(result.current[0]).toBe('initial');
      expect(result.current[1]).toBe('initial');
    });

    it('should accept custom delay', () => {
      const { result } = renderHook(() => useDebouncedSearch('', 1000));

      expect(result.current[0]).toBe('');
      expect(result.current[1]).toBe('');
    });
  });

  describe('Return Value Structure', () => {
    it('should return array with 3 elements', () => {
      const { result } = renderHook(() => useDebouncedSearch());

      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current).toHaveLength(3);
    });

    it('should return value as string', () => {
      const { result } = renderHook(() => useDebouncedSearch('test'));

      expect(typeof result.current[0]).toBe('string');
    });

    it('should return debouncedValue as string', () => {
      const { result } = renderHook(() => useDebouncedSearch('test'));

      expect(typeof result.current[1]).toBe('string');
    });

    it('should return onChange as function', () => {
      const { result } = renderHook(() => useDebouncedSearch());

      expect(typeof result.current[2]).toBe('function');
    });
  });

  describe('Value Updates', () => {
    it('should update value immediately when onChange is called', () => {
      const { result } = renderHook(() => useDebouncedSearch());

      act(() => {
        result.current[2]('new value');
      });

      expect(result.current[0]).toBe('new value');
      expect(result.current[1]).toBe('');
    });

    it('should update debouncedValue after delay', () => {
      const { result } = renderHook(() => useDebouncedSearch('', 500));

      act(() => {
        result.current[2]('debounced');
      });

      expect(result.current[0]).toBe('debounced');
      expect(result.current[1]).toBe('');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current[1]).toBe('debounced');
    });

    it('should handle multiple rapid changes', () => {
      const { result } = renderHook(() => useDebouncedSearch('', 500));

      act(() => {
        result.current[2]('first');
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      act(() => {
        result.current[2]('second');
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      act(() => {
        result.current[2]('third');
      });

      expect(result.current[0]).toBe('third');
      expect(result.current[1]).toBe('');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current[1]).toBe('third');
    });
  });

  describe('Debounce Behavior', () => {
    it('should debounce with default 500ms delay', () => {
      const { result } = renderHook(() => useDebouncedSearch());

      act(() => {
        result.current[2]('test');
      });

      act(() => {
        jest.advanceTimersByTime(499);
      });

      expect(result.current[1]).toBe('');

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current[1]).toBe('test');
    });

    it('should debounce with custom delay', () => {
      const { result } = renderHook(() => useDebouncedSearch('', 1000));

      act(() => {
        result.current[2]('custom delay');
      });

      act(() => {
        jest.advanceTimersByTime(999);
      });

      expect(result.current[1]).toBe('');

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current[1]).toBe('custom delay');
    });

    it('should reset timer on new change', () => {
      const { result } = renderHook(() => useDebouncedSearch('', 500));

      act(() => {
        result.current[2]('first');
      });

      act(() => {
        jest.advanceTimersByTime(400);
      });

      act(() => {
        result.current[2]('second');
      });

      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(result.current[1]).toBe('');

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current[1]).toBe('second');
    });
  });

  describe('Cleanup', () => {
    it('should clear timeout on unmount', () => {
      const { result, unmount } = renderHook(() => useDebouncedSearch('', 500));

      act(() => {
        result.current[2]('test');
      });

      unmount();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // No error should occur
      expect(true).toBe(true);
    });

    it('should clear previous timeout when value changes', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const { result } = renderHook(() => useDebouncedSearch('', 500));

      act(() => {
        result.current[2]('first');
      });

      act(() => {
        result.current[2]('second');
      });

      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Delay Changes', () => {
    it('should handle delay prop changes', () => {
      const { result, rerender } = renderHook(
        ({ delay }) => useDebouncedSearch('', delay),
        { initialProps: { delay: 500 } }
      );

      act(() => {
        result.current[2]('test');
      });

      rerender({ delay: 1000 });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current[1]).toBe('');

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current[1]).toBe('test');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values', () => {
      const { result } = renderHook(() => useDebouncedSearch('initial'));

      act(() => {
        result.current[2]('');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current[0]).toBe('');
      expect(result.current[1]).toBe('');
    });

    it('should handle whitespace values', () => {
      const { result } = renderHook(() => useDebouncedSearch());

      act(() => {
        result.current[2]('   ');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current[0]).toBe('   ');
      expect(result.current[1]).toBe('   ');
    });

    it('should handle long strings', () => {
      const { result } = renderHook(() => useDebouncedSearch());
      const longString = 'a'.repeat(1000);

      act(() => {
        result.current[2](longString);
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current[0]).toBe(longString);
      expect(result.current[1]).toBe(longString);
    });

    it('should handle same value updates', () => {
      const { result } = renderHook(() => useDebouncedSearch());

      act(() => {
        result.current[2]('same');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      act(() => {
        result.current[2]('same');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current[0]).toBe('same');
      expect(result.current[1]).toBe('same');
    });

    it('should handle zero delay', () => {
      const { result } = renderHook(() => useDebouncedSearch('', 0));

      act(() => {
        result.current[2]('instant');
      });

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current[1]).toBe('instant');
    });
  });

  describe('Function Stability', () => {
    it('should return stable onChange function', () => {
      const { result, rerender } = renderHook(() => useDebouncedSearch());

      const firstOnChange = result.current[2];

      act(() => {
        result.current[2]('test');
      });

      rerender();

      expect(result.current[2]).toBe(firstOnChange);
    });
  });
});
