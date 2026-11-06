import { Box } from '@mui/material';
import Loader from '../../../../components/Loader';
import { useGetRuleBuildReportQuery } from '../../../../redux/Api/RulePipeline';

const PipelineReport = ({ buildId }: { buildId: string }) => {
    const { data, isLoading } = useGetRuleBuildReportQuery(buildId)

    if (isLoading) {
        return <Loader center />
    }

    return (
        <Box
            component="iframe"
            title="Unit test report"
            srcDoc={data}
            sx={{ width: '100%', height: '70vh', border: '1px solid #e0e0e0', borderRadius: 1 }}
        />
    )
}

export default PipelineReport
