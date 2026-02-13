import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import EditorSection, { type EditorSectionHandle } from './EditorSection';
import VariablesPanel from './VariablesPanel';
import { useDragDropEditor, useVariableData } from '../../../../../hooks/RuleBuilder';

interface QueryEditorModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (query: string) => void;
  onExecute: (query: string, dbName?: string) => void;
  dbName?: string;
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
  dbName,
  initialValue,
  isExecuting = false,
  executionError = null,
  ruleId,
  allNodes = [],
  edges = [],
  selectedNodeId = null,
}) => {
  const editorRef = useRef<EditorSectionHandle>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const { handleDrop, handleDragOver, handleDragEnter, handleDragLeave, handleEditorMount } = useDragDropEditor();
  
  const variableData = useVariableData({ 
    ruleId: open ? ruleId : undefined, 
    allNodes: open ? allNodes : [], 
    edges: open ? edges : [], 
    selectedNodeId: open ? selectedNodeId : null 
  });

  const handleSave = useCallback(() => {
    const query = editorRef.current?.getValue() ?? '';
    if (!query.trim()) {
      setValidationError('Query cannot be empty');
      return;
    }
    setValidationError(null);
    onSave(query);
  }, [onSave]);

  const handleExecute = useCallback(() => {
    const rawQuery = editorRef.current?.getValue() ?? '';
    if (!rawQuery.trim()) {
      setValidationError('Query cannot be empty');
      return;
    }
    setValidationError(null);
    onExecute(rawQuery, dbName);
  }, [onExecute, dbName]);

  const handleCancel = useCallback(() => {
    setValidationError(null);
    onClose();
  }, [onClose]);

  const displayError = useMemo(() => validationError || executionError, [validationError, executionError]);

  React.useEffect(() => {
    if (open && editorRef.current) {
      editorRef.current.setValue(initialValue);
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
          ref={editorRef}
          initialValue={initialValue}
          displayError={displayError}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onEditorMount={handleEditorMount}
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
            disabled={isExecuting}
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
          >
            Save Query
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

const arePropsEqual = (
  prevProps: QueryEditorModalProps,
  nextProps: QueryEditorModalProps
): boolean => {
  if (!prevProps.open && !nextProps.open) {
    return true;
  }

  if (prevProps.open !== nextProps.open) {
    return false;
  }

  if (
    prevProps.initialValue !== nextProps.initialValue ||
    prevProps.isExecuting !== nextProps.isExecuting ||
    prevProps.executionError !== nextProps.executionError ||
    prevProps.ruleId !== nextProps.ruleId ||
    prevProps.selectedNodeId !== nextProps.selectedNodeId
  ) {
    return false;
  }

  if (
    prevProps.allNodes?.length !== nextProps.allNodes?.length ||
    prevProps.edges?.length !== nextProps.edges?.length
  ) {
    return false;
  }

  return true;
};

export default React.memo(QueryEditorModal, arePropsEqual);
