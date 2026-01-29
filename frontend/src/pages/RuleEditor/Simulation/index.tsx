import { Box, Grid } from "@mui/material"
import Button from "../../../components/Button"
import useSimulationController, { type ISimulation } from "./useSimulationController";
import CheckIcon from '@mui/icons-material/Check';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import { claims, Status } from "../../../utils/Constants/data";

const Simulation = (props: ISimulation) => {

    const { values, functions } = useSimulationController(props);

    return (
        <Grid
            container
            py={3}
            display={'flex'}
            justifyContent={'space-between'}
            alignItems={'center'}
            gap={2}
            height={'70vh'}
        >
            <Box mt={2} width={'100%'} gap={2} display={'flex'} justifyContent={'flex-end'}>
                {values?.claim === claims.approver && values?.status === Status.STATUS_03_UNDER_REVIEW ?
                    <>
                        <Button
                            height="40px"
                            width="170px"
                            size="md"
                            type="danger"
                            Icon={ClearRoundedIcon}
                            onClick={() => functions.handleApproval('reject')}
                            text="Reject"
                        />
                        <Button
                            height="40px"
                            width="170px"
                            size="md"
                            Icon={CheckIcon}
                            onClick={() => functions.handleApproval('approve')}
                            text="Approve"
                        />
                    </>
                    :
                    values?.status === Status.STATUS_01_IN_PROGRESS ?
                        <Button
                            height="40px"
                            size="md"
                            type='secondary'
                            onClick={() => functions.handleApproval('review')}
                            text="Send For Approval"
                        />
                        : null
                }
            </Box>
            <Box width={'100%'} display={'flex'} justifyContent={'space-between'} alignSelf={'flex-end'}>
                <Button
                    height="40px"
                    width="170px"
                    type="secondary"
                    size="md"
                    text="Back"
                    onClick={functions.handleBack}
                />
                <Button
                    height="40px"
                    width="170px"
                    type="secondary"
                    size="md"
                    text="Next"
                    onClick={functions.handleNext}
                />
            </Box>
        </Grid>
    )
}

export default Simulation
