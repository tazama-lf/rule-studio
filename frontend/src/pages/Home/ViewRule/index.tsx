import Grid from '@mui/material/Grid';
import Input from "../../../components/Input";
import useViewRuleController, { type ViewRuleProps } from "./useViewRuleController";
import { dateFormatter } from '../../../utils/Common/helpers';

const ViewRule = (props: ViewRuleProps) => {

    const { values } = useViewRuleController(props)
    return (
        <Grid container spacing={2}>
            <Grid size={{ xs: 12 }} display={'flex'} flexDirection={'column'} gap={3}>
                <Grid container spacing={2} justifyContent={'space-between'}>
                    <Input
                        maxWidth={400}
                        label="Rule Name"
                        disabled
                        value={values.data.rule_name}
                        view_only={false} />
                    <Input
                        maxWidth={400}
                        label="Transaction Type"
                        disabled
                        value={values.data.txtp}
                        view_only={false} />
                </Grid>
                <Grid container spacing={2} justifyContent={'space-between'}>
                    <Input
                        maxWidth={400}
                        label="Version"
                        disabled
                        value={values.data.version}
                        view_only={false} />
                    <Input
                        maxWidth={400}
                        label="Status"
                        disabled
                        value={values.data.status}
                        view_only={false} />
                </Grid>
                <Grid container spacing={2} justifyContent={'space-between'}>
                    <Input
                        maxWidth={400}
                        label="Publishing Status"
                        disabled
                        value={values.data.publishing_status}
                        view_only={false} />
                    <Input
                        maxWidth={400}
                        label="Created At"
                        disabled
                        value={dateFormatter(values.data.created_at)}
                        view_only={false} />
                </Grid>
                <Grid container size={12} spacing={2} justifyContent={'space-between'}>
                    <Input
                        maxWidth={'100%'}
                        type='textarea'
                        label="Description"
                        disabled
                        value={values.data.description}
                        view_only={false} />
                </Grid>
            </Grid>
        </Grid>
    )
}

export default ViewRule
