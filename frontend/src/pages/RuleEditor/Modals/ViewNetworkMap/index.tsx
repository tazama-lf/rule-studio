import { Box } from '@mui/material';
import Grid from '@mui/material/Grid';
import FormattedJsonSection from '../../../../components/JsonFormatter';
import Loader from '../../../../components/Loader';
import useViewNetworkMapController from "./useViewNetworkMapController";


const ViewNetworkMap = () => {
    const { values } = useViewNetworkMapController()

    if (values?.isLoading) {
        return <Loader center />
    }

    return (
        <Grid container spacing={2}>
            <Grid size={{ xs: 12 }} display={'flex'} flexDirection={'column'} gap={3}>
                <Box border={1} borderColor={'static.border'} p={2} borderRadius={1} minHeight={300}>
                    <FormattedJsonSection value={JSON.stringify(values?.data ?? {})} />
                </Box>
            </Grid>
        </Grid>
    )
}

export default ViewNetworkMap
