import Grid from "@mui/material/Grid";
import { Controller } from "react-hook-form";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import FormattedJsonSection from "../../../components/JsonFormatter";
import { Text } from "../../../components/Text";
import Section from "../../../components/Wrappers/Section";
import useParserController, { type IParseProps } from "./useParserController";
import FileUploadIcon from '@mui/icons-material/FileUpload';
import SimulationResultCard from "../../../components/Cards/SimulationResult";
import { Box } from "@mui/material";
import Loader from "../../../components/Loader";

const Parser = (props: IParseProps) => {

    const { values, functions } = useParserController(props)

    return (
        <Grid
            container
            py={3}
        >
            <Grid size={12} >
                <Text weight={'bold'} color="black" size={'header'}>Payload Parser</Text>
            </Grid>
            <Grid size={12} >
                <Text color="text.ternary" size={'body'}>Parse and Extract Variables from Sample Payload</Text>
            </Grid>

            <Section header={'Payload Schema Definition'} subHeader={'Define the transaction payload structure to extract variables for rule building'}>
                {values?.txtp && !values?.isView ?
                    <Grid size={12} display={'flex'} justifyContent={'flex-end'} width={'100%'}>
                        <Button
                            height="30px"
                            width="170px"
                            type="secondary"
                            size="md"
                            text="Fetch Json"
                            loading={values?.sampleLoader}
                            Icon={FileUploadIcon}
                            onClick={functions.fetchJson}
                        />
                    </Grid>
                    : null}
                <Grid container size={12} spacing={2} alignItems={'flex-start'}>

                    {!values?.isView ?
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                                name="payload"
                                control={values.control}
                                render={({ field, fieldState: { error } }) => (
                                    <Input
                                        type="textarea"
                                        maxWidth={'100%'}
                                        required
                                        rows={12}
                                        label="JSON Payload"
                                        {...field}
                                        error={error?.message}
                                    />
                                )}
                            />
                        </Grid>
                        : null}

                    <Grid size={{ xs: 12, md: !values?.isView ? 6 : 12 }} border={1} borderColor={'static.border'} mt={0.4} p={2} overflow={'auto'} borderRadius={1} height={310}>
                        {values?.sampleLoader && values?.isView ?
                            <Loader /> :
                            <FormattedJsonSection value={values?.json ?? JSON.stringify({})} />
                        }
                    </Grid>
                </Grid>

                {values?.json && !values?.isView ?
                    <Grid size={12} width={'100%'} display={'flex'} justifyContent={'center'}>
                        <Button
                            height="40px"
                            type="secondary"
                            size="md"
                            text="Simulate"
                            loading={values.isLoading}
                            onClick={functions.handleSubmit}
                        />
                    </Grid>
                    : null}

                {values?.ruleRequest ?
                    <Grid size={{ xs: 12, md: 12 }} border={1} borderColor={'static.border'} mt={0.4} p={2} overflow={'auto'} borderRadius={1} height={310}>
                        <FormattedJsonSection value={JSON.stringify(values?.ruleRequest)} />
                    </Grid> :
                    null
                }
            </Section >
            <Grid container display={'flex'} justifyContent={'center'} width={'100%'} size={{ xs: 12, md: 12, sm: 12 }}>
                {
                    values?.result ?
                        <Grid size={{ xs: 12, md: 12, sm: 12 }} display={'flex'} justifyContent={'center'}>
                            <SimulationResultCard result={values?.result} />
                        </Grid>
                        : null}
            </Grid>
            {values?.result?.success || values?.isEdit || values?.isView ?
                <Box mt={2} width={'100%'} display={'flex'} justifyContent={'flex-end'}>
                    <Button height="40px" type="secondary" size="md" text="Next" onClick={functions.handleNext} />
                </Box>
                : null}
        </Grid >
    )
}

export default Parser;
