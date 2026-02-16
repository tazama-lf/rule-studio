import CheckIcon from '@mui/icons-material/Check';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import UploadIcon from '@mui/icons-material/Upload';
import { Box, Grid } from "@mui/material";
import Button from "../../../components/Button";
import { Text } from "../../../components/Text";
import Section from "../../../components/Wrappers/Section";
import { claims, simulations, Status } from "../../../utils/Constants/data";
import useSimulationController, { type ISimulation } from "./useSimulationController";
import FormattedJsonSection from '../../../components/JsonFormatter';
import EditableJsonPayload from '../../../components/JsonFormatter/EditableJsonPayload';
import { Controller } from 'react-hook-form';
import Loader from '../../../components/Loader';

const Simulation = (props: ISimulation) => {

    const { values, functions } = useSimulationController(props);


    if (values?.isLoading) {
        return <Box width={'100%'} height={'60vh'} alignItems={'center'} display={'flex'} justifyContent={'center'}>
            <Loader />
        </Box>
    }

    const SimulationBox = ({ data }: { data: typeof simulations[0] }) => {
        const Icon = data.icon;

        const simulate = values?.selected === data?.id

        return (
            <Grid
                size={{ xs: 12, md: 4 }}
                border={2}
                p={2}
                borderColor={simulate ? 'static.secondary' : 'static.border'}
                borderRadius={1}
                height={'auto'}
                bgcolor={simulate ? 'static.lightBlue' : 'white'}
                minHeight={150}
                onClick={() => functions.handleSelect(data.id)}
                sx={{ cursor: 'pointer', transition: 'all 0.2s' }}
            >
                <Box width={'100%'} display={'flex'} flexDirection={'column'}>
                    <Box width={'100%'} display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
                        <Box width={40} height={40} bgcolor={simulate ? 'static.skyBlue' : 'static.lightGrey'} borderRadius={2} display={'flex'} alignItems={'center'} justifyContent={'center'}>
                            <Icon sx={{ fontSize: 24, color: simulate ? 'static.secondary' : 'static.ternary' }} />
                        </Box>
                        {
                            simulate &&
                            <TaskAltIcon sx={{ color: 'static.secondary' }} />
                        }
                    </Box>
                    <Text weight={600} mt={1} color="black" size={'body'}>
                        {data.title}
                    </Text>
                    <Text color="black" size={'sub'} my={1}>
                        {data.description}
                    </Text>
                </Box>
            </Grid >
        )
    }

    return (
        <Grid
            container
            py={3}
        >
            <Box width={'100%'} display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
                <Box>
                    <Grid size={12} >
                        <Text weight={'bold'} color="black" size={'header'}>Simulation Sandbox</Text>
                    </Grid>
                    <Grid size={12} >
                        <Text color="text.ternary" size={'body'}>Submit Code For Review</Text>
                    </Grid>
                </Box>
                <Box display={'flex'} gap={2}>
                    {claims.editor === values?.claim &&
                        <>
                            <Button
                                height="40px"
                                width="170px"
                                type="secondary"
                                size="lg"
                                text={!values?.codeSynced ? "Synced" : "Sync On Github"}
                                Icon={UploadIcon}
                                loading={values?.uploading}
                                disabled={!values?.codeSynced}
                                onClick={functions.handleUpload}
                            />
                            <Button
                                height="40px"
                                width="170px"
                                type="secondary"
                                size="md"
                                text={values?.codeDeployed ? "Rule Deployed" : "Deploy Rule"}
                                loading={values?.deploying}
                                disabled={!values?.viewReport || values?.codeDeployed || values?.isReportFailed}
                                onClick={functions.handleDeploy}
                            />
                        </>
                    }
                    <Button
                        height="40px"
                        width="170px"
                        type="secondary"
                        size="md"
                        text="View Test Report"
                        loading={values?.loader}
                        disabled={!values?.viewReport}
                        onClick={functions.handleReport}
                    />
                </Box>
            </Box>
            <Section header={'Simulation Scope'} subHeader={'Select the scope of your simulation to determine required inputs and runtime cost'}>
                <Grid container spacing={2} width={'80%'} display={'flex'} justifyContent={'space-between'} alignSelf={'center'} mb={4}>
                    {simulations.map((item, index) => (
                        <SimulationBox key={index} data={item} />
                    ))}
                </Grid>

                <Grid container spacing={2} width={'100%'} mt={2}>
                    {
                        values?.payloadLoading ?
                            <Box width={'100%'} display={'flex'} justifyContent={'center'}>
                                <Loader />
                            </Box> :
                            values?.selected &&
                            <Grid size={{ xs: 12, md: values?.result ? 6 : 12 }}>
                                <Controller
                                    name="payload"
                                    control={values?.control}
                                    render={({ field }) => (
                                        <EditableJsonPayload
                                            label="Payload (Edit values only)"
                                            value={field.value}
                                            onChange={field.onChange}
                                            error={values?.errors.payload?.message}
                                        />
                                    )}
                                />
                            </Grid>
                    }

                    {values?.result &&
                        <Grid size={{ xs: 12, md: 6 }} overflow={'hidden'}>
                            <FormattedJsonSection label="Result" value={JSON.stringify(values?.result)} />
                        </Grid>
                    }
                </Grid>

                {values?.selected &&
                    <Box width={'100%'} display={'flex'} gap={2} justifyContent={'flex-end'} mt={2}>
                        <Button
                            height="40px"
                            width="170px"
                            type="secondary"
                            size="md"
                            text="Run Simulation"
                            loading={values?.simulating}
                            onClick={functions.onSubmit}
                        />
                    </Box>
                }
            </Section>
            {/* <Section header={'Configuration Association'} subHeader={'Associate this rule with transaction flow, network context, and typology definitions'}>
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
            </Section> */}
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
            <Box width={'100%'} display={'flex'} justifyContent={'space-between'} mt={2} alignSelf={'flex-end'}>
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
                        values?.status === Status.STATUS_01_IN_PROGRESS &&
                            values?.sentForApproval ?
                            <Button
                                height="40px"
                                size="md"
                                type='secondary'
                                onClick={() => functions.handleApproval('review')}
                                text="Send For Approval"
                            />
                            :
                            values?.claim === claims.publisher ?
                                <Button
                                    height="40px"
                                    size="md"
                                    type='secondary'
                                    onClick={() => functions.handleApproval('review')}
                                    text="Deploy to Production"
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
