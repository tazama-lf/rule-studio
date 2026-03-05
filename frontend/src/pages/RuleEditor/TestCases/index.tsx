import { Box, Grid, Paper, CircularProgress } from "@mui/material";
import Button from "../../../components/Button";
import useTestCasesController, { type ITestCases } from "./useTestCasesController";
import { Text } from "../../../components/Text";

const TestCases = (props: ITestCases) => {

    const { values, functions } = useTestCasesController(props);
    const { statusConfig, isLoadingFlow } = values;

    return (
        <Grid
            container
            py={3}
            height={'60vh'}
        >
            <Box width={'100%'}>
                <Grid size={12} mb={1}>
                    <Text weight={'bold'} color="black" size={'header'}>Generate Test Cases</Text>
                </Grid>
                <Grid size={12} mb={3}>
                    <Text color="text.ternary" size={'body'}>Create and manage your test cases</Text>
                </Grid>
            </Box>
            
            {isLoadingFlow ? (
                <Box width={'100%'} display={'flex'} justifyContent={'center'} alignItems={'center'} flex={1}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box width={'100%'} display={'flex'} justifyContent={'center'} alignItems={'center'} flex={1}>
                    <Paper
                        elevation={0}
                        sx={{
                            backgroundColor: statusConfig.bgColor,
                            border: `2px solid ${statusConfig.color}`,
                            borderRadius: '12px',
                            padding: '32px',
                            maxWidth: '600px',
                            width: '100%',
                            textAlign: 'center'
                        }}
                    >
                        <Box fontSize={'48px'} mb={2}>
                            {statusConfig.icon}
                        </Box>
                        <Text 
                            weight={'bold'} 
                            size={'subHeader'} 
                            sx={{ color: statusConfig.color, mb: 2 }}
                        >
                            {statusConfig.title}
                        </Text>
                        <Text 
                            color="text.secondary" 
                            size={'body'}
                            sx={{ mb: 3, display: 'block' }}
                        >
                            {statusConfig.description}
                        </Text>
                        <Button
                            height="44px"
                            width="220px"
                            type="secondary"
                            size="md"
                            text={statusConfig.buttonText}
                            onClick={functions.handleCanvas}
                        />
                    </Paper>
                </Box>
            )}
            <Box width={'100%'} display={'flex'} justifyContent={'space-between'} alignSelf={'flex-end'}>
                <Button
                    height="40px"
                    width="170px"
                    type="secondary"
                    size="md"
                    text="Back"
                    onClick={functions.handleBack}
                />
                <Button
                    height="40px"
                    width="170px"
                    type="secondary"
                    size="md"
                    text="Next"
                    onClick={functions.handleNext}
                />
            </Box>
        </Grid>
    )
}

export default TestCases
