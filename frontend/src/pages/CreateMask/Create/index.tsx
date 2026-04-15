import { Box } from "@mui/material";
import Grid from "@mui/material/Grid";
import { Controller } from "react-hook-form";
import Button from "../../../components/Button";
import DropDown, { type DropdownOption } from "../../../components/DropDown";
import Loader from "../../../components/Loader";
import { Text } from "../../../components/Text";
import Section from "../../../components/Wrappers/Section";
import useCreateController from "./useCreateController";

interface CreateProps {
    mode?: string | null;
    id?: string;
    maskData?: Record<string, unknown>;
}

const Create = ({ mode, id, maskData }: CreateProps) => {

    const { values, functions } = useCreateController({ mode, id, maskData })

    if (values?.isLoading) {
        return <Loader center />
    }

    return (
        <Grid
            container
            py={3}
        >
            <Grid size={12} >
                <Text weight={'bold'} color="black" size={'header'}>Masking Overview</Text>
            </Grid>
            <Grid size={12} >
                <Text color="text.ternary" size={'body'}>Basic information about this masking configuration</Text>
            </Grid>
            <Section header={'Select Dataset'} subHeader={'Choose the message type and version'}>
                <Grid container size={12} spacing={2} alignItems={'flex-start'} justifyContent={'space-between'}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            control={values.control}
                            name="txtp"
                            rules={{ required: 'Transaction type is required' }}
                            render={({ field }) => (
                                <DropDown
                                    required
                                    label="Transaction Type"
                                    options={values.transactions}
                                    {...field}
                                    onChange={(val) => functions.handleTxTp(val as DropdownOption)}
                                    placeholder="Select Transaction type"
                                    error={values.errors.txtp?.message}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            control={values.control}
                            name="txtpVersion"
                            rules={{ required: 'Transaction type version is required' }}
                            render={({ field }) => (
                                <DropDown
                                    required
                                    label="Transaction Type Versions"
                                    options={values.txtpVersions}
                                    {...field}
                                    placeholder={values.versionsLoading ? 'Loading versions...' : 'Select Version'}
                                    disabled={values.versionsLoading}
                                    error={values.errors.txtpVersion?.message}
                                />
                            )}
                        />
                    </Grid>
                </Grid>


            </Section>

            <Box mt={2} width={'100%'} display={'flex'} justifyContent={'flex-end'}>
                <Button loading={values?.createLoading} height="40px" type="secondary" size="md" text="Save & Next" onClick={functions.handleSubmit} />
            </Box>
        </Grid>
    )
}

export default Create;
