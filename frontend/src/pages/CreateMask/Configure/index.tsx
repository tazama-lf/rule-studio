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

            {values?.summary && (
                <Grid size={12} mt={2}>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 3,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: '#f8fafc',
                            border: '1px solid #e2e8f0'
                        }}
                    >
                        <Box>
                            <Text size="sub" color="text.secondary" sx={{ mb: 0.5 }}>Total Fields</Text>
                            <Text weight="bold" size="body" color="primary.main">
                                {values.summary.totalFields}
                            </Text>
                        </Box>
                        <Box sx={{ borderLeft: '1px solid #e2e8f0', pl: 3 }}>
                            <Text size="sub" color="text.secondary" sx={{ mb: 0.5 }}>Fields Selected for Tokenization</Text>
                            <Text weight="bold" size="body" color="success.main">
                                {values.summary.tokenizedFields}
                            </Text>
                        </Box>
                    </Box>
                </Grid>
            )}

            <Box mt={2} width={'100%'} display={'flex'} justifyContent={'space-between'}>
                <Button height="40px" type="secondary" size="md" text="Back" onClick={functions.handlePrevious} />
                <Button height="40px" type="secondary" size="md" text="Send For Approval" onClick={functions.handleNext} />
            </Box>
        </Grid >
    )
}

export default Configure;