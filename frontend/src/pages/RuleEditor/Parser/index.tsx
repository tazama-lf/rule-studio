import { Box } from "@mui/material";
import Grid from "@mui/material/Grid";
import Button from "../../../components/Button";
import FormattedJsonSection from "../../../components/JsonFormatter";
import { Text } from "../../../components/Text";
import Section from "../../../components/Wrappers/Section";
import useParserController, { type IParseProps } from "./useParserController";

const Parser = (props: IParseProps) => {

    const { values, functions } = useParserController(props)

    return (
        <Grid
            container
            py={3}
        >
            <Grid size={12} >
                <Text weight={'bold'} color="black" size={'header'}>Rule Request</Text>
            </Grid>
            <Grid size={12} >
                <Text color="text.ternary" size={'body'}>View generated Rule Request from selected TxTp</Text>
            </Grid>

            <Section header={'Rule Request Definition'} subHeader={'Generated Rule Request which includes Meta Data, Data Cache, Network Map & Transaction payload'}>
                {values?.payload &&
                    <FormattedJsonSection label="Transaction Payload" value={values?.payload} />
                }
                {values?.ruleRequest &&
                    <FormattedJsonSection label="RuleRequest" value={JSON.stringify(values?.ruleRequest)} />
                }
            </Section>

            <Box mt={2} width={'100%'} display={'flex'} justifyContent={'space-between'}>
                <Button height="40px" type="secondary" size="md" text="Back" onClick={functions.handlePrevious} />
                <Button height="40px" type="secondary" size="md" text="Next" onClick={functions.handleNext} />
            </Box>
        </Grid >
    )
}

export default Parser;
