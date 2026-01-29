import React, { useCallback } from 'react';
import { Box, TextField, Button, Divider, Typography, Checkbox, FormControlLabel, Paper, Chip } from '@mui/material';
import type { Node } from '@xyflow/react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { PropertyRow, SectionContainer, SectionTitle } from '../styles';
import {
  getNodeOrBranchAtPath,
  updateFieldAtPath,
  updateBranchAtPath,
  insertVariableAtCursor,
  createEmptyNestedCondition,
  createEmptyValueBranch,
  hasVariableReference,
} from '../../../../utils/Flow/TernaryTreeUtils';

export interface TernaryBranch {
  type: 'value' | 'nested';
  value?: string;
  nested?: TernaryNode;
}

export interface TernaryNode {
  condition: string;
  trueValue: TernaryBranch;
  falseValue: TernaryBranch;
}

interface TernaryConditionEditorProps {
  ternaryTree: TernaryNode;
  storeResult: boolean;
  resultVar: string;
  onTreeChange: (newTree: TernaryNode) => void;
  onStoreResultChange: (checked: boolean) => void;
  onResultVarChange: (newValue: string) => void;
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | HTMLTextAreaElement>>;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  viewOnly: boolean;
  allNodes?: Node[];
  getFieldError?: (fieldName: string) => string | undefined;
}

const variableHighlightStyle = {
  background: `linear-gradient(to bottom, transparent 0%, transparent calc(100% - 2px), #4caf50 calc(100% - 2px), #4caf50 100%)`,
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
};

const valueHighlightStyle = {
  background: `linear-gradient(to bottom, transparent 0%, transparent calc(100% - 2px), #2196f3 calc(100% - 2px), #2196f3 100%)`,
  backgroundSize: '100% 100%',
  backgroundRepeat: 'no-repeat',
};

const TernaryConditionEditor: React.FC<TernaryConditionEditorProps> = ({
  ternaryTree,
  storeResult,
  resultVar,
  onTreeChange,
  onStoreResultChange,
  onResultVarChange,
  inputRefs: inputRefsRef,
  onDragOver,
  viewOnly,
  getFieldError,
}) => {
  const handleDrop = useCallback((
    path: string,
    field: 'condition' | 'value' | 'resultVar'
  ) => (e: React.DragEvent<HTMLDivElement>) => {
    if (viewOnly) return;
    e.preventDefault();

    let variablePath = e.dataTransfer.getData('variablePath');
    if (!variablePath) return;

    variablePath = variablePath.replace(/\{\{\s*/g, '').replace(/\s*\}\}/g, '').trim();

    const refKey = field === 'resultVar' ? 'ternary_resultVar' : `ternary_${path}_${field}`;
    const inputElement = inputRefsRef.current[refKey];

    let currentValue = '';
    if (field === 'resultVar') {
      currentValue = resultVar;
    } else {
      const nodeOrBranch = getNodeOrBranchAtPath(ternaryTree, path);
      if (nodeOrBranch && 'condition' in nodeOrBranch) {
        currentValue = field === 'condition' ? nodeOrBranch.condition : '';
      } else if (nodeOrBranch && 'type' in nodeOrBranch && nodeOrBranch.type === 'value') {
        currentValue = nodeOrBranch.value || '';
      }
    }

    let newValue: string;
    if (inputElement) {
      const start = inputElement.selectionStart || 0;
      const end = inputElement.selectionEnd || 0;
      const result = insertVariableAtCursor(currentValue, variablePath, start, end);
      newValue = result.newValue;

      setTimeout(() => {
        inputElement.setSelectionRange(result.newCursorPos, result.newCursorPos);
        inputElement.focus();
      }, 0);
    } else {
      const wrappedVariable = `{{ ${variablePath} }}`;
      newValue = currentValue ? `${currentValue} ${wrappedVariable}` : wrappedVariable;
    }

    if (field === 'resultVar') {
      onResultVarChange(newValue);
    } else if (field === 'condition' || field === 'value') {
      const updatedTree = updateFieldAtPath(ternaryTree, path, field, newValue);
      onTreeChange(updatedTree);
    }
  }, [viewOnly, inputRefsRef, resultVar, ternaryTree, onResultVarChange, onTreeChange]);

  const handleConditionChange = useCallback((path: string, newValue: string) => {
    if (viewOnly) return;
    const updatedTree = updateFieldAtPath(ternaryTree, path, 'condition', newValue);
    onTreeChange(updatedTree);
  }, [viewOnly, ternaryTree, onTreeChange]);

  const handleBranchUpdate = useCallback((
    path: string,
    branchType: 'true' | 'false',
    newBranch: TernaryBranch
  ) => {
    if (viewOnly) return;
    const updatedTree = updateBranchAtPath(ternaryTree, path, branchType, newBranch);
    onTreeChange(updatedTree);
  }, [viewOnly, ternaryTree, onTreeChange]);

  const handleResultVarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!viewOnly) {
      onResultVarChange(e.target.value);
    }
  }, [viewOnly, onResultVarChange]);

  const renderBranch = (branch: TernaryBranch, path: string, branchType: 'true' | 'false', depth: number) => {
    const bgColor = branchType === 'true' ? 'rgba(76, 175, 80, 0.08)' : 'rgba(244, 67, 54, 0.08)';
    const borderColor = branchType === 'true' ? 'success.main' : 'error.main';
    const icon = branchType === 'true' ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />;
    const label = branchType === 'true' ? 'IF TRUE' : 'IF FALSE';
    const color = branchType === 'true' ? 'success' : 'error';

    return (
      <Box sx={{ ml: depth * 2, mt: 1.5 }}>
        <Paper
          sx={{
            p: 2,
            bgcolor: bgColor,
            border: '2px solid',
            borderColor: borderColor,
            borderRadius: 2,
          }}
        >
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {icon}
              <Chip
                label={label}
                size="small"
                color={color as 'success' | 'error'}
                sx={{ fontWeight: 600 }}
              />
            </Box>
            {!viewOnly && branch.type === 'value' && (
              <Button
                size="small"
                variant="contained"
                color={color as 'success' | 'error'}
                startIcon={<AddIcon />}
                onClick={() => handleBranchUpdate(path, branchType, createEmptyNestedCondition())}
                fullWidth
              >
                Add Nested Condition
              </Button>
            )}
            {!viewOnly && branch.type === 'nested' && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => handleBranchUpdate(path, branchType, createEmptyValueBranch())}
                fullWidth
              >
                Remove Nested Condition
              </Button>
            )}
          </Box>

          {branch.type === 'value' ? (
            <PropertyRow onDrop={handleDrop(`${path}.${branchType}`, 'value')} onDragOver={onDragOver}>
              <TextField
                fullWidth
                label="Return Value"
                value={branch.value || ''}
                onChange={(e) => {
                  if (!viewOnly) {
                    handleBranchUpdate(path, branchType, { type: 'value', value: e.target.value });
                  }
                }}
                size="small"
                variant="outlined"
                disabled={viewOnly}
                placeholder="e.g., 'high', 100, {{ RuleRequest.amount }}"
                inputRef={(el) => {
                  if (el) inputRefsRef.current[`ternary_${path}.${branchType}_value`] = el;
                }}
                helperText="Value to return when this condition is met"
                sx={{
                  '& .MuiOutlinedInput-root': { backgroundColor: 'background.paper' },
                  '& .MuiOutlinedInput-input': hasVariableReference(branch.value) ? valueHighlightStyle : {},
                }}
              />
            </PropertyRow>
          ) : (
            branch.nested && renderTernaryNode(branch.nested, `${path}.${branchType}`, depth + 1)
          )}
        </Paper>
      </Box>
    );
  };

  const renderTernaryNode = (node: TernaryNode, path: string, depth: number): React.ReactNode => {
    return (
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            p: 2,
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 2,
            bgcolor: depth === 0 ? 'background.paper' : 'rgba(25, 118, 210, 0.04)',
            boxShadow: depth + 1,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
            {depth === 0 ? '🎯 Root Condition' : `🔗 Nested Condition (Level ${depth})`}
          </Typography>

          <PropertyRow onDrop={handleDrop(path, 'condition')} onDragOver={onDragOver}>
            <TextField
              fullWidth
              label="Condition"
              value={node.condition}
              onChange={(e) => handleConditionChange(path, e.target.value)}
              size="small"
              variant="outlined"
              disabled={viewOnly}
              placeholder="e.g., amount > 100, {{ RuleRequest.status }} === 'active'"
              inputRef={(el) => {
                if (el) inputRefsRef.current[`ternary_${path}_condition`] = el;
              }}
              error={!!getFieldError?.('ternaryTree')}
              helperText={viewOnly ? 'View only mode' : 'Enter boolean expression or drop variables'}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': { backgroundColor: 'background.paper' },
                '& .MuiOutlinedInput-input': hasVariableReference(node.condition) ? variableHighlightStyle : {},
              }}
            />
          </PropertyRow>

          {renderBranch(node.trueValue, path, 'true', depth)}
          {renderBranch(node.falseValue, path, 'false', depth)}
        </Box>
      </Box>
    );
  };

  return (
    <SectionContainer>
      <SectionTitle>Ternary Operator Configuration</SectionTitle>

      <FormControlLabel
        control={
          <Checkbox
            checked={storeResult}
            onChange={(e) => onStoreResultChange(e.target.checked)}
            disabled={viewOnly}
          />
        }
        label="Store result in variable"
      />

      {storeResult && (
        <PropertyRow onDrop={handleDrop('root', 'resultVar')} onDragOver={onDragOver}>
          <TextField
            fullWidth
            label="Result Variable"
            value={resultVar}
            onChange={handleResultVarChange}
            size="small"
            variant="outlined"
            disabled={viewOnly}
            placeholder="e.g., status, result"
            inputRef={(el) => {
              if (el) inputRefsRef.current['ternary_resultVar'] = el;
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-input': hasVariableReference(resultVar) ? variableHighlightStyle : {},
            }}
          />
        </PropertyRow>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Build nested conditions with true/false branches. Each branch can return a value or contain another condition.
      </Typography>

      {renderTernaryNode(ternaryTree, 'root', 0)}
    </SectionContainer>
  );
};

export default TernaryConditionEditor;
