import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Paper,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CodeIcon from '@mui/icons-material/Code';
import { PropertyRow, SectionContainer, SectionTitle } from '../styles';
import CodeEditorModal from './CodeEditorModal';

interface FunctionParameter {
  name: string;
  type: string;
  label: string;
  required?: boolean;
}

interface ParameterConfigSectionProps {
  currentParams: Record<string, string>;
  onParamChange: (paramKey: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onParamBlur?: () => void;
  onDirectUpdate?: (params: Record<string, string>) => void;
  isReadOnly: boolean;
  viewOnly: boolean;
  getFieldError?: (fieldName: string) => string | undefined;
}

const PARAMETER_TYPES = [
  'string',
  'number',
  'boolean',
  'any',
  'string[]',
  'number[]',
  'object',
];

const ParameterConfigSection: React.FC<ParameterConfigSectionProps> = ({
  currentParams,
  onParamChange,
  onParamBlur,
  onDirectUpdate,
  isReadOnly,
  viewOnly,
  getFieldError,
}) => {
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  
  const [localParameters, setLocalParameters] = useState<FunctionParameter[]>([]);
  const syncTimeoutRef = useRef<number | null>(null);

  const parametersFromParent = useMemo<FunctionParameter[]>(() => {
    try {
      const paramsStr = currentParams['parameters'] || '[]';
      return JSON.parse(paramsStr);
    } catch {
      return [];
    }
  }, [currentParams]);

  useEffect(() => {
    setLocalParameters(parametersFromParent);
  }, [parametersFromParent]);

  const functionName = currentParams['function_name'] || '';
  const codeTemplate = currentParams['code_template'] || '';

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Check if code_template is a default/placeholder value
  const isDefaultCodeTemplate = useMemo(() => {
    if (!codeTemplate) return true;
    const placeholderPatterns = [
      '// Write your function code here',
    ];
    const hasOnlyPlaceholder = placeholderPatterns.some(pattern => {
      const trimmedCode = codeTemplate.trim();
      return trimmedCode === pattern || 
             (trimmedCode.includes(pattern) && codeTemplate.length < 100);
    });
    return hasOnlyPlaceholder;
  }, [codeTemplate]);

  const codeTemplateWithWrapper = useMemo(() => {
    if (codeTemplate && !isDefaultCodeTemplate) {
      return codeTemplate;
    }
    
    if (!functionName) {
      return '// Please enter a function name first';
    }
    
    const params = localParameters
      .map((p) => {
        const optionalMarker = p.required === false ? '?' : '';
        return `${p.name}${optionalMarker}: ${p.type}`;
      })
      .join(', ');
    return `export const ${functionName} = (${params}) => {\n  // Write your function code here\n};`;
  }, [codeTemplate, isDefaultCodeTemplate, functionName, localParameters]);

  const syncToParent = useCallback(
    (newParams: FunctionParameter[]) => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(() => {
        const jsonString = JSON.stringify(newParams);
        
        const syntheticEvent = {
          target: { 
            value: jsonString,
            name: 'parameters',
            dataset: {
              multiUpdate: JSON.stringify({
                parameters: jsonString,
                parameter_count: String(newParams.length)
              })
            }
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        
        onParamChange('parameters')(syntheticEvent);
        
        if (onParamBlur) {
          onParamBlur();
        }
      }, 300);
    },
    [onParamChange, onParamBlur]
  );

  const updateParameters = useCallback(
    (newParams: FunctionParameter[]) => {
      setLocalParameters(newParams);
      syncToParent(newParams);
    },
    [syncToParent]
  );

  const handleAddParameter = useCallback(() => {
    const newParam: FunctionParameter = {
      name: `param${localParameters.length + 1}`,
      type: 'any',
      label: `Parameter ${localParameters.length + 1}`,
      required: false,
    };
    updateParameters([...localParameters, newParam]);
  }, [localParameters, updateParameters]);

  const handleRemoveParameter = useCallback(
    (index: number) => {
      const newParams = localParameters.filter((_, i) => i !== index);
      updateParameters(newParams);
    },
    [localParameters, updateParameters]
  );

  const handleParameterChange = useCallback(
    (index: number, field: keyof FunctionParameter, value: string | boolean) => {
      const newParams = [...localParameters];
      newParams[index] = { ...newParams[index], [field]: value };
      setLocalParameters(newParams);
      syncToParent(newParams);
    },
    [localParameters, syncToParent]
  );

  const handleOpenCodeModal = useCallback(() => {
    setCodeModalOpen(true);
  }, []);

  const handleCloseCodeModal = useCallback(() => {
    setCodeModalOpen(false);
  }, []);

  const handleSaveCode = useCallback(
    (code: string) => {
      // If onDirectUpdate is available, use it for immediate update
      if (onDirectUpdate) {
        const updatedParams = { ...currentParams, code_template: code };
        onDirectUpdate(updatedParams);
      } else {
        // Fallback to the old method
        const syntheticEvent = {
          target: { value: code },
        } as React.ChangeEvent<HTMLInputElement>;
        onParamChange('code_template')(syntheticEvent);
        
        // Force immediate blur after a short delay to ensure state is updated
        setTimeout(() => {
          if (onParamBlur) {
            onParamBlur();
          }
        }, 50);
      }
    },
    [onParamChange, onParamBlur, onDirectUpdate, currentParams]
  );

  // Generate function signature preview
  const functionSignature = useMemo(() => {
    if (!functionName) {
      return 'export const [functionName] = (...params) => { ... }';
    }
    const params = localParameters
      .map((p) => {
        const optionalMarker = p.required === false ? '?' : '';
        return `${p.name}${optionalMarker}: ${p.type}`;
      })
      .join(', ');
    return `export const ${functionName} = (${params || ''}) => { ... }`;
  }, [functionName, localParameters]);

  const lineCount = codeTemplateWithWrapper ? (codeTemplateWithWrapper.match(/\n/g) || []).length + 1 : 0;

  return (
    <>
      <Divider />
      <SectionContainer>
        <SectionTitle>Custom Function Configuration</SectionTitle>

        {/* Function Name */}
        <PropertyRow>
          <TextField
            fullWidth
            size="small"
            label="Function Name"
            value={functionName}
            onChange={onParamChange('function_name')}
            onBlur={onParamBlur}
            disabled={isReadOnly || viewOnly}
            error={!!getFieldError?.('function_name')}
            helperText={getFieldError?.('function_name') || 'Must be a valid JavaScript identifier (e.g., calculateTotal, processData)'}
            placeholder="e.g., calculateTotal"
            required
          />
        </PropertyRow>

        {/* Parameters Section */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Function Parameters
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddParameter}
              disabled={isReadOnly || viewOnly}
              variant="outlined"
            >
              Add Parameter
            </Button>
          </Box>

          {localParameters.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary">
                No parameters defined. Click "Add Parameter" to add function parameters.
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {localParameters.map((param, index) => (
                <Paper
                  key={index}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    bgcolor: 'background.paper',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      {/* Parameter Name */}
                      <TextField
                        size="small"
                        label="Name"
                        value={param.name}
                        onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                        disabled={isReadOnly || viewOnly}
                        placeholder="paramName"
                        sx={{ flex: 1 }}
                      />

                      {/* Parameter Type */}
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Type</InputLabel>
                        <Select
                          value={param.type}
                          onChange={(e) => handleParameterChange(index, 'type', e.target.value)}
                          label="Type"
                          disabled={isReadOnly || viewOnly}
                        >
                          {PARAMETER_TYPES.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {/* Delete Button */}
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveParameter(index)}
                        disabled={isReadOnly || viewOnly}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {/* Parameter Label */}
                      <TextField
                        size="small"
                        label="Display Label"
                        value={param.label}
                        onChange={(e) => handleParameterChange(index, 'label', e.target.value)}
                        disabled={isReadOnly || viewOnly}
                        placeholder="Parameter Label"
                        sx={{ flex: 1 }}
                      />

                      {/* Required Checkbox */}
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={param.required || false}
                            onChange={(e) => handleParameterChange(index, 'required', e.target.checked)}
                            disabled={isReadOnly || viewOnly}
                            size="small"
                          />
                        }
                        label="Required"
                        sx={{ minWidth: 100 }}
                      />
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>

        {/* Function Signature Preview */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Function Signature:
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
            {functionSignature}
          </Paper>
        </Box>

        {/* Code Editor Button */}
        <PropertyRow sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
            <Typography variant="body2" fontWeight={500}>
              Function Code
              <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>
                *
              </Typography>
            </Typography>

            <Button
              variant="outlined"
              startIcon={<CodeIcon />}
              onClick={handleOpenCodeModal}
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

            {getFieldError?.('code_template') && (
              <Typography variant="caption" color="error">
                {getFieldError('code_template')}
              </Typography>
            )}
          </Box>
        </PropertyRow>
      </SectionContainer>

      {/* Code Editor Modal */}
      <CodeEditorModal
        open={codeModalOpen}
        onClose={handleCloseCodeModal}
        onSave={handleSaveCode}
        initialValue={codeTemplateWithWrapper}
        title={`Edit Function Code${functionName ? `: ${functionName}` : ''}`}
        language="typescript"
      />
    </>
  );
};

export default React.memo(ParameterConfigSection, (prevProps, nextProps) => {
  return (
    prevProps.isReadOnly === nextProps.isReadOnly &&
    prevProps.viewOnly === nextProps.viewOnly &&
    prevProps.currentParams === nextProps.currentParams
  );
});
