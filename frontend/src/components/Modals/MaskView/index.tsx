import { Box, CircularProgress, Divider, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import Grid from "@mui/material/Grid";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import CancelIcon from "@mui/icons-material/Cancel";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLazyGetMaskByIdQuery, useReviewMaskMutation } from "../../../redux/Api/Masking";
import { dateFormatter } from "../../../utils/Common/helpers";
import { extractData } from "../../../utils/Common/storage";
import { claims } from "../../../utils/Constants/data";
import { useModal } from "../../../contexts/ModalContext";
import StatusCard from "../../Cards/StatusCard";
import { Text } from "../../Text";
import Button from "../../Button";

interface MaskViewProps {
    id: number;
    onSuccess?: () => void;
}

interface FieldProps {
    label: string;
    value: React.ReactNode;
}

type ReviewAction = 'approve' | 'reject';

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

const MaskView = ({ id, onSuccess }: MaskViewProps) => {
    const [fetchMask, { data, isLoading, isError }] = useLazyGetMaskByIdQuery();
    const [reviewMask, { isLoading: isReviewing }] = useReviewMaskMutation();
    const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);
    const [comment, setComment] = useState<string>('');
    const [commentError, setCommentError] = useState<string>('');
    const { close } = useModal();

    const user = extractData('user');
    const isApprover = user?.claims === claims.data_engineer_approver;

    useEffect(() => {
        void fetchMask({ id });
    }, [fetchMask, id]);

    const handleOpenConfirm = (action: ReviewAction) => {
        setReviewAction(action);
        setComment('');
        setCommentError('');
    };

    const handleCloseConfirm = () => {
        setReviewAction(null);
        setComment('');
        setCommentError('');
    };

    const handleConfirm = async () => {
        if (reviewAction === 'reject' && !comment.trim()) {
            setCommentError('A comment is required when rejecting.');
            return;
        }
        try {
            await reviewMask({
                id,
                body: {
                    action: reviewAction!,
                    ...(comment.trim() ? { comments: comment.trim() } : {}),
                },
            }).unwrap();
            toast.success(reviewAction === 'approve' ? 'Configuration approved successfully.' : 'Configuration rejected.');
            handleCloseConfirm();
            close();
            onSuccess?.();
        } catch {
            toast.error('Failed to submit review. Please try again.');
        }
    };

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
                    Failed to load tokenization configuration.
                </Text>
            </Box>
        );
    }

    const mask = data as {
        id: number;
        txtp: string;
        txtp_version: string;
        tokenize?: Record<string, unknown>;
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
            : "â€”";

    const canReview = isApprover && mask.status === 'STATUS_03_UNDER_REVIEW';

    return (
        <>
            <Box px={3} pb={3} pt={1}>
                <Text size="main" color="#1e293b" fontWeight={600} sx={{ letterSpacing: '0.01em' }}>
                    Configuration Details
                </Text>

                <Divider sx={{ my: 2.5 }} />

                {/* Field grid */}
                <Grid container rowSpacing={3} columnSpacing={4}>
                    <Grid size={6}>
                        <Field label="Message Type" value={mask.txtp} />
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
                            value={dateFormatter(mask.created_at) ?? "-"}
                        />
                    </Grid>
                    <Grid size={6}>
                        <Field
                            label="Last Updated"
                            value={dateFormatter(mask.updated_at) ?? "-"}
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

                    {mask.tokenize && Object.keys(mask.tokenize).length > 0 && (
                        <Grid size={12}>
                            <Box
                                sx={{
                                    bgcolor: "#f8f9fb",
                                    borderRadius: 2,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    overflow: "hidden",
                                }}
                            >
                                <Box
                                    sx={{
                                        px: 2,
                                        py: 1.25,
                                        borderBottom: "1px solid",
                                        borderColor: "divider",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        bgcolor: "#f1f5f9",
                                    }}
                                >
                                    <Text size="sub" color="#374151" fontWeight={600} sx={{ letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                                        Tokenized Fields
                                    </Text>
                                    <Box display="flex" gap={1}>
                                        <Chip
                                            icon={<CheckCircleIcon sx={{ fontSize: '0.85rem !important', color: '#16a34a !important' }} />}
                                            label={`${Object.values(mask.tokenize).filter(Boolean).length} tokenized`}
                                            size="small"
                                            sx={{ fontSize: '0.7rem', height: 20, bgcolor: '#dcfce7', color: '#15803d', fontWeight: 600, '& .MuiChip-icon': { ml: '6px' } }}
                                        />
                                        <Chip
                                            icon={<RemoveCircleOutlineIcon sx={{ fontSize: '0.85rem !important', color: '#9ca3af !important' }} />}
                                            label={`${Object.values(mask.tokenize).filter(v => !v).length} not tokenized`}
                                            size="small"
                                            sx={{ fontSize: '0.7rem', height: 20, bgcolor: '#f3f4f6', color: '#6b7280', fontWeight: 600, '& .MuiChip-icon': { ml: '6px' } }}
                                        />
                                    </Box>
                                </Box>

                                {/* Rows */}
                                <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
                                    {Object.entries(mask.tokenize).map(([field, isTokenized], index, arr) => (
                                        <Box
                                            key={field}
                                            sx={{
                                                px: 2,
                                                py: 1,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: 2,
                                                borderBottom: index < arr.length - 1 ? "1px solid" : "none",
                                                borderColor: "divider",
                                                bgcolor: isTokenized ? "rgba(220,252,231,0.25)" : "transparent",
                                                transition: "background-color 0.15s",
                                                '&:hover': { bgcolor: isTokenized ? "rgba(220,252,231,0.5)" : "rgba(243,244,246,0.8)" },
                                            }}
                                        >
                                            <Text
                                                size="body"
                                                color="#374151"
                                                fontWeight={isTokenized ? 600 : 400}
                                                sx={{ fontFamily: 'monospace', fontSize: '0.78rem', wordBreak: 'break-all', flex: 1 }}
                                            >
                                                {field}
                                            </Text>
                                            <Box flexShrink={0}>
                                                {isTokenized ? (
                                                    <Box display="flex" alignItems="center" gap={0.5}>
                                                        <CheckCircleIcon sx={{ fontSize: '1rem', color: '#16a34a' }} />
                                                        <Text size="sub" color="#15803d" fontWeight={600} sx={{ fontSize: '0.72rem' }}>
                                                            Tokenized
                                                        </Text>
                                                    </Box>
                                                ) : (
                                                    <Box display="flex" alignItems="center" gap={0.5}>
                                                        <RemoveCircleOutlineIcon sx={{ fontSize: '1rem', color: '#9ca3af' }} />
                                                        <Text size="sub" color="#9ca3af" fontWeight={500} sx={{ fontSize: '0.72rem' }}>
                                                            Not Tokenized
                                                        </Text>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Grid>
                    )}
                </Grid>

                {/* Approver action buttons â€” fixed at bottom of view */}
                {canReview && (
                    <>
                        <Divider sx={{ mt: 3, mb: 2 }} />
                        <Box display="flex" justifyContent="flex-end" gap={1.5}>
                            <Button
                                height="36px"
                                size="sm"
                                type="danger"
                                text="Reject"
                                Icon={CancelIcon}
                                onClick={() => handleOpenConfirm('reject')}
                            />
                            <Button
                                height="36px"
                                size="sm"
                                type="primary"
                                text="Approve"
                                Icon={CheckCircleIcon}
                                onClick={() => handleOpenConfirm('approve')}
                            />
                        </Box>
                    </>
                )}
            </Box>

            {/* â”€â”€ Confirmation Dialog (renders in portal, stacks above the view modal) â”€â”€ */}
            <Dialog
                open={reviewAction !== null}
                onClose={handleCloseConfirm}
                maxWidth="xs"
                fullWidth
                sx={{ zIndex: 1400 }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Text size="main" color="#1e293b" fontWeight={600}>
                        {reviewAction === 'approve' ? 'Approve Configuration' : 'Reject Configuration'}
                    </Text>
                </DialogTitle>

                <DialogContent sx={{ pt: '8px !important' }}>
                    {/* Warning banner */}
                    <Box
                        display="flex"
                        alignItems="flex-start"
                        gap={1}
                        mb={2.5}
                        sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            bgcolor: reviewAction === 'approve' ? '#f0fdf4' : '#fef2f2',
                            border: '1px solid',
                            borderColor: reviewAction === 'approve' ? '#bbf7d0' : '#fecaca',
                        }}
                    >
                        <WarningRoundedIcon sx={{ color: '#ffba57', mt: '1px', flexShrink: 0, fontSize: '1.2rem' }} />
                        <Text size="sub" color={reviewAction === 'approve' ? '#166534' : '#991b1b'}>
                            {reviewAction === 'approve'
                                ? 'This will approve the configuration and move it to Approved status.'
                                : 'This will reject the configuration and return it to the editor for revision.'}
                        </Text>
                    </Box>

                    {/* Comment field */}
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        size="small"
                        label={reviewAction === 'reject' ? 'Comment (required)' : 'Comment (optional)'}
                        required={reviewAction === 'reject'}
                        value={comment}
                        onChange={(e) => {
                            setComment(e.target.value);
                            if (commentError) setCommentError('');
                        }}
                        error={!!commentError}
                        helperText={commentError}
                        placeholder={reviewAction === 'reject' ? 'Please provide a reason for rejection...' : 'Add an optional comment...'}
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button
                        height="36px"
                        size="sm"
                        type="muted"
                        text="Cancel"
                        onClick={handleCloseConfirm}
                    />
                    <Button
                        height="36px"
                        size="sm"
                        width="auto"
                        type={reviewAction === 'approve' ? 'primary' : 'danger'}
                        text={reviewAction === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
                        loading={isReviewing}
                        onClick={() => void handleConfirm()}
                    />
                </DialogActions>
            </Dialog>
        </>
    );
};

export default MaskView;
