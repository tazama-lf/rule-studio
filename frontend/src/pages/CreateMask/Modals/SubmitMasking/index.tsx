import Grid from '@mui/material/Grid';
import Table from '../../../../components/Table';
import useSubmitMaskingController, { type ISubmitMask } from "./useSubmitMaskingController";
import { Text } from '../../../../components/Text';
import { Box } from '@mui/material';
import Button from '../../../../components/Button';


const SubmitMasking = (props: ISubmitMask) => {
    const { values, functions } = useSubmitMaskingController(props)

    return (
        <Grid container spacing={2}>
            <Grid size={12} >
                <Text weight="400" color="#64748b" size="body" sx={{ textAlign: 'center' }}>
                    You are about to submit configuration for <strong style={{ color: 'black' }}>{values.payload.txtp}</strong> version <strong style={{ color: 'black' }}>{values.payload.txtp_version}</strong>. This will be sent to a checker for review before becoming active. Are you sure?
                </Text>
                <Table
                    title='Tokenization Review'
                    columns={values.columns}
                    data={values.data}
                    containerSx={{ maxHeight: '500px', overflowY: 'auto' }}
                />
                <Box mt={2} width={'100%'} display={'flex'} justifyContent={'space-between'}>
                    <Button height="40px" type='default' outlined size="md" text="Cancel" onClick={functions.onCancel} />
                    <Button height="40px" type="primary" size="md" text="Send For Approval" loading={values.updateLoading} onClick={functions.onSubmit} />
                </Box>
            </Grid>
        </Grid >
    )
}

export default SubmitMasking
