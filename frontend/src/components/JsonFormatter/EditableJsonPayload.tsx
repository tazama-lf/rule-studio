import { Box, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ReactJson from "@microlink/react-json-view";
import { useCallback } from "react";
import Grid from "@mui/material/Grid";

interface IEditableJsonPayload {
    value: string;
    onChange?: (value: string) => void;
    label?: string;
    error?: string;
}

const EditableJsonPayload = ({ value, onChange, label, error }: IEditableJsonPayload) => {

    const safeJsonParse = useCallback((
        jsonString: string,
    ): { success: boolean; data?: unknown } => {
        try {
            const parsed = JSON.parse(jsonString || '{}');
            return { success: true, data: parsed };
        } catch {
            return { success: false };
        }
    }, []);

    const validateEdit = useCallback((edit: any) => {
        if (edit.existing_value !== undefined) {
            if (onChange) {
                onChange(JSON.stringify(edit.updated_src, null, 2));
            }
            return true;
        }
        return false;
    }, [onChange]);

    const parseResult = safeJsonParse(value);

    if (parseResult.success && parseResult.data) {
        return (
            <Grid size={{ xs: 12, md: 12 }} mt={0.4} overflow={'auto'}>
                <Box>
                    {label && (
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            {label}
                        </Typography>
                    )}
                </Box>
                <Box 
                    sx={{ fontSize: 13 }} 
                    border={1} 
                    p={2} 
                    borderColor={error ? 'error.main' : 'static.border'} 
                    borderRadius={1} 
                    height={310}
                    overflow={'auto'}
                >
                    <ReactJson
                        src={parseResult.data}
                        onEdit={onChange ? validateEdit : undefined}
                        onAdd={false} 
                        onDelete={false}
                        theme="rjv-default"
                        name={false}
                        displayDataTypes={false}
                        displayObjectSize
                        enableClipboard={true}
                        collapsed={false}
                        indentWidth={2}
                        iconStyle="triangle"
                        quotesOnKeys={false}
                    />
                </Box>
                {error && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        {error}
                    </Typography>
                )}
            </Grid>
        );
    }

    return (
        <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height={310}
            color="text.secondary"
            textAlign="center"
            border={1}
            borderColor={error ? 'error.main' : 'static.border'}
            borderRadius={1}
            p={2}
        >
            <Box>
                <ErrorOutlineIcon
                    color="disabled"
                    sx={{ fontSize: 48, mb: 1 }}
                />

                <Typography variant="body2">
                    Invalid JSON format
                </Typography>

                <Typography variant="caption" display="block" mt={0.5}>
                    {error || 'Enter valid JSON to see preview'}
                </Typography>
            </Box>
        </Box>
    );
};

export default EditableJsonPayload;
