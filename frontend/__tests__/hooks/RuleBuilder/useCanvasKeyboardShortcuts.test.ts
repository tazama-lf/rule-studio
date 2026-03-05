import { renderHook, act } from '@testing-library/react';
import { useCanvasKeyboardShortcuts } from '../../../src/hooks/RuleBuilder/useCanvasKeyboardShortcuts';
import type { Node, Edge } from '@xyflow/react';

describe('useCanvasKeyboardShortcuts', ()=> {
  let mockNodes: Node[];
  let mockEdges: Edge[];
  let mockSetNodes: jest.Mock;
  let mockSetEdges: jest.Mock;
  let mockDeleteSelectedNodes: jest.Mock;
  let mockDeleteSelectedEdges: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockNodes = [
      {
        id: '1',
        type: 'editableNode',
        position: { x: 100, y: 100 },
        data: { nodeType: 'Start', label: 'Start' },
        selected: false,
      },
      {
        id: '2',
        type: 'editableNode',
        position: { x: 200, y: 200 },
        data: { nodeType: 'SetVariable', label: 'Set Var' },
        selected: true,
      },
    ];

    mockEdges = [
      {
        id: 'e1-2',
        source: '1',
        target: '2',
        selected: false,
      } as Edge,
    ];

    mockSetNodes = jest.fn();
    mockSetEdges = jest.fn();
    mockDeleteSelectedNodes = jest.fn();
    mockDeleteSelectedEdges = jest.fn();
  });

  describe('Initialization', () => {
    it('should return pushHistory and refs', () => {
      const { result } = renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      expect(result.current).toBeDefined();
      expect(typeof result.current.pushHistory).toBe('function');
      expect(result.current.historyRef).toBeDefined();
      expect(result.current.redoRef).toBeDefined();
    });

    it('should initialize with enabled by default', () => {
      const { result } = renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      expect(result.current).toBeDefined();
    });

    it('should respect enabled flag when false', () => {
      renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
          enabled: false,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'Delete' });
      window.dispatchEvent(event);

      expect(mockDeleteSelectedNodes).not.toHaveBeenCalled();
    });
  });

  describe('Delete Key', () => {
    it('should call deleteSelectedNodes when Delete key pressed and no edges selected', () => {
      renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'Delete', bubbles: true });
      Object.defineProperty(event, 'target', {
        value: document.body,
        enumerable: true,
      });
      window.dispatchEvent(event);

      expect(mockDeleteSelectedNodes).toHaveBeenCalled();
    });

    it('should call deleteSelectedEdges when Delete pressed and edges are selected', () => {
      const edgesWithSelection: Edge[] = [
        {
          id: 'e1-2',
          source: '1',
          target: '2',
          selected: true,
        } as Edge,
      ];

      renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: edgesWithSelection,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'Delete', bubbles: true });
      Object.defineProperty(event, 'target', {
        value: document.body,
        enumerable: true,
      });
      window.dispatchEvent(event);

      expect(mockDeleteSelectedEdges).toHaveBeenCalled();
      expect(mockDeleteSelectedNodes).not.toHaveBeenCalled();
    });

    it('should not delete when Delete pressed in input field', () => {
      renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      const input = document.createElement('input');
      const event = new KeyboardEvent('keydown', { key: 'Delete', bubbles: true });
      Object.defineProperty(event, 'target', {
        value: input,
        enumerable: true,
      });
      window.dispatchEvent(event);

      expect(mockDeleteSelectedNodes).not.toHaveBeenCalled();
    });

    it('should not delete when Delete pressed in textarea', () => {
      renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      const textarea = document.createElement('textarea');
      const event = new KeyboardEvent('keydown', { key: 'Delete', bubbles: true });
      Object.defineProperty(event, 'target', {
        value: textarea,
        enumerable: true,
      });
      window.dispatchEvent(event);

      expect(mockDeleteSelectedNodes).not.toHaveBeenCalled();
    });
  });

  describe('Backspace Key', () => {
    it('should call deleteSelectedNodes when Backspace pressed', () => {
      renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true });
      Object.defineProperty(event, 'target', {
        value: document.body,
        enumerable: true,
      });
      window.dispatchEvent(event);

      expect(mockDeleteSelectedNodes).toHaveBeenCalled();
    });

    it('should not delete when Backspace pressed in input', () => {
      renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      const input = document.createElement('input');
      const event = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true });
      Object.defineProperty(event, 'target', {
        value: input,
        enumerable: true,
      });
      window.dispatchEvent(event);

      expect(mockDeleteSelectedNodes).not.toHaveBeenCalled();
    });
  });

  describe('Undo', () => {
    it('should undo when Ctrl+Z pressed', () => {
      const { result } = renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      act(() => {
        result.current.pushHistory();
      });

      expect(result.current.historyRef.current).toHaveLength(1);

      const event = new KeyboardEvent('keydown', { 
        key: 'z', 
        ctrlKey: true, 
        bubbles: true 
      });
      window.dispatchEvent(event);

      expect(mockSetNodes).toHaveBeenCalled();
      expect(mockSetEdges).toHaveBeenCalled();
    });

    it('should not undo when history is empty', () => {
      renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      const event = new KeyboardEvent('keydown', { 
        key: 'z', 
        ctrlKey: true, 
        bubbles: true 
      });
      window.dispatchEvent(event);

      expect(mockSetNodes).not.toHaveBeenCalled();
      expect(mockSetEdges).not.toHaveBeenCalled();
    });

    it('should not undo when Ctrl+Shift+Z pressed', () => {
      const { result } = renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      act(() => {
        result.current.pushHistory();
      });

      const event = new KeyboardEvent('keydown', { 
        key: 'z', 
        ctrlKey: true, 
        shiftKey: true,
        bubbles: true 
      });
      window.dispatchEvent(event);

      // Should be redo, not undo
      expect(mockSetNodes).not.toHaveBeenCalled();
    });
  });

  describe('Redo', () => {
    it('should redo when Ctrl+Y pressed', () => {
      const { result } = renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      act(() => {
        result.current.pushHistory();
      });

      const undoEvent = new KeyboardEvent('keydown', { 
        key: 'z', 
        ctrlKey: true, 
        bubbles: true 
      });
      window.dispatchEvent(undoEvent);

      mockSetNodes.mockClear();
      mockSetEdges.mockClear();

      const redoEvent = new KeyboardEvent('keydown', { 
        key: 'y', 
        ctrlKey: true, 
        bubbles: true 
      });
      window.dispatchEvent(redoEvent);

      expect(mockSetNodes).toHaveBeenCalled();
      expect(mockSetEdges).toHaveBeenCalled();
    });

    it('should redo when Ctrl+Shift+Z pressed', () => {
      const { result } = renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      act(() => {
        result.current.pushHistory();
      });

      const undoEvent = new KeyboardEvent('keydown', { 
        key: 'z', 
        ctrlKey: true, 
        bubbles: true 
      });
      window.dispatchEvent(undoEvent);

      mockSetNodes.mockClear();
      mockSetEdges.mockClear();

      const redoEvent = new KeyboardEvent('keydown', { 
        key: 'z', 
        ctrlKey: true, 
        shiftKey: true,
        bubbles: true 
      });
      window.dispatchEvent(redoEvent);

      expect(mockSetNodes).toHaveBeenCalled();
      expect(mockSetEdges).toHaveBeenCalled();
    });

    it('should not redo when redo stack is empty', () => {
      renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      const event = new KeyboardEvent('keydown', { 
        key: 'y', 
        ctrlKey: true, 
        bubbles: true 
      });
      window.dispatchEvent(event);

      expect(mockSetNodes).not.toHaveBeenCalled();
      expect(mockSetEdges).not.toHaveBeenCalled();
    });
  });

  describe('pushHistory', () => {
    it('should add current state to history', () => {
      const { result } = renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      act(() => {
        result.current.pushHistory();
      });

      expect(result.current.historyRef.current).toHaveLength(1);
      expect(result.current.historyRef.current[0]).toEqual({
        nodes: mockNodes,
        edges: mockEdges,
      });
    });

    it('should clear redo stack when pushing history', () => {
      const { result } = renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      act(() => {
        result.current.pushHistory();
      });

      const undoEvent = new KeyboardEvent('keydown', { 
        key: 'z', 
        ctrlKey: true, 
        bubbles: true 
      });
      window.dispatchEvent(undoEvent);

      expect(result.current.redoRef.current).toHaveLength(1);

      act(() => {
        result.current.pushHistory();
      });

      expect(result.current.redoRef.current).toHaveLength(0);
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should remove event listener on unmount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should not add listener when disabled', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
          enabled: false,
        })
      );

      expect(addEventListenerSpy).not.toHaveBeenCalled();

      addEventListenerSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple undo operations', () => {
      const { result } = renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      act(() => {
        result.current.pushHistory();
        result.current.pushHistory();
        result.current.pushHistory();
      });

      expect(result.current.historyRef.current).toHaveLength(3);

      const event = new KeyboardEvent('keydown', { 
        key: 'z', 
        ctrlKey: true, 
        bubbles: true 
      });
      
      window.dispatchEvent(event);
      expect(result.current.historyRef.current).toHaveLength(2);
      
      window.dispatchEvent(event);
      expect(result.current.historyRef.current).toHaveLength(1);
    });

    it('should handle toggling between undo and redo', () => {
      const { result } = renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: mockEdges,
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      act(() => {
        result.current.pushHistory();
      });

      const undoEvent = new KeyboardEvent('keydown', { 
        key: 'z', 
        ctrlKey: true, 
        bubbles: true 
      });
      const redoEvent = new KeyboardEvent('keydown', { 
        key: 'y', 
        ctrlKey: true, 
        bubbles: true 
      });
      
      window.dispatchEvent(undoEvent);
      expect(result.current.historyRef.current).toHaveLength(0);
      expect(result.current.redoRef.current).toHaveLength(1);
      
      window.dispatchEvent(redoEvent);
      expect(result.current.historyRef.current).toHaveLength(1);
      expect(result.current.redoRef.current).toHaveLength(0);
    });

    it('should handle empty edges array', () => {
      renderHook(() =>
        useCanvasKeyboardShortcuts({
          nodes: mockNodes,
          edges: [],
          setNodes: mockSetNodes,
          setEdges: mockSetEdges,
          deleteSelectedNodes: mockDeleteSelectedNodes,
          deleteSelectedEdges: mockDeleteSelectedEdges,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'Delete', bubbles: true });
      Object.defineProperty(event, 'target', {
        value: document.body,
        enumerable: true,
      });
      window.dispatchEvent(event);

      expect(mockDeleteSelectedNodes).toHaveBeenCalled();
    });
  });
});
