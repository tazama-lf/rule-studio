import CodeIcon from '@mui/icons-material/Code';
import { Box } from "@mui/material";
import { useSearchParams } from 'react-router-dom';
import CommentCard from '../../components/Cards/CommentCard';
import SuspenseLoader from '../../components/SuspenseLoader';
import Tabs from '../../components/Tabs';
import { Text } from "../../components/Text";
import BoxWrapper from "../../components/Wrappers/BoxWrapper";
import { MaskingTabProvider } from '../../contexts/MaskingTabContext';
import { claims, Status } from '../../utils/Constants/data';
import useCreateMaskController from './useCreateMaskController';


const MaskingContent = () => {

    const { values, functions } = useCreateMaskController()

    if (values?.isLoading) {
        return <SuspenseLoader />
    }

    return (
        <>
            <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} >
                <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} gap={1}>
                    <CodeIcon sx={{ color: '#4789f6', fontSize: '30px' }} />
                    <Text weight={'bold'} color="black" size={'header'}>Masking</Text>
                </Box>
            </Box>

            {values?.user?.claims === claims.editor &&
                <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} >
                    {(values?.data?.status === Status.STATUS_04_APPROVED || values?.data?.status === Status.STATUS_05_REJECTED) &&
                        typeof values?.data?.comments === 'string' &&
                        <CommentCard success={values?.data?.status === Status.STATUS_04_APPROVED} message={values.data.comments} />
                    }
                </Box>
            }

            <Tabs variant="masking" />

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
