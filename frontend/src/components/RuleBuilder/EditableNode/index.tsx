import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Box, Typography, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNodeRenderer } from '../../../hooks/RuleBuilder';
import { useNodeValidation } from '../../../hooks/RuleBuilder/useNodeValidation';
import { NodeHeader } from './NodeHeader';
import { NodeHandles } from './NodeHandles';

export interface EditableNodeData extends Record<string, unknown> {
  label: string;
  onChange?: (value: string) => void;
  onParamChange?: (paramKey: string, value: string) => void;
  nodeType: string;
  params?: Record<string, string>;
  mode?: 'definition' | 'call';
  generation_type?: 'definition' | 'call';
  function_name?: string;
}

const NodeContainer = styled(Box)<{ 
  backgroundColor: string; 
  borderColor: string; 
  selected: boolean;
  hasError: boolean;
}>(({ theme, backgroundColor, borderColor, selected, hasError }) => ({
  width: '180px',
  minHeight: '50px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  backgroundColor,
  border: `2px solid ${hasError ? theme.palette.error.main : selected ? theme.palette.primary.main : borderColor}`,
  borderRadius: '8px',
  padding: theme.spacing(1.5),
  boxShadow: hasError 
    ? '0 0 8px rgba(244, 67, 54, 0.5)'
    : selected 
      ? '0 4px 12px rgba(0,0,0,0.15)' 
      : '0 2px 4px rgba(0,0,0,0.1)',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: hasError
      ? '0 0 12px rgba(244, 67, 54, 0.6)'
      : '0 4px 12px rgba(0,0,0,0.15)',
  },
}));

const EditableNode = ({ data, selected, id }: NodeProps) => {
  const nodeData = data as EditableNodeData;
  
  // Get validation state
  const { hasError } = useNodeValidation(id, nodeData.nodeType, nodeData.label);
  
  const {
    template,
    backgroundColor,
    borderColor,
    label,
    localParams,
    isSpecialNode,
    targetHandle,
    sourceHandles,
  } = useNodeRenderer(nodeData);

  // Check if this is a CustomFunction node
  const isCustomFunction = nodeData.nodeType === 'CustomFunction';
  const mode = nodeData.mode || nodeData.generation_type;
  // Get function name from localParams (preferred) or nodeData
  const functionName = localParams?.function_name || nodeData.params?.function_name || nodeData.function_name || '';

  return (
    <NodeContainer 
      backgroundColor={backgroundColor}
      borderColor={borderColor}
      selected={selected || false}
      hasError={hasError}
    >
      <NodeHandles targetHandle={targetHandle} sourceHandles={sourceHandles} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center', textAlign: 'center' }}>
        <NodeHeader
          isSpecialNode={isSpecialNode}
          label={label}
          displayName={template?.displayName}
          nodeType={nodeData.nodeType}
        />
        
        {/* Show function name for CustomFunction nodes */}
        {isCustomFunction && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Chip 
                label={mode === 'definition' ? 'Definition' : 'Call'} 
                size="small" 
                color={mode === 'definition' ? 'primary' : 'secondary'}
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            </Box>
            {functionName ? (
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'text.primary',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: 'divider',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                {functionName}()
              </Typography>
            ) : (
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.7rem',
                  color: 'text.secondary',
                  fontStyle: 'italic',
                  textAlign: 'center',
                }}
              >
                {mode === 'definition' ? 'Define function' : 'Select function'}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </NodeContainer>
  );
};

export default memo(EditableNode);
