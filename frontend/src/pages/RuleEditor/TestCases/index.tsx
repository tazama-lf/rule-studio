import { Grid } from "@mui/material";
import Button from "../../../components/Button";
import useTestCasesController from "./useTestCasesController";

const TestCases = () => {

    const { functions } = useTestCasesController();

    return (
        <Grid
            container
            py={3}
            display={'flex'}
            justifyContent={'center'}
            gap={2}
        >
            <Button
                height="40px"
                width="170px"
                type="secondary"
                size="md"
                text="Next"
                onClick={functions.handleNext}
            />
        </Grid>
    )
}

export default TestCases
