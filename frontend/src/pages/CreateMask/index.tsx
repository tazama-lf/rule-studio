import CodeIcon from '@mui/icons-material/Code';
import { Box } from "@mui/material";
import { useSearchParams } from 'react-router-dom';
import Tabs from '../../components/Tabs';
import { Text } from "../../components/Text";
import BoxWrapper from "../../components/Wrappers/BoxWrapper";
import { MaskingTabProvider } from '../../contexts/MaskingTabContext';
import { useMaskingTab } from '../../contexts/MaskingTabContext/useMaskingTab';
import useCreateMaskController from './useCreateMaskController';


const MaskingContent = () => {

    const { functions } = useCreateMaskController()
    const { tabs, selectedTab } = useMaskingTab()

    return (
        <>
            <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} >
                <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} gap={1}>
                    <CodeIcon sx={{ color: '#4789f6', fontSize: '30px' }} />
                    <Text weight={'bold'} color="black" size={'header'}>Masking</Text>
                </Box>
            </Box>

            <Tabs tabs={tabs} selectedTab={selectedTab} />

            {functions.renderComponent()}
        </>
    )
}

const CreateMasking = () => {

    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') ?? null

    return (
        <MaskingTabProvider mode={mode}>
            <BoxWrapper>
                <MaskingContent />
            </BoxWrapper>
        </MaskingTabProvider>
    )
}

export default CreateMasking
