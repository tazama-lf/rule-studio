import React, { useRef, useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  Chip,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { validateTestCode, validateTypeScriptCode, type ValidationResult, getValidationSummary } from '../../../utils/Flow/codeValidator';

interface OutputModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
  emptyMessage?: string;
  onDownload?: () => void;
  language?: 'json' | 'typescript';
  enableValidation?: boolean;
  validationType?: 'test' | 'rule';
}

const OutputModal: React.FC<OutputModalProps> = ({
  open,
  onClose,
  title,
  content,
  emptyMessage = 'No content available',
  onDownload,
  language = 'json',
  enableValidation = false,
  validationType = 'rule',
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [showErrors, setShowErrors] = useState(true);
  const [showWarnings, setShowWarnings] = useState(true);

  const validationResult = useMemo<ValidationResult | null>(() => {
    if (enableValidation && language === 'typescript' && content && open) {
      return validationType === 'test' 
        ? validateTestCode(content)
        : validateTypeScriptCode(content);
    }
    return null;
  }, [content, language, open, enableValidation, validationType]);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  const handleFormat = () => {
    if (editorRef.current && language === 'typescript') {
      editorRef.current.updateOptions({ readOnly: false });

      editorRef.current.getAction('editor.action.formatDocument')?.run();

      setTimeout(() => {
        editorRef.current?.updateOptions({ readOnly: true });
      }, 50);
    }
  };

  const handleEditorMount = (editor: Parameters<NonNullable<React.ComponentProps<typeof Editor>['onMount']>>[0], monaco: Monaco) => {
    editorRef.current = editor;

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types'],
    });

    if (language === 'typescript') {
      setTimeout(async () => {
        const model = editor.getModel();
        if (model) {
          editor.updateOptions({ readOnly: false });
          await editor.getAction('editor.action.formatDocument')?.run();
          setTimeout(() => {
            editor.updateOptions({ readOnly: true });
          }, 100);
        }
      }, 200);
    }
    
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          {validationResult && language === 'typescript' && (
            <Chip
              icon={validationResult.isValid ? <CheckCircleIcon /> : <ErrorIcon />}
              label={getValidationSummary(validationResult)}
              size="small"
              color={validationResult.isValid ? 'success' : 'error'}
              variant="outlined"
            />
          )}
        </Box>
        <Box>
          {content && (
            <>
              {language === 'typescript' && (
                <IconButton
                  onClick={handleFormat}
                  size="small"
                  sx={{ mr: 1 }}
                  title="Format code"
                  color="primary"
                >
                  <FormatAlignLeftIcon fontSize="small" />
                </IconButton>
              )}
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
        {validationResult && language === 'typescript' && (validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', maxHeight: '40%', overflow: 'auto', bgcolor: 'background.default' }}>
            {validationResult.errors.length > 0 && (
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    bgcolor: 'error.dark',
                    color: 'error.contrastText',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'error.main' },
                  }}
                  onClick={() => setShowErrors(!showErrors)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ErrorIcon fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Errors ({validationResult.errors.length})
                    </Typography>
                  </Box>
                  <IconButton size="small" sx={{ color: 'inherit' }}>
                    {showErrors ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                </Box>
                <Collapse in={showErrors}>
                  <List dense sx={{ py: 0, bgcolor: 'background.paper' }}>
                    {validationResult.errors.map((error, index) => (
                      <React.Fragment key={index}>
                        <ListItem
                          sx={{
                            py: 1.5,
                            px: 2,
                            alignItems: 'flex-start',
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                            <ErrorIcon color="error" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" component="div" sx={{ mb: 0.5 }}>
                                <Box component="span" sx={{ fontWeight: 600, color: 'error.main', mr: 1 }}>
                                  Line {error.line}:{error.column}
                                </Box>
                                <Box component="span" sx={{ color: 'text.primary' }}>
                                  {error.message}
                                </Box>
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < validationResult.errors.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Collapse>
              </Box>
            )}
            {validationResult.warnings.length > 0 && (
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    bgcolor: 'warning.dark',
                    color: 'warning.contrastText',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'warning.main' },
                  }}
                  onClick={() => setShowWarnings(!showWarnings)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Warnings ({validationResult.warnings.length})
                    </Typography>
                  </Box>
                  <IconButton size="small" sx={{ color: 'inherit' }}>
                    {showWarnings ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                </Box>
                <Collapse in={showWarnings}>
                  <List dense sx={{ py: 0, bgcolor: 'background.paper' }}>
                    {validationResult.warnings.map((warning, index) => (
                      <React.Fragment key={index}>
                        <ListItem
                          sx={{
                            py: 1.5,
                            px: 2,
                            alignItems: 'flex-start',
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                            <WarningIcon color="warning" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" component="div" sx={{ mb: 0.5 }}>
                                <Box component="span" sx={{ fontWeight: 600, color: 'warning.main', mr: 1 }}>
                                  Line {warning.line}:{warning.column}
                                </Box>
                                <Box component="span" sx={{ color: 'text.primary' }}>
                                  {warning.message}
                                </Box>
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < validationResult.warnings.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Collapse>
              </Box>
            )}
          </Box>
        )}
        {validationResult && language === 'typescript' && validationResult.isValid && validationResult.warnings.length === 0 && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'success.dark', p: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon sx={{ color: 'success.contrastText' }} fontSize="small" />
              <Typography variant="body2" sx={{ color: 'success.contrastText', fontWeight: 500 }}>
                ✓ Code validation passed - No issues found
              </Typography>
            </Box>
          </Box>
        )}
        {content ? (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
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
                tabSize: 2,
                insertSpaces: true,
                detectIndentation: false,
                formatOnPaste: true,
                formatOnType: false,
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
