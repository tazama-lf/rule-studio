import { Box } from '@mui/material';
import Grid from '@mui/material/Grid';
import Loader from '../../../../components/Loader';
import useViewReportController, { type IViewReport } from "./useViewReportController";


const ViewReport = (props: IViewReport) => {
    const { values } = useViewReportController(props)

    if (values?.isLoading) {
        return <Loader center />
    }

    return (
        <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
                <Box
                    component="iframe"
                    srcDoc={values?.htmlContent}
                    sx={{
                        width: '100%',
                        height: '70vh',
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                    }}
                />
            </Grid>
        </Grid>
    )
}

export default ViewReport
