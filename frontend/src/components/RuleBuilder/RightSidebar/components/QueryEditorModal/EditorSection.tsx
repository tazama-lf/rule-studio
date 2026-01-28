import React, { useMemo, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Box, Alert, Typography } from '@mui/material';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

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
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  useImperativeHandle(ref, () => ({
    getValue: () => {
      const value = editorRef.current?.getValue() ?? '';
      return value;
    },
    setValue: (value: string) => {
      editorRef.current?.setValue(value);
    },
  }), []);

  const handleEditorMount = useCallback((editor: Parameters<NonNullable<React.ComponentProps<typeof Editor>['onMount']>>[0]) => {
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
