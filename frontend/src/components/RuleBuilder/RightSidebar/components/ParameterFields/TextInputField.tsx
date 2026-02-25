import React, { useCallback } from 'react';
import { TextField, Typography } from '@mui/material';
import type { NodeInput } from '../../../../../types/nodeInput';
import { PropertyRow } from '../../styles';
import { withCursorPreservation } from '../../../../../utils/cursorPreservation';

interface TextInputFieldProps {
  input: NodeInput;
  currentValue: string;
  hasError: boolean;
  helperText: string;
  isDisabled: boolean;
  hasGlobalVariable: boolean;
  isMultiline: boolean;
  minRows: number;
  onParamChange: (paramKey: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onParamBlur?: () => void;
  onDrop: (paramKey: string) => (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onInputRef?: (key: string, el: HTMLInputElement | HTMLTextAreaElement | null) => void;
}

const TextInputField: React.FC<TextInputFieldProps> = ({
  input,
  currentValue,
  hasError,
  helperText,
  isDisabled,
  hasGlobalVariable,
  isMultiline,
  minRows,
  onParamChange,
  onParamBlur,
  onDrop,
  onDragOver,
  onInputRef,
}) => {
  const handleInputRef = useCallback((el: HTMLInputElement | HTMLTextAreaElement | null) => {
    if (onInputRef) {
      onInputRef(input.key, el);
    }
  }, [input.key, onInputRef]);

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
        onChange={withCursorPreservation(onParamChange(input.key))}
        onBlur={onParamBlur}
        size="small"
        variant="outlined"
        multiline={isMultiline}
        minRows={minRows}
        maxRows={30}
        error={hasError}
        helperText={helperText}
        disabled={isDisabled}
        inputRef={handleInputRef}
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
};

export default React.memo(TextInputField);
