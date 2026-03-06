import { renderHook, act } from '@testing-library/react';
import { useDragDropEditor } from '../../../src/hooks/RuleBuilder/useDragDropEditor';

describe('useDragDropEditor', () => {
  let mockEditor: { updateOptions: jest.Mock; addCommand: jest.Mock; getPosition: jest.Mock; executeEdits: jest.Mock; getModel: jest.Mock; setPosition: jest.Mock; focus: jest.Mock; getDomNode: jest.Mock; };
  let mockMonaco: { KeyCode: { Space: number } };

  beforeEach(() => {
    jest.clearAllMocks();

    mockEditor = {
      updateOptions: jest.fn(),
      addCommand: jest.fn(),
      getPosition: jest.fn(),
      executeEdits: jest.fn(),
      getModel: jest.fn(),
      setPosition: jest.fn(),
      focus: jest.fn(),
      getDomNode: jest.fn(),
    };

    mockMonaco = {
      KeyCode: {
        Space: 10,
      },
    };
  });

  describe('Initialization', () => {
    it('should return all expected handlers', () => {
      const { result } = renderHook(() => useDragDropEditor());

      expect(typeof result.current.handleEditorMount).toBe('function');
      expect(typeof result.current.handleDrop).toBe('function');
      expect(typeof result.current.handleDragOver).toBe('function');
      expect(typeof result.current.handleDragEnter).toBe('function');
      expect(typeof result.current.handleDragLeave).toBe('function');
    });
  });

  describe('handleEditorMount', () => {
    it('should configure editor with autocomplete disabled', () => {
      const { result } = renderHook(() => useDragDropEditor());

      act(() => {
        result.current.handleEditorMount(mockEditor as never, mockMonaco as never);
      });

      expect(mockEditor.updateOptions).toHaveBeenCalledWith({
        quickSuggestions: false,
        suggestOnTriggerCharacters: false,
        acceptSuggestionOnCommitCharacter: false,
        acceptSuggestionOnEnter: 'off',
        tabCompletion: 'off',
        wordBasedSuggestions: 'off',
        parameterHints: { enabled: false },
        formatOnType: false,
        autoIndent: 'none',
      });
    });

    it('should add space key command', () => {
      const { result } = renderHook(() => useDragDropEditor());

      act(() => {
        result.current.handleEditorMount(mockEditor as never, mockMonaco as never);
      });

      expect(mockEditor.addCommand).toHaveBeenCalledWith(
        mockMonaco.KeyCode.Space,
        expect.any(Function)
      );
    });

    it('should handle space key press correctly', () => {
      const { result } = renderHook(() => useDragDropEditor());

      mockEditor.getPosition.mockReturnValue({
        lineNumber: 5,
        column: 10,
      });

      act(() => {
        result.current.handleEditorMount(mockEditor as never, mockMonaco as never);
      });

      const spaceCallback = mockEditor.addCommand.mock.calls[0][1];
      spaceCallback();

      expect(mockEditor.executeEdits).toHaveBeenCalledWith('', [
        {
          range: {
            startLineNumber: 5,
            startColumn: 10,
            endLineNumber: 5,
            endColumn: 10,
          },
          text: ' ',
        },
      ]);

      expect(mockEditor.setPosition).toHaveBeenCalledWith({
        lineNumber: 5,
        column: 11,
      });
    });

    it('should handle space key when position is null', () => {
      const { result } = renderHook(() => useDragDropEditor());

      mockEditor.getPosition.mockReturnValue(null);

      act(() => {
        result.current.handleEditorMount(mockEditor as never, mockMonaco as never);
      });

      const spaceCallback = mockEditor.addCommand.mock.calls[0][1];
      spaceCallback();

      expect(mockEditor.executeEdits).not.toHaveBeenCalled();
    });
  });

  describe('handleDragEnter', () => {
    it('should prevent default and stop propagation', () => {
      const { result } = renderHook(() => useDragDropEditor());

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.DragEvent<HTMLDivElement>;

      result.current.handleDragEnter(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('handleDragLeave', () => {
    it('should prevent default and stop propagation', () => {
      const { result } = renderHook(() => useDragDropEditor());

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: document.createElement('div'),
        target: document.createElement('div'),
      } as unknown as React.DragEvent<HTMLDivElement>;

      result.current.handleDragLeave(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should remove dragging attribute when leaving container', () => {
      const { result } = renderHook(() => useDragDropEditor());

      const mockScrollContainer = document.createElement('div');
      mockScrollContainer.setAttribute('data-dragging', 'true');
      mockScrollContainer.className = 'monaco-scrollable-element';

      const mockDomNode = document.createElement('div');
      mockDomNode.appendChild(mockScrollContainer);

      mockEditor.getDomNode.mockReturnValue(mockDomNode);

      act(() => {
        result.current.handleEditorMount(mockEditor as never, mockMonaco as never);
      });

      const container = document.createElement('div');
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: container,
        target: container,
      } as unknown as React.DragEvent<HTMLDivElement>;

      result.current.handleDragLeave(mockEvent);

      expect(mockScrollContainer.hasAttribute('data-dragging')).toBe(false);
    });
  });

  describe('handleDragOver', () => {
    it('should prevent default and stop propagation', () => {
      const { result } = renderHook(() => useDragDropEditor());

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          dropEffect: '',
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      result.current.handleDragOver(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should set dropEffect to copy', () => {
      const { result } = renderHook(() => useDragDropEditor());

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          dropEffect: '',
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      result.current.handleDragOver(mockEvent);

      expect(mockEvent.dataTransfer.dropEffect).toBe('copy');
    });
  });

  describe('handle Drop', () => {
    let hookResult: ReturnType<typeof useDragDropEditor>;

    beforeEach(() => {
      const { result } = renderHook(() => useDragDropEditor());
      hookResult = result.current;
      
      act(() => {
        hookResult.handleEditorMount(mockEditor as never, mockMonaco as never);
      });
    });

    it('should prevent default and stop propagation', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          getData: jest.fn(() => ''),
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      hookResult.handleDrop(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should insert variable path at cursor position', () => {
      const { result } = renderHook(() => useDragDropEditor());

      mockEditor.getPosition.mockReturnValue({
        lineNumber: 3,
        column: 15,
      });

      const mockDomNode = document.createElement('div');
      mockEditor.getDomNode.mockReturnValue(mockDomNode);

      act(() => {
        hookResult.handleEditorMount(mockEditor as never, mockMonaco as never);
      });

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          getData: jest.fn((key: string) => {
            if (key === 'variablePath') return 'myVar.property';
            return '';
          }),
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      hookResult.handleDrop(mockEvent);

      expect(mockEditor.executeEdits).toHaveBeenCalledWith('', [
        {
          range: {
            startLineNumber: 3,
            startColumn: 15,
            endLineNumber: 3,
            endColumn: 15,
          },
          text: 'myVar.property',
        },
      ]);
    });

    it('should set cursor position after inserted text', () => {
      const { result } = renderHook(() => useDragDropEditor());

      mockEditor.getPosition.mockReturnValue({
        lineNumber: 3,
        column: 15,
      });

      const mockDomNode = document.createElement('div');
      mockEditor.getDomNode.mockReturnValue(mockDomNode);

      act(() => {
        hookResult.handleEditorMount(mockEditor as never, mockMonaco as never);
      });

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          getData: jest.fn((key: string) => {
            if (key === 'variablePath') return 'myVar.property';
            return '';
          }),
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      hookResult.handleDrop(mockEvent);

      expect(mockEditor.setPosition).toHaveBeenCalledWith({
        lineNumber: 3,
        column: 29, // 15 + 14 (length of 'myVar.property')
      });
    });

    it('should focus editor after drop', () => {
      const { result } = renderHook(() => useDragDropEditor());

      mockEditor.getPosition.mockReturnValue({
        lineNumber: 1,
        column: 1,
      });

      const mockDomNode = document.createElement('div');
      mockEditor.getDomNode.mockReturnValue(mockDomNode);

      act(() => {
        hookResult.handleEditorMount(mockEditor as never, mockMonaco as never);
      });

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          getData: jest.fn((key: string) => {
            if (key === 'variablePath') return 'variable';
            return '';
          }),
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      hookResult.handleDrop(mockEvent);

      expect(mockEditor.focus).toHaveBeenCalled();
    });

    it('should handle drop when no variable path in dataTransfer', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          getData: jest.fn(() => ''),
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      hookResult.handleDrop(mockEvent);

      expect(mockEditor.executeEdits).not.toHaveBeenCalled();
    });

    it('should handle drop when position is null', () => {
      mockEditor.getPosition.mockReturnValue(null);
      const { result } = renderHook(() => useDragDropEditor());

      mockEditor.getPosition.mockReturnValue(null);

      const mockDomNode = document.createElement('div');
      mockEditor.getDomNode.mockReturnValue(mockDomNode);

      act(() => {
        hookResult.handleEditorMount(mockEditor as never, mockMonaco as never);
      });

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          getData: jest.fn((key: string) => {
            if (key === 'variablePath') return 'variable';
            return '';
          }),
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      hookResult.handleDrop(mockEvent);

      expect(mockEditor.executeEdits).not.toHaveBeenCalled();
    });

    it('should remove dragging attribute from scroll container', () => {
      const { result } = renderHook(() => useDragDropEditor());

      mockEditor.getPosition.mockReturnValue({
        lineNumber: 1,
        column: 1,
      });

      const mockScrollContainer = document.createElement('div');
      mockScrollContainer.className = 'monaco-scrollable-element';
      mockScrollContainer.setAttribute('data-dragging', 'true');

      const mockDomNode = document.createElement('div');
      mockDomNode.appendChild(mockScrollContainer);
      mockEditor.getDomNode.mockReturnValue(mockDomNode);

      act(() => {
        hookResult.handleEditorMount(mockEditor as never, mockMonaco as never);
      });

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          getData: jest.fn((key: string) => {
            if (key === 'variablePath') return 'variable';
            return '';
          }),
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      hookResult.handleDrop(mockEvent);

      expect(mockScrollContainer.hasAttribute('data-dragging')).toBe(false);
    });
  });

  describe('Callback Stability', () => {
    it('should maintain handleEditorMount stability', () => {
      const { result, rerender } = renderHook(() => useDragDropEditor());

      const first = result.current.handleEditorMount;
      rerender();

      expect(result.current.handleEditorMount).toBe(first);
    });

    it('should maintain handleDrop stability', () => {
      const { result, rerender } = renderHook(() => useDragDropEditor());

      const first = result.current.handleDrop;
      rerender();

      expect(result.current.handleDrop).toBe(first);
    });

    it('should maintain handleDragOver stability', () => {
      const { result, rerender } = renderHook(() => useDragDropEditor());

      const first = result.current.handleDragOver;
      rerender();

      expect(result.current.handleDragOver).toBe(first);
    });

    it('should maintain handleDragEnter stability', () => {
      const { result, rerender } = renderHook(() => useDragDropEditor());

      const first = result.current.handleDragEnter;
      rerender();

      expect(result.current.handleDragEnter).toBe(first);
    });

    it('should maintain handleDragLeave stability', () => {
      const { result, rerender } = renderHook(() => useDragDropEditor());

      const first = result.current.handleDragLeave;
      rerender();

      expect(result.current.handleDragLeave).toBe(first);
    });
  });

  describe('Edge Cases', () => {
    it('should handle drop with long variable path', () => {
      const { result } = renderHook(() => useDragDropEditor());

      mockEditor.getPosition.mockReturnValue({
        lineNumber: 1,
        column: 1,
      });

      const mockDomNode = document.createElement('div');
      mockEditor.getDomNode.mockReturnValue(mockDomNode);

      act(() => {
        result.current.handleEditorMount(mockEditor as never, mockMonaco as never);
      });

      const longPath = 'very.long.nested.path.to.property.with.many.levels';

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          getData: jest.fn((key: string) => {
            if (key === 'variablePath') return longPath;
            return '';
          }),
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      result.current.handleDrop(mockEvent);

      expect(mockEditor.setPosition).toHaveBeenCalledWith({
        lineNumber: 1,
        column: 1 + longPath.length,
      });
    });

    it('should handle drag leave when editor is not mounted', () => {
      const { result } = renderHook(() => useDragDropEditor());

      const container = document.createElement('div');
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        currentTarget: container,
        target: container,
      } as unknown as React.DragEvent<HTMLDivElement>;

      expect(() => {
        result.current.handleDragLeave(mockEvent);
      }).not.toThrow();
    });

    it('should handle drop when editor DOM node has no scroll container', () => {
      const { result } = renderHook(() => useDragDropEditor());

      mockEditor.getPosition.mockReturnValue({
        lineNumber: 1,
        column: 1,
      });

      const mockDomNode = document.createElement('div');
      mockEditor.getDomNode.mockReturnValue(mockDomNode);

      act(() => {
        result.current.handleEditorMount(mockEditor as never, mockMonaco as never);
      });

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          getData: jest.fn((key: string) => {
            if (key === 'variablePath') return 'variable';
            return '';
          }),
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      expect(() => {
        result.current.handleDrop(mockEvent);
      }).not.toThrow();
    });
  });
});





