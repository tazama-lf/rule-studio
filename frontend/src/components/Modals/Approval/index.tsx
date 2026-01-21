import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import { Box, Paper } from "@mui/material";
import Grid from '@mui/material/Grid';
import { memo } from "react";
import { Controller } from "react-hook-form";
import Button from "../../Button";
import Input from "../../Input";
import { Text } from "../../Text";
import useApprovalController, { type IApproval } from "./useApprovalController";


const Approval = (props: IApproval) => {

    const { values, functions } = useApprovalController(props)
    const { control, errors, isLoading, header, message, btnTitle, showCommentsField, theme, requiresComment } = values

    return (
        <Grid container spacing={2}>
            <Box width={'100%'}>
                <Text size="body">{header}</Text>
            </Box>
            <Paper
                variant="outlined"
                sx={{
                    width: '100%',
                    borderRadius: 2,
                    p: 1,
                    bgcolor: theme.bgColor,
                    borderColor: theme.borderColor,
                    display: 'flex',
                    gap: 1
                }}
            >
                <WarningRoundedIcon sx={{ color: '#ffba57' }} />
                <Text size="sub" color={theme.textColor}>{message}</Text>
            </Paper>

            {showCommentsField && (
                <Grid container size={12}>
                    <Controller
                        name="comment"
                        control={control}
                        rules={requiresComment ? { required: "Comment is required" } : undefined}
                        render={({ field }) => (
                            <Input
                                maxWidth={'100%'}
                                type='textarea'
                                required={requiresComment}
                                rows={3}
                                label="Comments"
                                {...field}
                                error={errors.comment?.message}
                            />
                        )}
                    />
                </Grid>
            )}
            <Box width={'100%'} gap={2} display={'flex'} justifyContent={'flex-end'}>
                <Button height="35px" text="Cancel" size="sm" onClick={functions.close} type="muted" />
                <Button
                    height="35px"
                    type={theme.buttonType}
                    text={btnTitle}
                    onClick={functions.handleSubmit}
                    size="md"
                    loading={isLoading}
                />
            </Box>
        </Grid>
    )
}


export default memo(Approval);