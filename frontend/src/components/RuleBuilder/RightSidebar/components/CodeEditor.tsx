import React from 'react';
import { Box, Typography } from '@mui/material';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  language?: string;
  height?: string;
  required?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  error = false,
  helperText,
  language = 'typescript',
  height = '300px',
  required = false,
}) => {
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <Box sx={{ width: '100%', mb: 1 }}>
      {label && (
        <Typography
          variant="body2"
          sx={{
            mb: 0.5,
            fontWeight: 500,
            color: error ? 'error.main' : 'text.primary',
          }}
        >
          {label}
          {required && (
            <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>
              *
            </Typography>
          )}
        </Typography>
      )}
      
      <Box
        sx={{
          border: 1,
          borderColor: error ? 'error.main' : 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          opacity: disabled ? 0.6 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
          '&:hover': {
            borderColor: error ? 'error.main' : 'primary.main',
          },
        }}
      >
        <Editor
          height={height}
          language={language}
          value={value}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            readOnly: disabled,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
          }}
        />
      </Box>
      
      {helperText && (
        <Typography
          variant="caption"
          sx={{
            mt: 0.5,
            display: 'block',
            color: error ? 'error.main' : 'text.secondary',
          }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default CodeEditor;
