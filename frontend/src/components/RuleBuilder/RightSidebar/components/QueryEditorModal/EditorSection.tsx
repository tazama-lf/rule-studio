import React, { useMemo, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Box, Alert, Typography } from '@mui/material';
import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';

export interface EditorSectionHandle {
  getValue: () => string;
  setValue: (value: string) => void;
}

interface EditorSectionProps {
  initialValue: string;
  displayError: string | null;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (event: React.DragEvent<HTMLDivElement>) => void;
}

const EditorSection = forwardRef<EditorSectionHandle, EditorSectionProps>(({
  initialValue,
  displayError,
  onDrop,
  onDragOver,
  onDragEnter,
  onDragLeave,
}, ref) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    getValue: () => {
      const value = editorRef.current?.getValue() ?? '';
      return value;
    },
    setValue: (value: string) => {
      editorRef.current?.setValue(value);
    },
  }), []);

  const handleEditorMount = useCallback((editor: Parameters<NonNullable<React.ComponentProps<typeof Editor>['onMount']>>[0], monaco: Monaco) => {
    editorRef.current = editor;
    
    // Disable suggestions and auto-completion for performance
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

  const editorOptions = useMemo(() => ({
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on' as const,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on' as const,
    scrollbar: {
      vertical: 'auto' as const,
      horizontal: 'auto' as const,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    formatOnPaste: false,
    formatOnType: false,
    autoIndent: 'none' as const,
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnCommitCharacter: false,
    acceptSuggestionOnEnter: 'off' as const,
    tabCompletion: 'off' as const,
    wordBasedSuggestions: 'off' as const,
    parameterHints: { enabled: false },
    suggest: {
      showWords: false,
      showKeywords: false,
    },
    renderValidationDecorations: 'off' as const,
    folding: false,
    glyphMargin: false,
    lineDecorationsWidth: 0,
    lineNumbersMinChars: 3,
    renderLineHighlight: 'none' as const,
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    overviewRulerLanes: 0,
  }), []);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
      {displayError && (
        <Alert severity="error" sx={{ m: 2, mb: 0 }}>
          {displayError}
        </Alert>
      )}
      
      <Box sx={{ p: 2, pb: 1 }}>
        <Alert severity="info" variant="outlined">
          <Typography variant="body2">
            <strong>Tips:</strong> Write your SELECT query here. Drag variables from the right panel or type{' '}
            <code>{'{{RuleRequest.variable}}'}</code> manually.
            <br />
            <strong>Note:</strong> Only SELECT queries are allowed for security. Data modification queries (INSERT, UPDATE, DELETE, etc.) are not permitted.
          </Typography>
        </Alert>
      </Box>

      <Box 
        sx={{ 
          flex: 1, 
          minHeight: 0,
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
      >
        <Editor
          height="100%"
          language="sql"
          defaultValue={initialValue}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={editorOptions}
        />
      </Box>
    </Box>
  );
});

EditorSection.displayName = 'EditorSection';

export default EditorSection;
