import React from 'react';
import { Box, Alert, Typography } from '@mui/material';
import Editor from '@monaco-editor/react';

interface EditorSectionProps {
  query: string;
  displayError: string | null;
  onEditorChange: (value: string | undefined) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEditorMount: (editor: any, monaco?: any) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (event: React.DragEvent<HTMLDivElement>) => void;
}

const EditorSection: React.FC<EditorSectionProps> = ({
  query,
  displayError,
  onEditorChange,
  onEditorMount,
  onDrop,
  onDragOver,
  onDragEnter,
  onDragLeave,
}) => {
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
          value={query}
          onChange={onEditorChange}
          onMount={onEditorMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 12,
              horizontalScrollbarSize: 12,
            },
            formatOnPaste: false,
            formatOnType: false,
            autoIndent: 'none',
            quickSuggestions: false,
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnCommitCharacter: false,
            acceptSuggestionOnEnter: 'off',
            tabCompletion: 'off',
            wordBasedSuggestions: 'off',
            parameterHints: { enabled: false },
            suggest: {
              showWords: false,
              showKeywords: false,
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default React.memo(EditorSection);
