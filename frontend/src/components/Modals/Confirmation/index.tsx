import { Box } from "@mui/material";
import Grid from '@mui/material/Grid';
import { memo } from "react";
import Button from "../../Button";
import { Text } from "../../Text";
import useConfirmationController, { type IConfirmation } from "./useConfirmationController";


const Confirmation = (props: IConfirmation) => {

    const { values, functions } = useConfirmationController(props)

    return (
        <Grid container spacing={2}>

            <Text size="sub" color={'static.ternary'} sx={{ textAlign: 'center' }}>{values.message}</Text>


            <Box width={'100%'} gap={2} display={'flex'} justifyContent={'space-between'}>
                <Button height="35px" text="Cancel" size="sm" onClick={functions.close} type="muted" />
                <Button
                    height="35px"
                    type={'secondary'}
                    text={values.btnTitle}
                    onClick={functions.handleSubmit}
                    size="md"
                />
            </Box>
        </Grid>
    )
}


export default memo(Confirmation);