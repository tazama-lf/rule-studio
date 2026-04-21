import { Box } from "@mui/material";
import { Text } from "../../../components/Text";
import useEvaluationController from "./useEvaluationController"
import Grid from "@mui/material/Grid";
import { useMemo } from "react";
import Debugger, { type DebugLog } from "../../../components/Debugger";

const Evaluation = () => {

    const { values, functions } = useEvaluationController()

    const debugLogs = useMemo<DebugLog[]>(() => {
        return values.logs.map(log => ({
            time: new Date(log.timestamp).toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            message: log.message,
            type: log.level === 'error' ? 'error' :
                log.level === 'success' ? 'success' : 'info'
        }));
    }, [values.logs]);

    const isPlaying = values.simulationState.status === 'running';

    return (
        <Grid
            size={12}
            border={1} my={1} mt={3} px={3} py={2} borderColor={'#dfddde'} borderRadius={1}>
            <Grid size={12} display={'flex'} justifyContent={'space-between'} >
                <Text color="black" size={'sub'} weight={'400'}>Execution Progress</Text>
                <Text color="black" size={'sub'} weight={'400'}>{values.simulationState.progress}%</Text>
            </Grid>
            <Box position={'relative'}>
                <Box width={'100%'} mt={1} bgcolor={'static.lightGrey'} height={'10px'} borderRadius={1} />
                <Box position={'absolute'} bottom={0} bgcolor={'static.secondary'} height={'10px'} borderRadius={1} width={`${values.simulationState.progress}%`} />
            </Box>

            <Debugger
                logs={debugLogs}
                isPlaying={isPlaying}
                onClear={functions.clearLogs}
            />
        </Grid>

    )
}


export default Evaluation