import React from 'react';
import { TextField, Typography, Divider, Checkbox, FormControlLabel, Select, MenuItem, FormControl, InputLabel, FormHelperText, Paper, Box } from '@mui/material';
import type { Node } from '@xyflow/react';
import { PropertyRow, SectionContainer, SectionTitle } from '../styles';
import { getFunctionParameters, generateFunctionArgs, type FunctionParameter } from '../../../../utils/Flow/functionParameterUtils';
import { withCursorPreservation } from '../../../../utils/cursorPreservation';

interface FunctionCallSectionProps {
  functionName: string;
  currentParams: Record<string, string>;
  onParamChange: (paramKey: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onParamBlur?: () => void;
  onDrop: (paramKey: string) => (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | HTMLTextAreaElement>>;
  isReadOnly: boolean;
  viewOnly: boolean;
  allNodes?: Node[];
  nodeType?: string;
  getFieldError?: (fieldName: string) => string | undefined;
}

const FunctionCallSection: React.FC<FunctionCallSectionProps> = ({
  functionName,
  currentParams,
  onParamChange,
  onParamBlur,
  onDrop,
  onDragOver,
  inputRefs: inputRefsRef,
  isReadOnly,
  viewOnly,
  allNodes,
  nodeType,
  getFieldError,
}) => {
  const isCustomFunctionCall = nodeType === 'CustomFunction';

  const availableCustomFunctions = React.useMemo(() => {
    if (!isCustomFunctionCall || !allNodes || allNodes.length === 0) return [];
    
    return allNodes
      .filter(node => {
        const nodeData = node.data as { nodeType?: string; mode?: string; generation_type?: string; params?: Record<string, string> };
        return nodeData?.nodeType === 'CustomFunction' && 
               (nodeData?.mode === 'definition' || nodeData?.generation_type === 'definition') &&
               nodeData?.params?.function_name;
      })
      .map(node => {
        const params = (node.data as { params?: Record<string, string> }).params;
        return {
          name: params?.function_name || '',
          id: node.id,
        };
      })
      .filter(f => f.name);
  }, [isCustomFunctionCall, allNodes]);

  const selectedFunctionName = currentParams['function_name'] || functionName;

  const parameters = React.useMemo(
    () => {
      if (!selectedFunctionName) return null;
      return getFunctionParameters(selectedFunctionName, allNodes);
    },
    [selectedFunctionName, allNodes]
  );

  // Show function selector if this is a CustomFunction call and no function is selected yet
  if (isCustomFunctionCall && !selectedFunctionName) {
    return (
      <>
        <Divider />
        <SectionContainer>
          <SectionTitle>Function Call</SectionTitle>
          
          {availableCustomFunctions.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 1 }}>
              No custom functions found. Create a custom function definition on the main canvas first.
            </Typography>
          ) : (
            <PropertyRow>
              <FormControl fullWidth size="small" error={!!getFieldError?.('function_name')}>
                <InputLabel>Select Function to Call</InputLabel>
                <Select
                  value=""
                  onChange={(e) => {
                    const syntheticEvent = {
                      target: { value: e.target.value }
                    } as React.ChangeEvent<HTMLInputElement>;
                    onParamChange('function_name')(syntheticEvent);
                    if (onParamBlur) onParamBlur();
                  }}
                  label="Select Function to Call"
                  disabled={isReadOnly || viewOnly}
                >
                  {availableCustomFunctions.map((func) => (
                    <MenuItem key={func.id} value={func.name}>
                      {func.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {getFieldError?.('function_name') || 'Choose which custom function to call'}
                </FormHelperText>
              </FormControl>
            </PropertyRow>
          )}
        </SectionContainer>
      </>
    );
  }

  if (!parameters || parameters.length === 0) {
    return (
      <>
        <Divider />
        <SectionContainer>
          <SectionTitle>Function Call</SectionTitle>
          
          {isCustomFunctionCall && (
            <PropertyRow sx={{ mb: 2 }}>
              <FormControl fullWidth size="small" error={!!getFieldError?.('function_name')}>
                <InputLabel>Select Function to Call</InputLabel>
                <Select
                  value={selectedFunctionName || ''}
                  onChange={(e) => {
                    const syntheticEvent = {
                      target: { value: e.target.value }
                    } as React.ChangeEvent<HTMLInputElement>;
                    onParamChange('function_name')(syntheticEvent);
                    if (onParamBlur) onParamBlur();
                  }}
                  label="Select Function to Call"
                  disabled={isReadOnly || viewOnly}
                >
                  {availableCustomFunctions.map((func) => (
                    <MenuItem key={func.id} value={func.name}>
                      {func.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {getFieldError?.('function_name') || 'Choose which custom function to call'}
                </FormHelperText>
              </FormControl>
            </PropertyRow>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 1 }}>
            No parameters found for function "{selectedFunctionName}". Make sure the function definition exists on the main canvas.
          </Typography>
        </SectionContainer>
      </>
    );
  }

  const storeResult = currentParams['storeResult'] !== 'false'; // Default to true

  return (
    <>
      <Divider />
      <SectionContainer>
        <SectionTitle>Function Call: {selectedFunctionName}</SectionTitle>
        {isCustomFunctionCall && availableCustomFunctions.length > 0 && (
          <PropertyRow>
            <FormControl fullWidth size="small" error={!!getFieldError?.('function_name')}>
              <InputLabel>Function to Call</InputLabel>
              <Select
                value={selectedFunctionName || ''}
                onChange={(e) => {
                  const syntheticEvent = {
                    target: { value: e.target.value }
                  } as React.ChangeEvent<HTMLInputElement>;
                  onParamChange('function_name')(syntheticEvent);
                  if (onParamBlur) onParamBlur();
                }}
                label="Function to Call"
                disabled={isReadOnly || viewOnly}
              >
                {availableCustomFunctions.map((func) => (
                  <MenuItem key={func.id} value={func.name}>
                    {func.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {getFieldError?.('function_name') || 'Change function if needed'}
              </FormHelperText>
            </FormControl>
          </PropertyRow>
        )}
        <PropertyRow>
          <FormControlLabel
            control={
              <Checkbox
                checked={storeResult}
                onChange={(e) => {
                  const syntheticEvent = {
                    target: { value: e.target.checked ? 'true' : 'false' }
                  } as React.ChangeEvent<HTMLInputElement>;
                  onParamChange('storeResult')(syntheticEvent);
                }}
                disabled={isReadOnly || viewOnly}
              />
            }
            label="Store result in variable"
          />
        </PropertyRow>
        {storeResult && (
          <PropertyRow>
            <TextField
              fullWidth
              size="small"
              label="Result Variable Name"
              value={'resultVariable' in currentParams ? currentParams['resultVariable'] : 'result'}
              onChange={withCursorPreservation(onParamChange('resultVariable'))}
              onBlur={onParamBlur}
              onDrop={onDrop('resultVariable')}
              onDragOver={onDragOver}
              inputRef={(el: HTMLInputElement) => {
                if (el) inputRefsRef.current['resultVariable'] = el;
              }}
              disabled={isReadOnly || viewOnly}
              error={!!getFieldError?.('resultVariable')}
              helperText={getFieldError?.('resultVariable') || 'Variable to store the function result'}
              placeholder="result"
            />
          </PropertyRow>
        )}

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Function Arguments
        </Typography>

        {parameters.map((param: FunctionParameter, index: number) => {
          const currentValue = param.name in currentParams ? currentParams[param.name] : '';
          const hasGlobalVariable = /\{\{\s*.+?\s*\}\}/.test(currentValue);
          const fieldError = getFieldError?.(param.name);

          return (
            <PropertyRow key={param.name}>
              <TextField
                fullWidth
                size="small"
                label={`${param.label} (${param.type})`}
                value={currentValue}
                onChange={withCursorPreservation(onParamChange(param.name))}
                onBlur={onParamBlur}
                onDrop={onDrop(param.name)}
                onDragOver={onDragOver}
                inputRef={(el: HTMLInputElement | HTMLTextAreaElement) => {
                  if (el) inputRefsRef.current[param.name] = el;
                }}
                disabled={isReadOnly || viewOnly}
                error={!!fieldError}
                helperText={
                  fieldError ||
                  (hasGlobalVariable 
                    ? '✓ Using global variable' 
                    : `Argument ${index + 1}: ${param.name}. Drop variables or enter value.`)
                }
                placeholder={`Enter ${param.name}`}
                sx={{
                  '& .MuiOutlinedInput-root': hasGlobalVariable
                    ? {
                        backgroundColor: 'rgba(76, 175, 80, 0.08)',
                        '& fieldset': { borderColor: 'success.main' },
                      }
                    : {},
                }}
              />
            </PropertyRow>
          );
        })}
        <PropertyRow sx={{ mt: 2 }}>
          <Box sx={{ width: '100%' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Generated Code:
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                bgcolor: 'grey.900',
                color: 'grey.100',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                overflow: 'auto',
              }}
            >
              {storeResult && `const ${currentParams['resultVariable'] || 'result'} = `}
              {selectedFunctionName}({generateFunctionArgs(parameters, currentParams)})
            </Paper>
          </Box>
        </PropertyRow>
      </SectionContainer>
    </>
  );
};

export default React.memo(FunctionCallSection, (prevProps, nextProps) => {
  return (
    prevProps.functionName === nextProps.functionName &&
    prevProps.nodeType === nextProps.nodeType &&
    prevProps.isReadOnly === nextProps.isReadOnly &&
    prevProps.viewOnly === nextProps.viewOnly &&
    prevProps.currentParams === nextProps.currentParams &&
    prevProps.allNodes?.length === nextProps.allNodes?.length
  );
});
