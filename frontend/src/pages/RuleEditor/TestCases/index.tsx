import { Box, Grid } from "@mui/material";
import Button from "../../../components/Button";
import useTestCasesController, { type ITestCases } from "./useTestCasesController";
import { Text } from "../../../components/Text";

const TestCases = (props: ITestCases) => {

    const { functions } = useTestCasesController(props);

    return (
        <Grid
            container
            py={3}
            height={'60vh'}
        >
            <Box>
                <Grid size={12} >
                    <Text weight={'bold'} color="black" size={'header'}>Generate Test Cases</Text>
                </Grid>
                <Grid size={12} >
                    <Text color="text.ternary" size={'body'}>Add Test Cases Of Your Rule</Text>
                </Grid>
            </Box>
            <Box width={'100%'} display={'flex'} justifyContent={'center'}>
                <Button
                    height="40px"
                    width="220px"
                    type="secondary"
                    size="md"
                    text="Open Test Case Generator"
                    onClick={functions.handleCanvas}
                />
            </Box>
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
