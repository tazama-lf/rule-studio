import React from 'react';
import { Box, TextField, Button, Divider, Typography, Checkbox, FormControlLabel, Paper, Chip } from '@mui/material';
import type { Node } from '@xyflow/react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { PropertyRow, SectionContainer, SectionTitle } from '../styles';

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
  const handleDrop = (path: string, field: 'condition' | 'value' | 'resultVar') => (e: React.DragEvent<HTMLDivElement>) => {
    if (viewOnly) return;
    e.preventDefault();
    let variablePath = e.dataTransfer.getData('variablePath');
    if (variablePath) {
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
        const textBefore = currentValue.substring(0, start);
        const textAfter = currentValue.substring(end);
        newValue = textBefore + `{{ ${variablePath} }}` + textAfter;

        setTimeout(() => {
          const newCursorPos = start + `{{ ${variablePath} }}`.length;
          inputElement.setSelectionRange(newCursorPos, newCursorPos);
          inputElement.focus();
        }, 0);
      } else {
        const wrappedVariable = `{{ ${variablePath} }}`;
        newValue = currentValue ? `${currentValue} ${wrappedVariable}` : wrappedVariable;
      }

      if (field === 'resultVar') {
        onResultVarChange(newValue);
      } else if (field === 'condition') {
        updateAtPath(path, 'condition', newValue);
      } else if (field === 'value') {
        updateAtPath(path, 'value', newValue);
      }
    }
  };

  const getNodeOrBranchAtPath = (node: TernaryNode, path: string): TernaryNode | TernaryBranch | null => {
    if (path === 'root') return node;
    
    const parts = path.split('.');
    let current: TernaryNode | TernaryBranch = node;
    
    for (let i = 1; i < parts.length; i++) {
      if ('trueValue' in current && 'falseValue' in current) {
        const branch: TernaryBranch = parts[i] === 'true' ? current.trueValue : current.falseValue;
        if (i === parts.length - 1) {
          return branch;
        }
        if (branch.type === 'nested' && branch.nested) {
          current = branch.nested;
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
    
    return current;
  };

  const updateAtPath = (path: string, field: 'condition' | 'value', newValue: string) => {
    const newTree = JSON.parse(JSON.stringify(ternaryTree)) as TernaryNode;
    
    if (path === 'root' && field === 'condition') {
      newTree.condition = newValue;
      onTreeChange(newTree);
      return;
    }

    const parts = path.split('.');
    let current: TernaryNode = newTree;
    
    for (let i = 1; i < parts.length - 1; i++) {
      const branch = parts[i] === 'true' ? current.trueValue : current.falseValue;
      if (branch.type === 'nested' && branch.nested) {
        current = branch.nested;
      }
    }
    
    const lastPart = parts[parts.length - 1];
    const targetBranch = lastPart === 'true' ? current.trueValue : current.falseValue;
    
    if (field === 'value' && targetBranch.type === 'value') {
      targetBranch.value = newValue;
    } else if (field === 'condition' && targetBranch.type === 'nested' && targetBranch.nested) {
      targetBranch.nested.condition = newValue;
    }
    
    onTreeChange(newTree);
  };

  const updateBranchAtPath = (path: string, branchType: 'true' | 'false', newBranch: TernaryBranch) => {
    console.log('updateBranchAtPath called:', { path, branchType, newBranch });
    const newTree = JSON.parse(JSON.stringify(ternaryTree)) as TernaryNode;
    
    if (path === 'root') {
      if (branchType === 'true') {
        newTree.trueValue = newBranch;
      } else {
        newTree.falseValue = newBranch;
      }
      console.log('Updating root tree:', newTree);
      onTreeChange(newTree);
      return;
    }

    const parts = path.split('.');
    let current: TernaryNode = newTree;

    for (let i = 1; i < parts.length; i++) {
      const branchName = parts[i];
      const branch: TernaryBranch = branchName === 'true' ? current.trueValue : current.falseValue;
      if (branch.type === 'nested' && branch.nested) {
        current = branch.nested;
      } else {
        console.error('Invalid path - cannot navigate to nested node', { path, branchName, branch });
        return;
      }
    }

    if (branchType === 'true') {
      current.trueValue = newBranch;
    } else {
      current.falseValue = newBranch;
    }
    
    console.log('Updated nested tree:', newTree);
    onTreeChange(newTree);
  };

  const renderBranch = (branch: TernaryBranch, path: string, branchType: 'true' | 'false', depth: number) => {
    const bgColor = branchType === 'true' ? 'rgba(76, 175, 80, 0.08)' : 'rgba(244, 67, 54, 0.08)';
    const borderColor = branchType === 'true' ? 'success.main' : 'error.main';
    const icon = branchType === 'true' ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />;
    const label = branchType === 'true' ? 'IF TRUE' : 'IF FALSE';
    
    return (
      <Box sx={{ ml: depth * 2, mt: 1.5 }}>
        <Paper 
          sx={{ 
            p: 2, 
            bgcolor: bgColor, 
            border: '2px solid', 
            borderColor: borderColor,
            borderRadius: 2
          }}
        >
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {icon}
              <Chip 
                label={label} 
                size="small" 
                color={branchType === 'true' ? 'success' : 'error'}
                sx={{ fontWeight: 600 }}
              />
            </Box>
            {!viewOnly && branch.type === 'value' && (
              <Button
                size="small"
                variant="contained"
                color={branchType === 'true' ? 'success' : 'error'}
                startIcon={<AddIcon />}
                onClick={() => updateBranchAtPath(path, branchType, {
                  type: 'nested',
                  nested: {
                    condition: '',
                    trueValue: { type: 'value', value: '' },
                    falseValue: { type: 'value', value: '' }
                  }
                })}
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
                onClick={() => updateBranchAtPath(path, branchType, { type: 'value', value: '' })}
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
                  console.log('Value field onChange:', { path, branchType, value: e.target.value, viewOnly });
                  if (!viewOnly) {
                    updateBranchAtPath(path, branchType, { type: 'value', value: e.target.value });
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
                  '& .MuiOutlinedInput-input': {
                    ...((branch.value && (branch.value.includes('RuleRequest.') || branch.value.includes('RuleConfig.'))) && {
                      background: `linear-gradient(to bottom, transparent 0%, transparent calc(100% - 2px), #2196f3 calc(100% - 2px), #2196f3 100%)`,
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                    }),
                  },
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

  const renderTernaryNode = (node: TernaryNode, path: string, depth: number) => {
    return (
      <Box sx={{ mb: 2 }}>
        <Paper 
          elevation={depth + 1} 
          sx={{ 
            p: 2, 
            border: '2px solid', 
            borderColor: 'primary.main',
            borderRadius: 2,
            bgcolor: depth === 0 ? 'background.paper' : 'rgba(25, 118, 210, 0.04)'
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
            {depth === 0 ? '🎯 Root Condition' : `🔗 Nested Condition (Level ${depth})`}
          </Typography>
          
          <PropertyRow onDrop={handleDrop(path, 'condition')} onDragOver={onDragOver}>
            <TextField
              fullWidth
              label="Condition"
              value={node.condition || ''}
              onChange={(e) => {
                console.log('Condition field onChange:', { path, value: e.target.value, viewOnly });
                if (viewOnly) {
                  console.log('viewOnly is true - blocking edit');
                  return;
                }
                const newTree = JSON.parse(JSON.stringify(ternaryTree)) as TernaryNode;
                if (path === 'root') {
                  newTree.condition = e.target.value;
                } else {
                  const parts = path.split('.');
                  let current: TernaryNode = newTree;
                  for (let i = 1; i < parts.length; i++) {
                    const branch = parts[i] === 'true' ? current.trueValue : current.falseValue;
                    if (branch.type === 'nested' && branch.nested) {
                      current = branch.nested;
                    }
                  }
                  current.condition = e.target.value;
                }
                onTreeChange(newTree);
              }}
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
                '& .MuiOutlinedInput-input': {
                  ...((node.condition && (node.condition.includes('RuleRequest.') || node.condition.includes('RuleConfig.'))) && {
                    background: `linear-gradient(to bottom, transparent 0%, transparent calc(100% - 2px), #4caf50 calc(100% - 2px), #4caf50 100%)`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                  }),
                },
              }}
            />
          </PropertyRow>

          {renderBranch(node.trueValue, path, 'true', depth)}
          {renderBranch(node.falseValue, path, 'false', depth)}
        </Paper>
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
            onChange={(e) => {
              console.log('ResultVar onChange:', { value: e.target.value, viewOnly });
              if (!viewOnly) {
                onResultVarChange(e.target.value);
              }
            }}
            size="small"
            variant="outlined"
            disabled={viewOnly}
            placeholder="e.g., status, result"
            inputRef={(el) => {
              if (el) inputRefsRef.current['ternary_resultVar'] = el;
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-input': {
                ...((resultVar && (resultVar.includes('RuleRequest.') || resultVar.includes('RuleConfig.'))) && {
                  background: `linear-gradient(to bottom, transparent 0%, transparent calc(100% - 2px), #4caf50 calc(100% - 2px), #4caf50 100%)`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                }),
              },
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
