import React from 'react';
import { TextField, Typography, Divider, Select, MenuItem, FormControl, InputLabel, FormHelperText, Button, Box } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import type { Node } from '@xyflow/react';
import type { NodeInput } from '../../../../utils/Templates/customFuncTemplate';
import { PropertyRow, SectionContainer, SectionTitle } from '../styles';
import CodeEditor from './CodeEditor';
import CodeEditorModal from './CodeEditorModal';

interface ParameterSectionProps {
  inputs: NodeInput[];
  currentParams: Record<string, string>;
  onParamChange: (paramKey: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onParamBlur?: () => void;
  onDrop: (paramKey: string) => (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | HTMLTextAreaElement>>;
  variableError: string | null;
  isReadOnly: boolean;
  viewOnly: boolean;
  nodeType?: string;
  allNodes?: Node[];
  getFieldError?: (fieldName: string) => string | undefined;
}

const ParameterSection: React.FC<ParameterSectionProps> = ({
  inputs,
  currentParams,
  onParamChange,
  onParamBlur,
  onDrop,
  onDragOver,
  inputRefs: inputRefsRef,
  variableError,
  isReadOnly,
  viewOnly,
  nodeType,
  getFieldError,
}) => {
  const [codeModalOpen, setCodeModalOpen] = React.useState(false);
  const [editingCodeField, setEditingCodeField] = React.useState<{ key: string; label: string; value: string } | null>(null);

  if (!inputs || inputs.length === 0) return null;

  const handleOpenCodeModal = (key: string, label: string, value: string) => {
    setEditingCodeField({ key, label, value });
    setCodeModalOpen(true);
  };

  const handleCloseCodeModal = () => {
    setCodeModalOpen(false);
    setEditingCodeField(null);
  };

  const handleSaveCode = (code: string) => {
    if (editingCodeField) {
      const syntheticEvent = {
        target: { value: code }
      } as React.ChangeEvent<HTMLInputElement>;
      onParamChange(editingCodeField.key)(syntheticEvent);
      if (onParamBlur) {
        onParamBlur();
      }
    }
  };

  return (
    <>
      <Divider />
      <SectionContainer>
        <SectionTitle>Parameters</SectionTitle> 

        {inputs.map((input) => {
          // Skip for-specific fields if loopType is not 'for'
          const loopType = currentParams['loopType'];
          if ((input.key === 'customIncrement' || input.key === 'incrementOperation' || input.key === 'initialization') && loopType !== 'for') {
            return null;
          }
          
          // Show loopCondition for both 'for' and 'while' loops
          if (input.key === 'loopCondition' && loopType !== 'for' && loopType !== 'while') {
            return null;
          }
          
          // Skip itemVariable for 'for' and 'while' loops (it's optional there)
          if (input.key === 'itemVariable' && (loopType === 'for' || loopType === 'while')) {
            return null;
          }
          
          // Skip indexVariable for 'while' loops (while loops typically use custom conditions)
          if (input.key === 'indexVariable' && loopType === 'while') {
            return null;
          }
          
          // Skip arrayVariable for 'while' loops (while loops use custom conditions, not array iteration)
          if (input.key === 'arrayVariable' && loopType === 'while') {
            return null;
          }
          
          // Skip resultVariable for forEach, for, and while (only needed for map/filter)
          if (input.key === 'resultVariable' && loopType !== 'map' && loopType !== 'filter') {
            return null;
          }
          
          // Skip filterCondition if loopType is not 'filter'
          if (input.key === 'filterCondition' && loopType !== 'filter') {
            return null;
          }

          // Show condition for every, some, find
          if (input.key === 'condition' && loopType !== 'every' && loopType !== 'some' && loopType !== 'find') {
            return null;
          }

          // Show reduceLogic and initialValue only for reduce
          if ((input.key === 'reduceLogic' || input.key === 'initialValue') && loopType !== 'reduce') {
            return null;
          }

          // For Array Operation node, only show 'value' for relevant operations
          if (nodeType === 'arrayOp' && input.key === 'value') {
            const operation = currentParams['operation'];
            if (operation !== 'push' && operation !== 'concat' && operation !== 'findIndex') {
              return null;
            }
          }

          // For Math node, only show 'value2' for operations that need it (pow)
          if (nodeType === 'math' && input.key === 'value2') {
            const method = currentParams['method'];
            if (method !== 'pow') {
              return null;
            }
          }

          // Show condition for every, some, find
          if (input.key === 'condition' && loopType !== 'every' && loopType !== 'some' && loopType !== 'find') {
            return null;
          }

          // Show reduceLogic and initialValue only for reduce
          if ((input.key === 'reduceLogic' || input.key === 'initialValue') && loopType !== 'reduce') {
            return null;
          }

          // For Array Operation node, only show 'value' for relevant operations
          if (nodeType === 'arrayOp' && input.key === 'value') {
            const operation = currentParams['operation'];
            if (operation !== 'push' && operation !== 'concat' && operation !== 'findIndex') {
              return null;
            }
          }

          // For Math node, only show 'value2' for operations that need it (pow)
          if (nodeType === 'math' && input.key === 'value2') {
            const method = currentParams['method'];
            if (method !== 'pow') {
              return null;
            }
          }

          // For String Function node, show/hide parameters based on operation
          if (nodeType === 'stringFunc') {
            const method = currentParams['method'];
            
            // separator only for split
            if (input.key === 'separator' && method !== 'split') {
              return null;
            }
            
            // start and end only for slice and substring
            if ((input.key === 'start' || input.key === 'end') && method !== 'slice' && method !== 'substring') {
              return null;
            }
          }

          // For Object Operation node, show/hide parameters based on operation
          if (nodeType === 'objectOp') {
            const operation = currentParams['operation'];
            
            // keys only for destructure
            if (input.key === 'keys' && operation !== 'destructure') {
              return null;
            }
            
            // property only for hasOwnProperty
            if (input.key === 'property' && operation !== 'hasOwnProperty') {
              return null;
            }
            
            // sourceObjects only for assign
            if (input.key === 'sourceObjects' && operation !== 'assign') {
              return null;
            }
          }

          // Skip returnValue if exitType is not 'return' (for Exit node)
          const exitType = currentParams['exitType'];
          if (input.key === 'returnValue' && exitType !== 'return') {
            return null;
          }

          const currentValue = currentParams[input.key] ?? input.defaultValue;
          const hasGlobalVariable =
            currentValue &&
            typeof currentValue === 'string' &&
            /\{\{\s*.+?\s*\}\}/.test(currentValue);

          // Determine if this should be a multiline input
          const isMultiline = input.type === 'textarea' || input.key === 'code' || input.key === 'query' || input.key === 'importStatement' || input.key === 'loopBody' || (typeof currentValue === 'string' && currentValue.length > 50);
          
          // Determine number of rows based on field type - use minRows for auto-expansion
          const getMinRows = () => {
            if (input.key === 'code' || input.key === 'loopBody') return 15; // Larger code blocks
            if (input.key === 'query' || input.key === 'importStatement') return 10; // SQL/Import statements
            if (isMultiline) return 8; // Default multiline
            return 1; // Single line
          };

          // Check for validation errors
          const fieldError = getFieldError?.(input.key);
          
          // Check if this is the variable name field for SetVariable node
          const isVariableNameField = nodeType === 'SetVariable' && (input.key === 'name' || input.key === 'variableName');
          const hasError = !!fieldError || (isVariableNameField && !!variableError);
          
          // Check if this is a code field
          const isCodeField = input.key === 'code' || input.key === 'loopBody' || input.key === 'query' || input.key === 'code_template' || input.key === 'function_code';
          
          // Determine helper text (simplified for code fields)
          const helperText = fieldError 
            || (isVariableNameField && variableError) 
            || (isReadOnly ? 'Start/End nodes cannot be edited' : '')
            || (viewOnly ? 'View only mode' : '')
            || (isCodeField ? 'Write or paste your code here' : `Default: ${input.defaultValue}. Drop variables here.`);

          // Render generic dropdown for inputs with options array
          if (input.options && input.options.length > 0) {
            return (
              <PropertyRow key={input.key}>
                <FormControl fullWidth size="small" error={hasError} disabled={isReadOnly || viewOnly}>
                  <InputLabel>{input.label}{input.required && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}</InputLabel>
                  <Select
                    value={currentValue || input.defaultValue || input.options[0]}
                    onChange={(e) => {
                      const syntheticEvent = {
                        target: { value: e.target.value as string }
                      } as React.ChangeEvent<HTMLInputElement>;
                      onParamChange(input.key)(syntheticEvent);
                    }}
                    label={input.label}
                  >
                    {input.options.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                  {helperText && <FormHelperText>{helperText}</FormHelperText>}
                </FormControl>
              </PropertyRow>
            );
          }

          // Render dropdown for declarationType (legacy support)
          if (input.key === 'declarationType') {
            return (
              <PropertyRow key={input.key}>
                <FormControl fullWidth size="small" error={hasError} disabled={isReadOnly || viewOnly}>
                  <InputLabel>{input.label}</InputLabel>
                  <Select
                    value={currentValue || 'var'}
                    onChange={(e) => {
                      const syntheticEvent = {
                        target: { value: e.target.value as string }
                      } as React.ChangeEvent<HTMLInputElement>;
                      onParamChange(input.key)(syntheticEvent);
                    }}
                    label={input.label}
                  >
                    <MenuItem value="var">var</MenuItem>
                    <MenuItem value="let">let</MenuItem>
                    <MenuItem value="const">const</MenuItem>
                  </Select>
                  {helperText && <FormHelperText>{helperText}</FormHelperText>}
                </FormControl>
              </PropertyRow>
            );
          }

          // Render dropdown for dataType (legacy support)
          if (input.key === 'dataType') {
            return (
              <PropertyRow key={input.key}>
                <FormControl fullWidth size="small" error={hasError} disabled={isReadOnly || viewOnly}>
                  <InputLabel>{input.label}</InputLabel>
                  <Select
                    value={currentValue || 'any'}
                    onChange={(e) => {
                      const syntheticEvent = {
                        target: { value: e.target.value as string }
                      } as React.ChangeEvent<HTMLInputElement>;
                      onParamChange(input.key)(syntheticEvent);
                    }}
                    label={input.label}
                  >
                    <MenuItem value="string">string</MenuItem>
                    <MenuItem value="number">number</MenuItem>
                    <MenuItem value="boolean">boolean</MenuItem>
                    <MenuItem value="array">array</MenuItem>
                    <MenuItem value="object">object</MenuItem>
                    <MenuItem value="any">any</MenuItem>
                    <MenuItem value="undefined">undefined</MenuItem>
                  </Select>
                  {helperText && <FormHelperText>{helperText}</FormHelperText>}
                </FormControl>
              </PropertyRow>
            );
          }

          // Render Button to open Modal for code_template fields (function definitions)
          if (input.key === 'code_template') {
            const lineCount = currentValue ? (currentValue.match(/\n/g) || []).length + 1 : 0;
            
            return (
              <PropertyRow key={input.key}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                  <Typography variant="body2" fontWeight={500}>
                    {input.label}
                    {input.required && (
                      <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>
                        *
                      </Typography>
                    )}
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    startIcon={<CodeIcon />}
                    onClick={() => handleOpenCodeModal(input.key, input.label, currentValue)}
                    disabled={isReadOnly || viewOnly}
                    fullWidth
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      py: 1.5,
                      borderStyle: 'dashed',
                      '&:hover': {
                        borderStyle: 'dashed',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        Edit Function Code
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {lineCount} lines of code
                      </Typography>
                    </Box>
                  </Button>
                  
                  {hasError && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {fieldError}
                    </Typography>
                  )}
                </Box>
              </PropertyRow>
            );
          }

          // Render Monaco Editor inline for other code fields (loopBody, query, etc.)
          if (isCodeField) {
            return (
              <PropertyRow
                key={input.key}
                onDrop={onDrop(input.key)}
                onDragOver={onDragOver}
              >
                <CodeEditor
                  value={currentValue}
                  onChange={(value) => {
                    const syntheticEvent = {
                      target: { value }
                    } as React.ChangeEvent<HTMLInputElement>;
                    onParamChange(input.key)(syntheticEvent);
                  }}
                  onBlur={onParamBlur}
                  label={input.label}
                  disabled={isReadOnly || viewOnly}
                  error={hasError}
                  helperText={fieldError || (isReadOnly ? 'Start/End nodes cannot be edited' : '') || (viewOnly ? 'View only mode' : '')}
                  language={input.key === 'query' ? 'sql' : 'typescript'}
                  height={input.key === 'code' || input.key === 'loopBody' || input.key === 'code_template' ? '500px' : '350px'}
                  required={input.required}
                />
              </PropertyRow>
            );
          }

          return (
            <PropertyRow
              key={input.key}
              onDrop={onDrop(input.key)}
              onDragOver={onDragOver}
            >
              <TextField
                fullWidth
                label={
                  <>
                    {input.label}
                    {input.required && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
                  </>
                }
                value={currentValue}
                onChange={onParamChange(input.key)}
                onBlur={onParamBlur}
                size="small"
                variant="outlined"
                multiline={isMultiline}
                minRows={getMinRows()}
                maxRows={30}
                error={hasError}
                helperText={helperText}
                disabled={isReadOnly || viewOnly}
                inputRef={(el) => {
                  if (el) inputRefsRef.current[input.key] = el;
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: isMultiline ? 'monospace' : 'inherit',
                    fontSize: isMultiline ? '0.875rem' : 'inherit',
                    backgroundColor: 'background.paper',
                    transition: 'all 0.2s',
                  },
                  '& .MuiOutlinedInput-input': {
                    ...(hasGlobalVariable && {
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
            </PropertyRow>
          );
        })}
        
        {/* Code Editor Modal */}
        {editingCodeField && (
          <CodeEditorModal
            open={codeModalOpen}
            onClose={handleCloseCodeModal}
            onSave={handleSaveCode}
            initialValue={editingCodeField.value}
            title={`Edit ${editingCodeField.label}`}
            language="typescript"
          />
        )}
      </SectionContainer>
    </>
  );
};

export default ParameterSection;
