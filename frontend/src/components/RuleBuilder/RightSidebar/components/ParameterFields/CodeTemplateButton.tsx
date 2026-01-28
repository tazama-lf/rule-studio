import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import type { NodeInput } from '../../../../../types/nodeInput';
import { PropertyRow } from '../../styles';

interface CodeTemplateButtonProps {
  input: NodeInput;
  currentValue: string;
  hasError: boolean;
  fieldError: string | undefined;
  isDisabled: boolean;
  onOpenCodeModal: (key: string, label: string, value: string) => void;
}

const CodeTemplateButton: React.FC<CodeTemplateButtonProps> = ({
  input,
  currentValue,
  hasError,
  fieldError,
  isDisabled,
  onOpenCodeModal,
}) => {
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
          onClick={() => onOpenCodeModal(input.key, input.label, currentValue)}
          disabled={isDisabled}
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
};

export default React.memo(CodeTemplateButton);
