import CodeIcon from '@mui/icons-material/Code';
import { Box } from "@mui/material";
import { useSearchParams } from 'react-router-dom';
import Tabs from '../../components/Tabs';
import { Text } from "../../components/Text";
import BoxWrapper from "../../components/Wrappers/BoxWrapper";
import { SimulationTabProvider } from '../../contexts/SimulationTabContext';
import { useSimulationTab } from '../../contexts/SimulationTabContext/useSimulationTab';
import useSimulationController from './useSimulationController';


const SimulationContent = () => {

    const { functions } = useSimulationController()
    const { tabs, selectedTab } = useSimulationTab()

    return (
        <>
            <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} >
                <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} gap={1}>
                    <CodeIcon sx={{ color: '#4789f6', fontSize: '30px' }} />
                    <Text weight={'bold'} color="black" size={'header'}>Simulation</Text>
                </Box>
            </Box>

            <Tabs tabs={tabs} selectedTab={selectedTab} />

            {functions.renderComponent()}
        </>
    )
}

const Simulation = () => {

    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') ?? null

    return (
        <SimulationTabProvider mode={mode}>
            <BoxWrapper>
                <SimulationContent />
            </BoxWrapper>
        </SimulationTabProvider>
    )
}

export default Simulation
