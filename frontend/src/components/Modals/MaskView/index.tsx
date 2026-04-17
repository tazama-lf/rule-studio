import { Box, CircularProgress, Divider } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useEffect } from "react";
import { useLazyGetMaskByIdQuery } from "../../../redux/Api/Masking";
import { dateFormatter } from "../../../utils/Common/helpers";
import StatusCard from "../../Cards/StatusCard";
import { Text } from "../../Text";

interface MaskViewProps {
    id: number;
}

interface FieldProps {
    label: string;
    value: React.ReactNode;
}

const Field = ({ label, value }: FieldProps) => (
    <Box>
        <Text size="sub" color="#6b7280" fontWeight={500} sx={{ letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.72rem' }}>
            {label}
        </Text>
        <Box mt={0.75}>
            {typeof value === "string" || typeof value === "number" ? (
                <Text size="body" fontWeight={600} color="#111827">
                    {value}
                </Text>
            ) : (
                value
            )}
        </Box>
    </Box>
);

const MaskView = ({ id }: MaskViewProps) => {
    const [fetchMask, { data, isLoading, isError }] = useLazyGetMaskByIdQuery();

    useEffect(() => {
        void fetchMask({ id });
    }, [fetchMask, id]);

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" py={6}>
                <CircularProgress size={32} />
            </Box>
        );
    }

    if (isError || !data) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" py={6}>
                <Text color="error.main" size="body">
                    Failed to load masking configuration.
                </Text>
            </Box>
        );
    }

    const mask = data as {
        id: number;
        txtp: string;
        txtp_version: string;
        status: string;
        fields_masked: number;
        total_fields: number;
        comments?: string;
        created_at: string;
        updated_at: string;
        tenant_id: string;
    };

    const fieldsMaskedLabel =
        mask.fields_masked != null && mask.total_fields != null
            ? `${mask.fields_masked} of ${mask.total_fields}`
            : "—";

    return (
        <Box px={3} pb={3} pt={1}>
            {/* Subtitle */}
            <Text size="main" color="#1e293b" fontWeight={600} sx={{ letterSpacing: '0.01em' }}>
                Configuration Details
            </Text>

            <Divider sx={{ my: 2.5 }} />

            {/* Field grid */}
            <Grid container rowSpacing={3} columnSpacing={4}>
                <Grid size={6}>
                    <Field label="Transaction Type" value={mask.txtp} />
                </Grid>
                <Grid size={6}>
                    <Field label="Fields Masked" value={fieldsMaskedLabel} />
                </Grid>

                <Grid size={6}>
                    <Field label="Version" value={`v${mask.txtp_version}`} />
                </Grid>
                <Grid size={6}>
                    <Field
                        label="Status"
                        value={<StatusCard status={mask.status} />}
                    />
                </Grid>

                <Grid size={6}>
                    <Field
                        label="Created At"
                        value={dateFormatter(mask.created_at) ?? "—"}
                    />
                </Grid>
                <Grid size={6}>
                    <Field
                        label="Last Updated"
                        value={dateFormatter(mask.updated_at) ?? "—"}
                    />
                </Grid>

                {mask.comments && (
                    <Grid size={12}>
                        <Box
                            sx={{
                                bgcolor: "#f8f9fb",
                                borderRadius: 2,
                                px: 2,
                                py: 1.5,
                                border: "1px solid",
                                borderColor: "divider",
                            }}
                        >
                            <Text size="sub" color="#6b7280" fontWeight={500} sx={{ letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                                Comments
                            </Text>
                            <Box mt={0.75}>
                                <Text size="body" color="#111827" fontWeight={400}>
                                    {mask.comments}
                                </Text>
                            </Box>
                        </Box>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default MaskView;
