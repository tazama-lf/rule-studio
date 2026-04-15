import { Box } from "@mui/material";
import Grid from "@mui/material/Grid";
import Button from "../../../components/Button";
import FormattedJsonSection from "../../../components/JsonFormatter";
import { Text } from "../../../components/Text";
import Section from "../../../components/Wrappers/Section";
import useConfigController from "./useConfigController";
import Table from "../../../components/Table";

const Configure = () => {

    const { values, functions } = useConfigController()

    return (
        <Grid
            container
            py={3}
        >
            <Grid size={12} >
                <Text weight={'bold'} color="black" size={'header'}>Configure & Preview</Text>
            </Grid>
            <Grid size={12} >
                <Text color="text.ternary" size={'body'}>View sample payload and configure</Text>
            </Grid>

            <Section header={'Transaction Payload'}>
                {values?.payload &&
                    <FormattedJsonSection value={values?.payload} />
                }
            </Section>

            <Grid size={12} >
                {values?.payload &&
                    <Table
                        columns={values.columns}
                        data={values.data}
                    />
                }
            </Grid>

            <Section header={'Preview Payload'}>
                {values?.previewPayload &&
                    <FormattedJsonSection value={values.previewPayload} />
                }
            </Section>


            <Box mt={2} width={'100%'} display={'flex'} justifyContent={'space-between'}>
                <Button height="40px" type="secondary" size="md" text="Back" onClick={functions.handlePrevious} />
                <Button height="40px" type="secondary" size="md" text="Send For Approval" onClick={functions.handleNext} />
            </Box>
        </Grid >
    )
}

export default Configure;
