import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
    Paper,
    Stack,
    Typography
} from "@mui/material";
import { Text } from "../../Text";



const CommentCard = ({
    success,
    message
}: {
    success: boolean;
    message: string
}) => {

    const isPassed = success ?? false;

    return (
        <Paper
            variant="outlined"
            sx={{
                width: '100%',
                borderRadius: 2,
                p: 2,
                bgcolor: isPassed ? '#f0fdf4' : '#fef2f2',
                borderColor: isPassed ? "success.main" : "error.main",
            }}
        >
            <Stack direction="row" alignItems="center" spacing={1}>
                {isPassed ? (
                    <CheckCircleIcon color="success" />
                ) : (
                    <CancelIcon color="error" />
                )}

                <Typography
                    fontWeight={500}
                    color={isPassed ? "success.dark" : "error.dark"}
                >
                    {isPassed ? "Rule Approved" : "Rule Rejected"}
                </Typography>
            </Stack>

            <Text mt={1} color="text.ternary" size={'sub'}>{message}</Text>
        </Paper>
    );
};

export default CommentCard;
