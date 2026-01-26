import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import type { Node, Edge } from '@xyflow/react';
import EditorSection from './EditorSection';
import VariablesPanel from './VariablesPanel';
import { useQueryValidation, useDragDropEditor, useVariableData } from '../../../../../hooks/RuleBuilder';

interface QueryEditorModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (query: string) => void;
  onExecute: (query: string) => void;
  initialValue: string;
  isExecuting?: boolean;
  executionError?: string | null;
  ruleId?: string;
  allNodes?: Node[];
  edges?: Edge[];
  selectedNodeId?: string | null;
}

const QueryEditorModal: React.FC<QueryEditorModalProps> = ({
  open,
  onClose,
  onSave,
  onExecute,
  initialValue,
  isExecuting = false,
  executionError = null,
  ruleId,
  allNodes = [],
  edges = [],
  selectedNodeId = null,
}) => {
  const [query, setQuery] = useState(initialValue);

  const { validationError, validateAndSanitize, clearValidationError } = useQueryValidation(query);
  const { handleEditorMount, handleDrop, handleDragOver, handleDragEnter, handleDragLeave } = useDragDropEditor();
  const variableData = useVariableData({ ruleId, allNodes, edges, selectedNodeId });

  const handleSave = useCallback(() => {
    const result = validateAndSanitize();
    if (result.isValid && result.sanitized) {
      onSave(result.sanitized);
      onClose();
    }
  }, [validateAndSanitize, onSave, onClose]);

  const handleExecute = useCallback(() => {
    const result = validateAndSanitize();
    if (result.isValid && result.sanitized) {
      onExecute(result.sanitized);
    }
  }, [validateAndSanitize, onExecute]);

  const handleCancel = useCallback(() => {
    setQuery(initialValue);
    clearValidationError();
    onClose();
  }, [initialValue, clearValidationError, onClose]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    setQuery(value ?? '');
    if (validationError) {
      clearValidationError();
    }
  }, [validationError, clearValidationError]);

  const displayError = useMemo(() => validationError || executionError, [validationError, executionError]);
  const hasQuery = useMemo(() => query.trim().length > 0, [query]);

  React.useEffect(() => {
    if (open) {
      setQuery(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="xl"
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
          SQL Query Editor
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

      <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
        <EditorSection
          query={query}
          displayError={displayError}
          onEditorChange={handleEditorChange}
          onEditorMount={handleEditorMount}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        />

        <Divider orientation="vertical" flexItem />

        <VariablesPanel {...variableData} />
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={handleExecute}
            variant="outlined"
            color="success"
            startIcon={isExecuting ? <CircularProgress size={16} /> : <PlayArrowIcon />}
            disabled={isExecuting || !hasQuery}
          >
            {isExecuting ? 'Executing...' : 'Execute & Test'}
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleCancel} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={!hasQuery}
          >
            Save Query
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default QueryEditorModal;
