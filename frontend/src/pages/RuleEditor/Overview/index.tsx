import Grid from "@mui/material/Grid";
import { Controller } from "react-hook-form";
import DropDown, { type DropdownOption } from "../../../components/DropDown";
import Input from "../../../components/Input";
import Loader from "../../../components/Loader";
import { Text } from "../../../components/Text";
import Section from "../../../components/Wrappers/Section";
import useOverviewController, { type IOverviewProps } from "./useOverviewController";
import Button from "../../../components/Button";
import { Box } from "@mui/material";

const Overview = (props: IOverviewProps) => {

    const { values, functions } = useOverviewController(props)

    if (values?.isLoading) {
        return <Loader center />
    }

    return (
        <Grid
            container
            py={3}
        >
            <Grid size={12} >
                <Text weight={'bold'} color="black" size={'header'}>Rule Overview</Text>
            </Grid>
            <Grid size={12} >
                <Text color="text.ternary" size={'body'}>Basic information about this rule</Text>
            </Grid>
            <Section header={'Configuration Association'} subHeader={'Associate this rule with transaction flow, network context, and typology definitions'}>
                <Grid container size={12} spacing={2} alignItems={'flex-start'} justifyContent={'space-between'}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            control={values.control}
                            name="rule_config_id"
                            render={({ field }) => (
                                <DropDown
                                    required
                                    label="Rule Config"
                                    {...field}
                                    onClick={functions.handleRuleConfig}
                                    placeholder="Select Rule Config"
                                    error={!values?.rule_config_id ? values.errors.rule_config_id?.message : ''}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <DropDown
                            value={null}
                            label="Network Map"
                            onClick={functions.handleNetworkMap}
                            placeholder="View Network Map"
                        />
                    </Grid>
                </Grid>
            </Section>
            <Section header={'General Information'}>
                <Grid container size={12} spacing={2} alignItems={'flex-start'} justifyContent={'space-between'}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="rule_name"
                            control={values.control}
                            render={({ field }) => (
                                <Input
                                    maxWidth={'100%'}
                                    required
                                    disabled
                                    label="Rule Name"
                                    {...field}
                                    placeholder="tenant-rule_config_id"
                                    error={!field?.value ? values.errors.rule_name?.message : undefined}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            name="version"
                            control={values.control}
                            render={({ field, fieldState: { error } }) => (
                                <Input
                                    maxWidth={'100%'}
                                    required
                                    disabled={values?.isEdit}
                                    label="Rule Version"
                                    {...field}
                                    error={error?.message}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
                <Grid container size={12} spacing={2} alignItems={'flex-end'} justifyContent={'space-between'}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            control={values.control}
                            name="rule_type"
                            render={({ field }) => (
                                <DropDown
                                    required
                                    label="Rule Type"
                                    disabled={values?.isEdit}
                                    options={values.ruleTypes}
                                    {...field}
                                    placeholder="Select Rule type"
                                    error={values.errors.rule_type?.message}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
                <Controller
                    name="description"
                    control={values.control}
                    render={({ field }) => (
                        <Input
                            maxWidth={'100%'}
                            required
                            disabled={values?.isEdit}
                            type='textarea'
                            label="Description"
                            {...field}
                            error={values.errors.description?.message}
                        />
                    )}
                />
                <Grid container size={12} spacing={2} alignItems={'flex-start'} justifyContent={'space-between'}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            control={values.control}
                            name="txtp"
                            render={({ field }) => (
                                <DropDown
                                    required
                                    label="Transaction Type"
                                    disabled={values?.isEdit}
                                    options={values.transactions}
                                    {...field}
                                    onChange={(val) => functions.handleTxTp(val as DropdownOption)}
                                    placeholder="Select Transaction type"
                                    error={!field?.value ? values.errors.txtp?.message : undefined}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            control={values.control}
                            name="txtpVersion"
                            render={({ field }) => (
                                <DropDown
                                    required
                                    label="Transaction Type Versions"
                                    disabled={values?.isEdit}
                                    options={values.txtpVersions}
                                    {...field}
                                    placeholder="Select Version"
                                    error={values.errors.txtpVersion?.message}
                                />
                            )}
                        />
                    </Grid>
                </Grid>


            </Section>

            {!values?.isEdit ?
                <Box mt={2} width={'100%'} display={'flex'} justifyContent={'flex-end'}>
                    <Button loading={values?.createLoading} height="40px" type="secondary" size="md" text="Save & Next" onClick={functions.handleSubmit} />
                </Box>
                :
                <Box mt={2} width={'100%'} display={'flex'} justifyContent={'flex-end'}>
                    <Button height="40px" type="secondary" size="md" text="Next" onClick={functions.handleNext} />
                </Box>
            }

        </Grid>
    )
}

export default Overview;
