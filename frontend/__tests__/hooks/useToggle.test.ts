import { renderHook, act } from '@testing-library/react';
import useToggle from '../../src/hooks/useToggle';

describe('useToggle', () => {
  describe('Initialization', () => {
    it('should initialize with false by default', () => {
      const { result } = renderHook(() => useToggle());

      expect(result.current[0]).toBe(false);
    });

    it('should initialize with true when passed', () => {
      const { result } = renderHook(() => useToggle(true));

      expect(result.current[0]).toBe(true);
    });

    it('should initialize with false when explicitly passed', () => {
      const { result } = renderHook(() => useToggle(false));

      expect(result.current[0]).toBe(false);
    });
  });

  describe('Return Value Structure', () => {
    it('should return array with 2 elements', () => {
      const { result } = renderHook(() => useToggle());

      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current).toHaveLength(2);
    });

    it('should return boolean as first element', () => {
      const { result } = renderHook(() => useToggle());

      expect(typeof result.current[0]).toBe('boolean');
    });

    it('should return function as second element', () => {
      const { result } = renderHook(() => useToggle());

      expect(typeof result.current[1]).toBe('function');
    });
  });

  describe('Toggle Functionality', () => {
    it('should toggle from false to true', () => {
      const { result } = renderHook(() => useToggle(false));

      expect(result.current[0]).toBe(false);

      act(() => {
        result.current[1]();
      });

      expect(result.current[0]).toBe(true);
    });

    it('should toggle from true to false', () => {
      const { result } = renderHook(() => useToggle(true));

      expect(result.current[0]).toBe(true);

      act(() => {
        result.current[1]();
      });

      expect(result.current[0]).toBe(false);
    });

    it('should toggle multiple times', () => {
      const { result } = renderHook(() => useToggle());

      expect(result.current[0]).toBe(false);

      act(() => {
        result.current[1]();
      });

      expect(result.current[0]).toBe(true);

      act(() => {
        result.current[1]();
      });

      expect(result.current[0]).toBe(false);

      act(() => {
        result.current[1]();
      });

      expect(result.current[0]).toBe(true);
    });

    it('should toggle correctly in rapid succession', () => {
      const { result } = renderHook(() => useToggle());

      act(() => {
        result.current[1]();
        result.current[1]();
        result.current[1]();
      });

      expect(result.current[0]).toBe(true);
    });
  });

  describe('Function Stability', () => {
    it('should return stable toggle function', () => {
      const { result, rerender } = renderHook(() => useToggle());

      const firstToggle = result.current[1];

      act(() => {
        result.current[1]();
      });

      rerender();

      expect(result.current[1]).toBe(firstToggle);
    });

    it('should maintain stable toggle across state changes', () => {
      const { result } = renderHook(() => useToggle());

      const toggleFunction = result.current[1];

      act(() => {
        result.current[1]();
      });

      expect(result.current[1]).toBe(toggleFunction);

      act(() => {
        result.current[1]();
      });

      expect(result.current[1]).toBe(toggleFunction);
    });
  });

  describe('Edge Cases', () => {
    it('should handle calling toggle immediately after initialization', () => {
      const { result } = renderHook(() => useToggle(false));

      act(() => {
        result.current[1]();
      });

      expect(result.current[0]).toBe(true);
    });

    it('should work correctly when initialized with true', () => {
      const { result } = renderHook(() => useToggle(true));

      act(() => {
        result.current[1]();
        result.current[1]();
      });

      expect(result.current[0]).toBe(true);
    });

    it('should handle many consecutive toggles', () => {
      const { result } = renderHook(() => useToggle());

      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current[1]();
        });
      }

      expect(result.current[0]).toBe(false);
    });

    it('should handle odd number of toggles', () => {
      const { result } = renderHook(() => useToggle());

      for (let i = 0; i < 7; i++) {
        act(() => {
          result.current[1]();
        });
      }

      expect(result.current[0]).toBe(true);
    });
  });

  describe('Integration', () => {
    it('should work with typical modal open/close flow', () => {
      const { result } = renderHook(() => useToggle());

      // Modal closed initially
      expect(result.current[0]).toBe(false);

      // Open modal
      act(() => {
        result.current[1]();
      });

      expect(result.current[0]).toBe(true);

      // Close modal
      act(() => {
        result.current[1]();
      });

      expect(result.current[0]).toBe(false);
    });

    it('should work with dropdown toggle', () => {
      const { result } = renderHook(() => useToggle(false));

      // Click to open
      act(() => {
        result.current[1]();
      });

      expect(result.current[0]).toBe(true);

      // Click to close
      act(() => {
        result.current[1]();
      });

      expect(result.current[0]).toBe(false);

      // Click to open again
      act(() => {
        result.current[1]();
      });

      expect(result.current[0]).toBe(true);
    });

    it('should maintain independence across multiple instances', () => {
      const { result: result1 } = renderHook(() => useToggle());
      const { result: result2 } = renderHook(() => useToggle());

      act(() => {
        result1.current[1]();
      });

      expect(result1.current[0]).toBe(true);
      expect(result2.current[0]).toBe(false);

      act(() => {
        result2.current[1]();
      });

      expect(result1.current[0]).toBe(true);
      expect(result2.current[0]).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        return useToggle();
      });

      const initialRenderCount = renderCount;

      act(() => {
        result.current[1]();
      });

      expect(renderCount).toBe(initialRenderCount + 1);

      act(() => {
        result.current[1]();
      });

      expect(renderCount).toBe(initialRenderCount + 2);
    });
  });
});
