import CodeIcon from '@mui/icons-material/Code';
import { Box } from "@mui/material";
import { useSearchParams } from 'react-router-dom';
import SuspenseLoader from '../../components/SuspenseLoader';
import Tabs from '../../components/Tabs';
import { Text } from "../../components/Text";
import BoxWrapper from "../../components/Wrappers/BoxWrapper";
import { TabProvider } from '../../contexts/TabContext/TabProvider';
import useRuleEditorController from './useRuleEditorController';
import CommentCard from '../../components/Cards/CommentCard';
import { claims, Status } from '../../utils/Constants/data';


const RuleEditorContent = () => {

    const { values, functions } = useRuleEditorController()

    if (values?.isLoading) {
        return <SuspenseLoader />
    }

    return (
        <>
            <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} >
                <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} gap={1}>
                    <CodeIcon sx={{ color: '#4789f6', fontSize: '30px' }} />
                    <Text weight={'bold'} color="black" size={'header'}>Rule Editor</Text>
                </Box>
            </Box>

            {values?.user?.claims === claims.editor &&
                <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} >
                    {(values?.data?.status === Status.STATUS_04_APPROVED || values?.data?.status === Status.STATUS_05_REJECTED) &&
                        <CommentCard success={values?.data?.status === Status.STATUS_04_APPROVED} message={values?.data?.comments} />
                    }
                </Box>
            }

            <Tabs />

            {functions.renderComponent()}
        </>
    )
}

const RuleEditor = () => {

    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') ?? null

    return (
        <TabProvider mode={mode}>
            <BoxWrapper>
                <RuleEditorContent />
            </BoxWrapper>
        </TabProvider>
    )
}

export default RuleEditor
