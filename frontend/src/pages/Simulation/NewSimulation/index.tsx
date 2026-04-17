import { Box } from "@mui/material";
import Grid from "@mui/material/Grid";
import { Controller } from "react-hook-form";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import { Text } from "../../../components/Text";
import Section from "../../../components/Wrappers/Section";
import useNewSimulationController from "./useNewSimulationController";
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';

const NewSimulation = () => {

    const { values, functions } = useNewSimulationController()

    return (
        <Grid
            container
            py={3}
        >
            <Grid size={12} >
                <Text weight={'bold'} color="black" size={'header'}>Simulation Overview</Text>
            </Grid>
            <Grid size={12} >
                <Text color="text.ternary" size={'body'}>Basic information about this simulation</Text>
            </Grid>
            <Section header={'Specify Time Window'} subHeader={'Select a time window to fetch tokenized historical data for simulation.'}>
                <Grid container size={12} spacing={2} alignItems={'flex-start'} justifyContent={'space-between'}>
                    <Grid size={{ xs: 12, md: 12 }}>
                        <Controller
                            control={values.control}
                            name="date"
                            rules={{ required: "Date is required" }}
                            render={({ field }) => (
                                <Input
                                    required
                                    maxWidth={'100%'}
                                    label="Date"
                                    type="date"
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={values.errors.date?.message}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            control={values.control}
                            name="startTime"
                            rules={{ required: "Start time is required" }}
                            render={({ field }) => (
                                <Input
                                    required
                                    label="Start Time"
                                    maxWidth={'100%'}
                                    type="time"
                                    value={field.value}
                                    onChange={(e) => {
                                        field.onChange(e);
                                        functions.handleStartTimeChange();
                                    }}
                                    error={values.errors.startTime?.message}
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                            control={values.control}
                            name="endTime"
                            rules={{ 
                                required: "End time is required",
                                validate: functions.validateTimeDifference
                            }}
                            render={({ field }) => (
                                <Input
                                    required
                                    label="End Time"
                                    type="time"
                                    maxWidth={'100%'}
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={values.errors.endTime?.message}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </Section>

            <Box mt={2} width={'100%'} display={'flex'} justifyContent={'flex-end'}>
                <Button loading={values?.createLoading} height="40px" type="secondary" size="" text="Fetch Tokenized Data" Icon={StorageRoundedIcon} onClick={functions.handleSubmit} />
            </Box>
        </Grid>
    )
}

export default NewSimulation;
