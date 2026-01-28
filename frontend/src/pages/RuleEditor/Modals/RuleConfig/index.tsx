import Grid from '@mui/material/Grid';
import useRuleConfigController, { type RuleConfigProps } from "./useRuleConfigController";
import DropDown, { type DropdownOption } from '../../../../components/DropDown';
import Loader from '../../../../components/Loader';
import FormattedJsonSection from '../../../../components/JsonFormatter';
import { Box } from '@mui/material';

const RuleConfig = (props: RuleConfigProps) => {

    const { values, functions } = useRuleConfigController(props)

    if (values?.isLoading) {
        return <Loader center />
    }

    return (
        <Grid container spacing={2}>
            <Grid size={{ xs: 12 }} display={'flex'} flexDirection={'column'} gap={3}>
                {!values?.isView ?
                    < DropDown
                        label="Rule Configurations"
                        value={values.ruleId}
                        onChange={(val) => functions.handleRuleId(val as DropdownOption)}
                        options={values.ruleConfigs}
                        placeholder="Select Transaction type"
                        searchable
                    />
                    : null}
                <Box border={1} borderColor={'static.border'} p={2} borderRadius={1} minHeight={300}>
                    <FormattedJsonSection value={JSON.stringify(values?.json ?? {})} />
                </Box>
            </Grid>
        </Grid>
    )
}

export default RuleConfig
