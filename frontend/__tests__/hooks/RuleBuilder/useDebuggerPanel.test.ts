import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebuggerPanel } from '../../../src/hooks/RuleBuilder/useDebuggerPanel';

describe('useDebuggerPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useDebuggerPanel({}));

      expect(result.current.panelHeight).toBe(80);
      expect(result.current.isResizing).toBe(false);
      expect(result.current.isDebuggerOpen).toBe(false);
    });

    it('should provide all expected functions and properties', () => {
      const { result } = renderHook(() => useDebuggerPanel({}));

      expect(typeof result.current.setPanelHeight).toBe('function');
      expect(typeof result.current.handleMouseDown).toBe('function');
      expect(typeof result.current.closeDebugger).toBe('function');
      expect(typeof result.current.toggleDebugger).toBe('function');
      expect(typeof result.current.setIsDebuggerOpen).toBe('function');
    });
  });

  describe('Auto-open on Play', () => {
    it('should open debugger when isPlaying becomes true', () => {
      const { result, rerender } = renderHook(
        ({ isPlaying }) => useDebuggerPanel({ isPlaying }),
        { initialProps: { isPlaying: false } }
      );

      expect(result.current.isDebuggerOpen).toBe(false);

      rerender({ isPlaying: true });
      
      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.isDebuggerOpen).toBe(true);
    });

    it('should not re-open debugger if already open', () => {
      const { result, rerender } = renderHook(
        ({ isPlaying }) => useDebuggerPanel({ isPlaying }),
        { initialProps: { isPlaying: false } }
      );

      act(() => {
        result.current.setIsDebuggerOpen(true);
      });

      expect(result.current.isDebuggerOpen).toBe(true);

      rerender({ isPlaying: true });
      
      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.isDebuggerOpen).toBe(true);
    });

    it('should not open debugger when isPlaying is undefined', () => {
      const { result } = renderHook(() => useDebuggerPanel({}));

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.isDebuggerOpen).toBe(false);
    });
  });

  describe('Panel Resizing', () => {
    let mockContainer: HTMLElement;

    beforeEach(() => {
      mockContainer = document.createElement('div');
      mockContainer.id = 'canvas-container';
      mockContainer.getBoundingClientRect = jest.fn(() => ({
        top: 0,
        left: 0,
        right: 1000,
        bottom: 800,
        width: 1000,
        height: 800,
        x: 0,
        y: 0,
        toJSON: () => {},
      }));
      document.body.appendChild(mockContainer);
    });

    afterEach(() => {
      document.body.removeChild(mockContainer);
    });

    it('should start resizing on mouse down', () => {
      const { result } = renderHook(() => useDebuggerPanel({}));

      act(() => {
        result.current.handleMouseDown();
      });

      expect(result.current.isResizing).toBe(true);
    });

    it('should stop resizing on mouse up', () => {
      const { result } = renderHook(() => useDebuggerPanel({}));

      act(() => {
        result.current.handleMouseDown();
      });

      expect(result.current.isResizing).toBe(true);

      act(() => {
        const mouseUpEvent = new MouseEvent('mouseup');
        window.dispatchEvent(mouseUpEvent);
      });

      expect(result.current.isResizing).toBe(false);
    });

    it('should update panel height during resize', () => {
      const { result } = renderHook(() => useDebuggerPanel({}));

      act(() => {
        result.current.handleMouseDown();
      });

      act(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', { clientY: 400 });
        window.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.panelHeight).toBe(50);
    });

    it('should not resize beyond minimum height (20%)', () => {
      const { result } = renderHook(() => useDebuggerPanel({}));

      act(() => {
        result.current.handleMouseDown();
      });

      act(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', { clientY: 700 });
        window.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.panelHeight).toBe(80);
    });

    it('should not resize beyond maximum height (70%)', () => {
      const { result } = renderHook(() => useDebuggerPanel({}));

      act(() => {
        result.current.handleMouseDown();
      });

      act(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', { clientY: 100 });
        window.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.panelHeight).toBe(80);
    });

    it('should only resize when isResizing is true', () => {
      const { result } = renderHook(() => useDebuggerPanel({}));

      expect(result.current.isResizing).toBe(false);

      const initialHeight = result.current.panelHeight;

      act(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', { clientY: 400 });
        window.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.panelHeight).toBe(initialHeight);
    });

    it('should handle missing container gracefully', () => {
      document.getElementById = jest.fn(() => null);

      const { result } = renderHook(() => useDebuggerPanel({}));

      act(() => {
        result.current.handleMouseDown();
      });

      act(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', { clientY: 400 });
        window.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.panelHeight).toBe(80);
    });
  });

  describe('closeDebugger', () => {
    it('should close the debugger', () => {
      const { result } = renderHook(() => useDebuggerPanel({}));

      act(() => {
        result.current.setIsDebuggerOpen(true);
      });

      expect(result.current.isDebuggerOpen).toBe(true);

      act(() => {
        result.current.closeDebugger();
      });

      expect(result.current.isDebuggerOpen).toBe(false);
    });
  });

  describe('toggleDebugger', () => {
    it('should toggle debugger from closed to open', () => {
      const { result } = renderHook(() => useDebuggerPanel({}));

      expect(result.current.isDebuggerOpen).toBe(false);

      act(() => {
        result.current.toggleDebugger();
      });

      expect(result.current.isDebuggerOpen).toBe(true);
    });

    it('should toggle debugger from open to closed', () => {
      const { result } = renderHook(() => useDebuggerPanel({}));

      act(() => {
        result.current.setIsDebuggerOpen(true);
      });

      expect(result.current.isDebuggerOpen).toBe(true);

      act(() => {
        result.current.toggleDebugger();
      });

      expect(result.current.isDebuggerOpen).toBe(false);
    });

    it('should toggle multiple times', () => {
      const { result } = renderHook(() => useDebuggerPanel({}));

      act(() => {
        result.current.toggleDebugger();
      });
      expect(result.current.isDebuggerOpen).toBe(true);

      act(() => {
        result.current.toggleDebugger();
      });
      expect(result.current.isDebuggerOpen).toBe(false);

      act(() => {
        result.current.toggleDebugger();
      });
      expect(result.current.isDebuggerOpen).toBe(true);
    });
  });

  describe('setPanelHeight', () => {
    it('should update panel height', () => {
      const { result } = renderHook(() => useDebuggerPanel({}));

      act(() => {
        result.current.setPanelHeight(60);
      });

      expect(result.current.panelHeight).toBe(60);
    });

    it('should allow any height value', () => {
      const { result } = renderHook(() => useDebuggerPanel({}));

      act(() => {
        result.current.setPanelHeight(10);
      });
      expect(result.current.panelHeight).toBe(10);

      act(() => {
        result.current.setPanelHeight(90);
      });
      expect(result.current.panelHeight).toBe(90);
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { result, unmount } = renderHook(() => useDebuggerPanel({}));

      act(() => {
        result.current.handleMouseDown();
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should not add listeners when not resizing', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      renderHook(() => useDebuggerPanel({}));

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('mousemove', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });
  });

  describe('Callback Stability', () => {
    it('should maintain handleMouseDown stability', () => {
      const { result, rerender } = renderHook(() => useDebuggerPanel({}));

      const first = result.current.handleMouseDown;
      rerender();

      expect(result.current.handleMouseDown).toBe(first);
    });

    it('should maintain closeDebugger stability', () => {
      const { result, rerender } = renderHook(() => useDebuggerPanel({}));

      const first = result.current.closeDebugger;
      rerender();

      expect(result.current.closeDebugger).toBe(first);
    });

    it('should maintain toggleDebugger stability', () => {
      const { result, rerender } = renderHook(() => useDebuggerPanel({}));

      const first = result.current.toggleDebugger;
      rerender();

      expect(result.current.toggleDebugger).toBe(first);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid toggle calls', () => {
      const { result } = renderHook(() => useDebuggerPanel({}));

      act(() => {
        result.current.toggleDebugger();
        result.current.toggleDebugger();
        result.current.toggleDebugger();
      });

      expect(result.current.isDebuggerOpen).toBe(true);
    });

    it('should handle setIsDebuggerOpen with explicit values', () => {
      const { result } = renderHook(() => useDebuggerPanel({}));

      act(() => {
        result.current.setIsDebuggerOpen(true);
      });
      expect(result.current.isDebuggerOpen).toBe(true);

      act(() => {
        result.current.setIsDebuggerOpen(true);
      });
      expect(result.current.isDebuggerOpen).toBe(true);

      act(() => {
        result.current.setIsDebuggerOpen(false);
      });
      expect(result.current.isDebuggerOpen).toBe(false);
    });

    it('should handle resize sequence', () => {
      const mockContainer = document.createElement('div');
      mockContainer.id = 'canvas-container';
      mockContainer.getBoundingClientRect = jest.fn(() => ({
        top: 0,
        left: 0,
        right: 1000,
        bottom: 800,
        width: 1000,
        height: 800,
        x: 0,
        y: 0,
        toJSON: () => {},
      }));
      document.body.appendChild(mockContainer);

      const { result } = renderHook(() => useDebuggerPanel({}));

      expect(result.current.isResizing).toBe(false);

      act(() => {
        result.current.handleMouseDown();
      });

      expect(result.current.isResizing).toBe(true);

      act(() => {
        const mouseUpEvent = new MouseEvent('mouseup');
        window.dispatchEvent(mouseUpEvent);
      });

      expect(result.current.isResizing).toBe(false);

      document.body.removeChild(mockContainer);
    });
  });
});
