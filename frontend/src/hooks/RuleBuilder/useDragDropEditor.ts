import { useRef, useCallback } from 'react';
import type { Monaco } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';

export const useDragDropEditor = () => {
  const editorRef = useRef<Parameters<NonNullable<React.ComponentProps<typeof Editor>['onMount']>>[0] | null>(null);
  const isDraggingRef = useRef(false);

  const handleEditorMount = useCallback((editor: Parameters<NonNullable<React.ComponentProps<typeof Editor>['onMount']>>[0], monaco: Monaco) => {
    editorRef.current = editor;

    editor.updateOptions({
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
    editor.addCommand(monaco.KeyCode.Space, () => {
      const position = editor.getPosition();
      if (position) {
        editor.executeEdits('', [{
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
          text: ' ',
        }]);
        editor.setPosition({
          lineNumber: position.lineNumber,
          column: position.column + 1,
        });
      }
    });
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    isDraggingRef.current = true;
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget === event.target) {
      isDraggingRef.current = false;
      
      if (editorRef.current) {
        const editorDomNode = editorRef.current.getDomNode();
        if (editorDomNode) {
          const scrollContainer = editorDomNode.querySelector('.monaco-scrollable-element');
          if (scrollContainer) {
            scrollContainer.removeAttribute('data-dragging');
          }
        }
      }
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    isDraggingRef.current = false;
    
    const variablePath = event.dataTransfer.getData('variablePath');
    
    if (variablePath && editorRef.current) {
      const editor = editorRef.current;
      const editorDomNode = editor.getDomNode();
      if (editorDomNode) {
        const scrollContainer = editorDomNode.querySelector('.monaco-scrollable-element');
        if (scrollContainer) {
          scrollContainer.removeAttribute('data-dragging');
        }
      }
      
      const position = editor.getPosition();
      
      if (position) {
        editor.executeEdits('', [
          {
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
            text: variablePath,
          },
        ]);
        
        const newColumn = position.column + variablePath.length;
        editor.setPosition({
          lineNumber: position.lineNumber,
          column: newColumn,
        });
        editor.focus();
      }
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  return {
    handleEditorMount,
    handleDrop,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
  };
};
