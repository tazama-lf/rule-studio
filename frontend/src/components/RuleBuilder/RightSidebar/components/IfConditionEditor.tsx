import React from 'react';
import { Box, TextField, Button, IconButton, Divider } from '@mui/material';
import type { Node } from '@xyflow/react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { IfCondition } from '../../../../hooks/RuleBuilder/useIfConditions';
import { PropertyRow, SectionContainer, SectionTitle } from '../styles';

interface IfConditionEditorProps {
  conditions: IfCondition[];
  onConditionChange: (index: number, newCondition: string) => void;
  onAddElseIf: () => void;
  onAddElse: () => void;
  onRemoveCondition: (index: number) => void;
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | HTMLTextAreaElement>>;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  viewOnly: boolean;
  allNodes?: Node[];
  getFieldError?: (fieldName: string) => string | undefined;
}

const IfConditionEditor: React.FC<IfConditionEditorProps> = ({
  conditions,
  onConditionChange,
  onAddElseIf,
  onAddElse,
  onRemoveCondition,
  inputRefs: inputRefsRef,
  onDragOver,
  viewOnly,
  getFieldError,
}) => {
  return (
    <>
      <Divider />
      <SectionContainer>
        <SectionTitle>Conditions</SectionTitle>

        <Box>
          {conditions.map((cond, index) => (
            <PropertyRow
              key={index}
              onDrop={(e) => {
                if (cond.type !== 'else' && !viewOnly) {
                  e.preventDefault();
                  let variablePath = e.dataTransfer.getData('variablePath');
                  if (variablePath) {
                    // Strip all {{ }} wrapping to avoid double wrapping (global replace)
                    variablePath = variablePath.replace(/\{\{\s*/g, '').replace(/\s*\}\}/g, '').trim();
                    
                    const inputElement = inputRefsRef.current[`condition_${index}`];
                    const currentValue = cond.condition || '';

                    let newValue: string;

                    if (inputElement) {
                      const start = inputElement.selectionStart || 0;
                      const end = inputElement.selectionEnd || 0;
                      const textBefore = currentValue.substring(0, start);
                      const textAfter = currentValue.substring(end);
                      // Wrap variable with {{ }} for UI indication
                      newValue = textBefore + `{{ ${variablePath} }}` + textAfter;

                      setTimeout(() => {
                        const newCursorPos = start + `{{ ${variablePath} }}`.length;
                        inputElement.setSelectionRange(newCursorPos, newCursorPos);
                        inputElement.focus();
                      }, 0);
                    } else {
                      // Wrap variable with {{ }} for UI indication
                      const wrappedVariable = `{{ ${variablePath} }}`;
                      newValue = currentValue ? `${currentValue} ${wrappedVariable}` : wrappedVariable;
                    }

                    onConditionChange(index, newValue);
                  }
                }
              }}
              onDragOver={onDragOver}
            >
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', width: '100%' }}>
                <TextField
                  fullWidth
                  label={cond.type === 'else' ? 'Else (no condition)' : `${cond.type === 'if' ? 'If' : 'Else If'} Condition`}
                  value={cond.condition || ''}
                  onChange={(e) => onConditionChange(index, e.target.value)}
                  size="small"
                  variant="outlined"
                  disabled={cond.type === 'else' || viewOnly}
                  inputRef={(el) => {
                    if (el && cond.type !== 'else') inputRefsRef.current[`condition_${index}`] = el;
                  }}
                  error={!!getFieldError?.('conditions')}
                  helperText={
                    getFieldError?.('conditions') ||
                    (cond.type === 'else'
                      ? 'Default fallback path'
                      : viewOnly
                        ? 'View only mode'
                        : 'Enter boolean expression or drop variables')
                  }
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'background.paper',
                      transition: 'all 0.2s',
                    },
                    '& .MuiOutlinedInput-input': {
                      ...((cond.condition && (cond.condition.includes('RuleRequest.') || cond.condition.includes('RuleConfig.'))) && {
                        background: `linear-gradient(to bottom, 
                          transparent 0%, 
                          transparent calc(100% - 2px), 
                          #4caf50 calc(100% - 2px), 
                          #4caf50 100%
                        )`,
                        backgroundSize: '100% 100%',
                        backgroundRepeat: 'no-repeat',
                      }),
                    },
                  }}
                />
                {index > 0 && !viewOnly && (
                  <IconButton size="small" color="error" onClick={() => onRemoveCondition(index)} sx={{ mt: 0.5 }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </PropertyRow>
          ))}

          {!viewOnly && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={onAddElseIf}
                fullWidth
              >
                Add Else If
              </Button>
              {!conditions.some((c) => c.type === 'else') && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={onAddElse}
                  fullWidth
                >
                  Add Else
                </Button>
              )}
            </Box>
          )}
        </Box>
      </SectionContainer>
    </>
  );
};

export default IfConditionEditor;
