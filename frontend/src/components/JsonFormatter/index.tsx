import { Box, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ReactJson from "@microlink/react-json-view";
import { useCallback } from "react";
import Grid from "@mui/material/Grid";

interface IFormattedJsonSection {
    value: string,
    onChange?: (value: string) => void,
    label?: string
}

const FormattedJsonSection = ({ value, onChange, label }: IFormattedJsonSection) => {

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
            <Grid size={{ xs: 12, md: 12 }} mt={0.4} overflow={'auto'} >
                <Box>
                    {label && (
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            {label} :
                        </Typography>
                    )}
                </Box>
                <Box sx={{ fontSize: 13, overflow: 'auto' }} border={1} p={2} borderColor={'static.border'} borderRadius={1} height={310}>
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
            </Grid>
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
