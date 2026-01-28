import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
    Box,
    Grid,
    Paper,
    Stack,
    Typography
} from "@mui/material";
import type { IResult } from "../../../utils/Common/types";
import FormattedJsonSection from "../../JsonFormatter";
import { Text } from "../../Text";



const resultCard = ({
    result,
}: {
    result: IResult;
}) => {

    const isPassed = result.success ?? false;

    return (
        <Paper
            variant="outlined"
            sx={{
                width: '100%',
                borderRadius: 2,
                p: 2,
                bgcolor: 'transparent',
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
                    {isPassed ? "Simulation Passed" : "Simulation Failed"}
                </Typography>
            </Stack>

            <Text mt={1} color="text.ternary" size={'sub'}>{result.message}</Text>

            {(result.validationErrors?.length || 0) > 0 && (
                <Box mt={2}>
                    <Typography
                        fontSize={14}
                        fontWeight={500}
                        color="error.dark"
                        mb={1}
                    >
                        Errors:
                    </Typography>

                    <Stack spacing={1}>
                        {result.validationErrors?.map((error, index) => (
                            <Box
                                key={index}
                                sx={{
                                    borderRadius: 1,
                                }}
                            >
                                <Typography fontSize={13} color="error.main">
                                    {error}
                                </Typography>

                            </Box>
                        ))}
                    </Stack>
                </Box>
            )}

            {isPassed && result.ruleRequest ?
                <Grid border={1} borderColor={'static.border'} mt={0.4} p={2} overflow={'auto'} borderRadius={1} height={310}>
                    <FormattedJsonSection value={JSON.stringify(result.ruleRequest)} />
                </Grid> :
                null}
        </Paper>
    );
};

export default resultCard;
