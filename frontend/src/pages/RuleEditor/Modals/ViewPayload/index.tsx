import Grid from '@mui/material/Grid';
import FormattedJsonSection from '../../../../components/JsonFormatter';
import useViewPayloadController, { type IViewPayload } from "./useViewPayloadController";


const ViewPayload = (props: IViewPayload) => {
    const { values } = useViewPayloadController(props)

    return (
        <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }} display={'flex'} flexDirection={'column'} gap={3}>
                <FormattedJsonSection label='Payload' value={JSON.stringify(values?.payload ?? {})} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} display={'flex'} flexDirection={'column'} gap={3}>
                <FormattedJsonSection label='Simulation Result' value={JSON.stringify(values?.result ?? {})} />
            </Grid>
        </Grid>
    )
}

export default ViewPayload
