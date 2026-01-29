import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Box, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';

interface CodeEditorModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (code: string) => void;
  initialValue: string;
  title?: string;
  language?: string;
}

const CodeEditorModal: React.FC<CodeEditorModalProps> = ({
  open,
  onClose,
  onSave,
  initialValue,
  title = 'Edit Code',
  language = 'typescript',
}) => {
  const [code, setCode] = useState(initialValue);

  React.useEffect(() => {
    if (open) {
      setCode(initialValue);
    }
  }, [initialValue, open]);

  const handleSave = () => {
    onSave(code);
    onClose();
  };

  const handleCancel = () => {
    setCode(initialValue);
    onClose();
  };

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || '');
  };

  const handleEditorMount = (editor: Parameters<NonNullable<React.ComponentProps<typeof Editor>['onMount']>>[0], monaco: Monaco) => {
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
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleCancel}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, height: 'calc(100% - 130px)' }}>
        <Box sx={{ height: '100%', width: '100%' }}>
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
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
              acceptSuggestionOnCommitCharacter: false,
              acceptSuggestionOnEnter: 'off',
              quickSuggestions: false,
              suggestOnTriggerCharacters: false,
              wordBasedSuggestions: 'off',
              parameterHints: { enabled: false },
              snippetSuggestions: 'none',
              occurrencesHighlight: 'off',
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleCancel} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CodeEditorModal;
