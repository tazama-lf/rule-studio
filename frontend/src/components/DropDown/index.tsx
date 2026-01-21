import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
    FormControl,
    FormHelperText,
    IconButton,
    InputBase,
    InputLabel,
    List,
    ListItemButton,
    ListItemText,
    OutlinedInput,
    Typography
} from "@mui/material";
import { memo, useEffect, useRef, useState } from "react";
import type { FieldError, FieldErrorsImpl, Merge } from "react-hook-form";
import useDebouncedSearch from "../../hooks/useDebouncedSearch";
import * as S from './DropDown.styles';

export interface DropdownOption {
    label: string;
    value: string | number | null;
}

interface DropdownProps {
    label?: string;
    placeholder?: string;
    options?: DropdownOption[];
    value: DropdownOption | DropdownOption[] | null;
    onChange?: (value: DropdownOption | DropdownOption[] | null) => void;
    onClick?: () => void;
    multiple?: boolean;
    required?: boolean;
    error?: string | FieldError | Merge<FieldError, FieldErrorsImpl<Record<string, unknown>>>;
    view_only?: boolean;
    disabled?: boolean;
    searchable?: boolean;
    cancelable?: boolean;
    maxWidth?: string | number;
    height?: 'md' | 'sm';
}


const heightMap = {
    md: 50,
    sm: 45,
};

const Dropdown = ({
    label = "Select",
    placeholder = "Choose...",
    options,
    value,
    onChange,
    multiple = false,
    required = false,
    error,
    view_only = false,
    disabled = false,
    searchable = false,
    cancelable = false,
    maxWidth,
    onClick,
    height = 'md'
}: DropdownProps) => {
    const [open, setOpen] = useState(false);
    const [search, debouncedSearch, setSearch] = useDebouncedSearch();
    const ref = useRef<HTMLDivElement | null>(null);

    const isSelected = (opt: DropdownOption) =>
        multiple
            ? Array.isArray(value) && value.some(v => v.value === opt.value)
            : !Array.isArray(value) && value?.value === opt.value;

    const toggleOption = (opt: DropdownOption) => {
        if (disabled) return;

        if (multiple) {
            const current = Array.isArray(value) ? value : [];
            const exists = current.some(v => v.value === opt.value);
            if (onChange) {
                onChange(
                    exists
                        ? current.filter(v => v.value !== opt.value)
                        : [...current, opt]
                );
            }
        } else {
            if (onChange) onChange(opt);
            setOpen(false);
        }
    };

    const filteredOptions = options?.filter(opt =>
        searchable
            ? opt.label.toLowerCase().includes(debouncedSearch.toLowerCase())
            : true
    );

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <FormControl
            fullWidth
            error={!!error}
            disabled={disabled}
            required={required}
            sx={{ maxWidth, mt: 0.5 }}
            ref={ref}
        >
            <InputLabel shrink sx={{ bgcolor: 'white', color: 'text.black' }}>{label}</InputLabel>

            {view_only ? (
                <Typography variant="body2" >
                    {multiple
                        ? Array.isArray(value) && value.length
                            ? value.map(v => v.label).join(", ")
                            : "-"
                        : !Array.isArray(value)
                            ? value?.label ?? "-"
                            : "-"}
                </Typography>
            ) : (
                <>
                    <OutlinedInput
                        readOnly
                        value=""
                        sx={(theme) => ({ height: heightMap[height], display: 'flex', justifyContent: 'space-between', border: 1, borderColor: theme.palette.static.grey })}
                        onClick={() => !disabled && onClick ? onClick() : !disabled && setOpen(p => !p)}
                        endAdornment={
                            <>
                                {cancelable &&
                                    ((multiple && Array.isArray(value) && value.length > 0) ||
                                        (!multiple && value)) && (
                                        <IconButton
                                            size="small"
                                            onClick={e => {
                                                e.stopPropagation();
                                                if (onChange) onChange(multiple ? [] : null);
                                            }}
                                        >
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                <KeyboardArrowDownIcon />
                            </>
                        }
                        inputComponent={() => (
                            <S.ValueContainer>
                                {multiple ? (
                                    Array.isArray(value) && value.length ? (
                                        value.map(v => <S.Tag key={v.value}>{v.label}</S.Tag>)
                                    ) : (
                                        <Typography variant="body2" color="text.black" >
                                            {placeholder}
                                        </Typography>
                                    )
                                ) : !Array.isArray(value) && value ? (
                                    <Typography px={2} variant="body2" color="text.black">{value.label}</Typography>
                                ) : (
                                    <Typography variant="body2" color="text.black" px={2}>
                                        {placeholder}
                                    </Typography>
                                )}
                            </S.ValueContainer>
                        )}
                    />

                    {open && (
                        <S.DropdownMenu variant="outlined">
                            {searchable && (
                                <S.SearchBox>
                                    <InputBase
                                        fullWidth
                                        placeholder="Search..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        onClick={e => e.stopPropagation()}
                                    />
                                </S.SearchBox>
                            )}

                            <List dense>
                                {filteredOptions?.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" px={2} py={0.5}>
                                        No options found
                                    </Typography>
                                ) : (
                                    filteredOptions?.map(opt => (
                                        <ListItemButton
                                            key={opt.value}
                                            selected={isSelected(opt)}
                                            onClick={e => {
                                                e.stopPropagation();
                                                toggleOption(opt);
                                            }}
                                        >
                                            <ListItemText primary={opt.label} />
                                        </ListItemButton>
                                    ))
                                )}
                            </List>
                        </S.DropdownMenu>
                    )}
                </>
            )}

            {error && (
                <FormHelperText>{error.toString()}</FormHelperText>
            )}
        </FormControl>
    );
};

export default memo(Dropdown);
