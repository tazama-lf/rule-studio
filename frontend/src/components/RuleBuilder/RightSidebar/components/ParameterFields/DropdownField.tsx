import React from 'react';
import { Select, MenuItem, FormControl, InputLabel, FormHelperText, Typography } from '@mui/material';
import type { NodeInput } from '../../../../../utils/Templates/customFuncTemplate';
import { PropertyRow } from '../../styles';

interface DropdownFieldProps {
  input: NodeInput;
  currentValue: string;
  hasError: boolean;
  helperText: string;
  options: Array<{ value: string; label: string }>;
  isDisabled: boolean;
  onParamChange: (paramKey: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const DropdownField: React.FC<DropdownFieldProps> = ({
  input,
  currentValue,
  hasError,
  helperText,
  options,
  isDisabled,
  onParamChange,
}) => {
  return (
    <PropertyRow key={input.key}>
      <FormControl fullWidth size="small" error={hasError} disabled={isDisabled}>
        <InputLabel>
          {input.label}
          {input.required && <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>*</Typography>}
        </InputLabel>
        <Select
          value={currentValue !== undefined && currentValue !== '' ? currentValue : (input.defaultValue || options[0].value)}
          onChange={(e) => {
            const syntheticEvent = {
              target: { value: e.target.value as string }
            } as React.ChangeEvent<HTMLInputElement>;
            onParamChange(input.key)(syntheticEvent);
          }}
          label={input.label}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    </PropertyRow>
  );
};

export default React.memo(DropdownField);
