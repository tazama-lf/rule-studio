import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';

interface OutputModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
  emptyMessage?: string;
  onDownload?: () => void;
  language?: 'json' | 'typescript';
}

const OutputModal: React.FC<OutputModalProps> = ({
  open,
  onClose,
  title,
  content,
  emptyMessage = 'No content available',
  onDownload,
  language = 'json',
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
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
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '85vh',
          maxHeight: '85vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" component="div">
          {title}
        </Typography>
        <Box>
          {content && (
            <>
              <IconButton
                onClick={handleCopy}
                size="small"
                sx={{ mr: 1 }}
                title="Copy to clipboard"
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
              {onDownload && (
                <IconButton
                  onClick={onDownload}
                  size="small"
                  sx={{ mr: 1 }}
                  title="Download as .ts file"
                  color="success"
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              )}
            </>
          )}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0, height: 'calc(85vh - 120px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {content ? (
          <Box
            sx={{
              flex: 1,
              height: '100%',
              '& .monaco-editor': {
                paddingTop: '8px',
              },
            }}
          >
            <Editor
              height="100%"
              language={language}
              value={content}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: true },
                scrollBeyondLastLine: true,
                fontSize: 14,
                lineNumbers: 'on',
                folding: true,
                automaticLayout: true,
                wordWrap: 'on',
                wrappingStrategy: 'advanced',
                padding: { top: 8, bottom: 16 },
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                },
              }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {emptyMessage}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OutputModal;
