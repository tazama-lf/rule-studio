import { Box, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ReactJson from "react-json-view";
import { useCallback } from "react";

interface IFormattedJsonSection {
    value: string,
    onChange?: (value: string) => void
}

const FormattedJsonSection = ({ value, onChange }: IFormattedJsonSection) => {

    const safeJsonParse = useCallback((
        jsonString: string,
    ): { success: boolean; data?: unknown } => {
        try {
            const parsed = JSON.parse(jsonString || '{}');
            return { success: true, data: parsed };
        } catch {
            return { success: false };
        }
    }, [])

    const parseResult = safeJsonParse(value);

    if (parseResult.success && parseResult.data) {
        return (
            <Box sx={{ fontSize: 13 }}>
                <ReactJson
                    src={parseResult.data}
                    onEdit={onChange ? (e) =>
                        onChange(JSON.stringify(e.updated_src, null, 2)) : undefined
                    }
                    onAdd={onChange ? (e) =>
                        onChange(JSON.stringify(e.updated_src, null, 2)) : undefined
                    }
                    onDelete={onChange ? (e) =>
                        onChange(JSON.stringify(e.updated_src, null, 2)) : undefined
                    }
                    theme="rjv-default"
                    name={false}
                    displayDataTypes={false}
                    displayObjectSize
                    enableClipboard={false}
                    collapsed={false}
                />
            </Box>
        );
    }

    return (
        <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="100%"
            color="text.secondary"
            textAlign="center"
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
                    Enter valid JSON to see preview
                </Typography>
            </Box>
        </Box>
    );
};

export default FormattedJsonSection;
