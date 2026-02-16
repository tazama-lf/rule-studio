import { Box } from '@mui/material';
import Grid from '@mui/material/Grid';
import FormattedJsonSection from '../../../../components/JsonFormatter';
import useViewPayloadController, { type IViewPayload } from "./useViewPayloadController";


const ViewPayload = (props: IViewPayload) => {
    const { values } = useViewPayloadController(props)

    return (
        <Grid container spacing={2}>
            <Grid size={{ xs: 12 }} display={'flex'} flexDirection={'column'} gap={3}>
                <Box border={1} borderColor={'static.border'} p={2} borderRadius={1} minHeight={300}>
                    <FormattedJsonSection value={JSON.stringify(values?.json ?? {})} />
                </Box>
            </Grid>
        </Grid>
    )
}

export default ViewPayload
