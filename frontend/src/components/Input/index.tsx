import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import {
    IconButton,
    InputAdornment,
    TextField,
    styled
} from '@mui/material';
import { forwardRef, memo, useState, type ForwardedRef } from 'react';
import InputWrapper from '../Wrappers/InputWrapper';

export interface InputProps {
    label?: string;
    placeholder?: string;
    value?: string | null;
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    type?: 'text' | 'password' | 'textarea' | 'date' | 'time';
    icon?: React.ElementType;
    success?: boolean;
    rows?: number;
    error?: string;
    onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    name?: string;
    maxLength?: number;
    disabled?: boolean;
    required?: boolean;
    view_only?: boolean;
    leftIcon?: React.ElementType;
    height?: 'md' | 'sm';
    maxWidth?: string | number
}

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiInputBase-input': {
        boxShadow: 'none',
        boxSizing: 'border-box',
    },
    '& .MuiOutlinedInput-notchedOutline': {
        boxShadow: 'none',
        borderColor: theme.palette.static.border
    },
    '& .MuiInputBase-input.Mui-disabled': {
        color: theme.palette.text.black,
        WebkitTextFillColor: theme.palette.text.primary,
        opacity: 1,
        backgroundColor: 'white'
    },
    '& .MuiInputBase-input::placeholder': {
        color: theme.palette.text.ternary,
    },
    '& .MuiInputLabel-root': {
        color: theme.palette.text.black,
        boxShadow: 'none',
    },
}));

const heightMap = {
    md: 50,
    sm: 45,
};

const Input = forwardRef(function Input(
    {
        label,
        placeholder,
        value,
        onChange,
        type = 'text',
        rows = 4,
        onBlur,
        name,
        maxLength,
        disabled = false,
        leftIcon: LeftIcon,
        error,
        height = 'md',
        maxWidth,
        view_only = false
    }: InputProps,
    ref: ForwardedRef<HTMLInputElement | HTMLTextAreaElement>
) {
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const isTextarea = type === 'textarea';
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
        <InputWrapper {...{ label, placeholder, value, onChange, type, disabled, error, maxWidth, view_only }}>
            <StyledTextField
                inputRef={ref}
                multiline={isTextarea}
                rows={rows}
                placeholder={placeholder ?? (label ? `Enter ${label}` : '')}
                value={value}
                onChange={onChange}
                error={!!error}
                onBlur={onBlur}
                required
                label={label}
                variant='outlined'
                fullWidth
                id="outlined-required"
                name={name}
                disabled={disabled}
                type={inputType}
                inputProps={{ maxLength }}
                sx={{
                    '& .MuiInputBase-root': {
                        maxHeight: isTextarea ? undefined : heightMap[height],
                        height: isTextarea ? undefined : heightMap[height],
                    },
                }}
                slotProps={{
                    input: {
                        endAdornment: isPassword ? (
                            <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    edge="end"
                                    disabled={disabled}
                                    onClick={() =>
                                        !disabled && setShowPassword((prev) => !prev)
                                    }
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    {showPassword ? (
                                        <VisibilityIcon fontSize="small" />
                                    ) : (
                                        <VisibilityOffIcon fontSize="small" />
                                    )}
                                </IconButton>
                            </InputAdornment>
                        ) : undefined,
                        startAdornment: LeftIcon ? (
                            <InputAdornment position="start">
                                <LeftIcon fontSize="small" />
                            </InputAdornment>
                        ) : <div></div>,
                    },
                }}
            />
        </InputWrapper>
    );
});

export default memo(Input);
