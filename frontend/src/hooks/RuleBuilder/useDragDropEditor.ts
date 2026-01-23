import { useRef, useCallback } from 'react';
import type { Monaco } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';

export const useDragDropEditor = () => {
  const editorRef = useRef<Parameters<NonNullable<React.ComponentProps<typeof Editor>['onMount']>>[0] | null>(null);

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
    });
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const variablePath = event.dataTransfer.getData('variablePath');
    
    if (variablePath && editorRef.current) {
      const editor = editorRef.current;
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
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  return {
    handleEditorMount,
    handleDrop,
    handleDragOver,
  };
};
