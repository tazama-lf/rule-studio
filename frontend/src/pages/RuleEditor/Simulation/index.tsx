import { Box, Grid } from "@mui/material"
import Button from "../../../components/Button"
import useSimulationController, { type ISimulation } from "./useSimulationController";
import CheckIcon from '@mui/icons-material/Check';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import { claims, Status } from "../../../utils/Constants/data";
import UploadIcon from '@mui/icons-material/Upload';
import { Text } from "../../../components/Text";
import Section from "../../../components/Wrappers/Section";
import DropDown from "../../../components/DropDown";

const Simulation = (props: ISimulation) => {

    const { values, functions } = useSimulationController(props);

    return (
        <Grid
            container
            py={3}
            height={'60vh'}
        >
            <Box>
                <Grid size={12} >
                    <Text weight={'bold'} color="black" size={'header'}>Simulation Sandbox</Text>
                </Grid>
                <Grid size={12} >
                    <Text color="text.ternary" size={'body'}>Submit Code For Review</Text>
                </Grid>
            </Box>
            <Section header={'Configuration Association'} subHeader={'Associate this rule with transaction flow, network context, and typology definitions'}>
                <Grid container size={12} spacing={2} alignItems={'flex-start'} justifyContent={'space-between'}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <DropDown
                            value={null}
                            label="Typology Config"
                            onClick={functions.handleNetworkMap}
                            placeholder="View Typology Config"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <DropDown
                            value={null}
                            label="Network Map"
                            onClick={functions.handleNetworkMap}
                            placeholder="View Network Map"
                        />
                    </Grid>
                </Grid>
            </Section>
            {/* <Box width={'100%'} display={'flex'} justifyContent={'end'}>
                <Button
                    height="40px"
                    width="170px"
                    type="secondary"
                    size="md"
                    text="Upload Code"
                    Icon={UploadIcon}
                    onClick={functions.handleUpload}
                />
            </Box> */}
            <Box width={'100%'} display={'flex'} justifyContent={'space-between'} alignSelf={'flex-end'}>
                <Button
                    height="40px"
                    width="170px"
                    type="secondary"
                    size="md"
                    text="Back"
                    onClick={functions.handleBack}
                />
                <Box display={'flex'} gap={2}>
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
                    <Button
                        height="40px"
                        width="170px"
                        type="secondary"
                        size="md"
                        text="Next"
                        onClick={functions.handleNext}
                    />
                </Box>

            </Box>
        </Grid>
    )
}

export default Simulation
