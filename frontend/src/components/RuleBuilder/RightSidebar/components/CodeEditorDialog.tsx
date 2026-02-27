import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import Editor from '@monaco-editor/react';

interface CodeEditorDialogProps {
  open: boolean;
  title: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
  height?: string;
}

export const CodeEditorDialog: React.FC<CodeEditorDialogProps> = ({
  open,
  title,
  value,
  onChange,
  onSave,
  onClose,
  height = '400px',
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Editor
          height={height}
          defaultLanguage="typescript"
          value={value}
          onChange={(val) => onChange(val || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
