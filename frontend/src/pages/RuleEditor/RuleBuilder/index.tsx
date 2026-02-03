import { Box, Grid } from "@mui/material"
import Button from "../../../components/Button"
import useRuleBuilderController, { type IRuleBuilder } from "./useRuleBuilderController"
import { Text } from "../../../components/Text";

const RuleBuilder = (props: IRuleBuilder) => {

    const { functions } = useRuleBuilderController(props);

    return (
        <Grid
            container
            py={3}
            height={'60vh'}
        >
            <Box>
                <Grid size={12} >
                    <Text weight={'bold'} color="black" size={'header'}>Rule Builder</Text>
                </Grid>
                <Grid size={12} >
                    <Text color="text.ternary" size={'body'}>Create Your Rule</Text>
                </Grid>
            </Box>
            <Box width={'100%'} display={'flex'} justifyContent={'center'}>
                <Button
                    height="40px"
                    width="170px"
                    type="secondary"
                    size="md"
                    text="Open Rule Builder"
                    onClick={functions.handleBuilder}
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

export default RuleBuilder
