import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import { Accordion, AccordionDetails, Box, Paper } from "@mui/material";
import Grid from "@mui/material/Grid";
import { memo } from "react";
import { Controller } from "react-hook-form";
import { AccordionSummary } from "../../../components/AccordianSummary";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import { Text } from "../../../components/Text";
import Section from "../../../components/Wrappers/Section";
import { styles } from './styles';
import useNewSimulationController, { type ExcludedTypeProps } from "./useNewSimulationController";

interface TagProps {
    text: string;
    variant?: 'filled' | 'outlined';
}

interface ExcludedMessagesProp {
    title: string,
    tags: ExcludedTypeProps[]
}

const Tag = memo(({ text, variant = 'filled' }: TagProps) => (
    <Paper
        variant="outlined"
        sx={variant === 'filled' ? styles.tagPaper : styles.tagPaperOutlined}
    >
        <Text size="sub" color='static.darkBrown'>
            {text}
        </Text>
    </Paper>
));

Tag.displayName = 'Tag';

const ExcludedMessagesAccordion = memo(({ title, tags }: ExcludedMessagesProp) => (
    <Grid size={12} sx={styles.accordionContainer}>
        <Accordion sx={styles.accordion}>
            <AccordionSummary
                aria-controls="panel-content"
                id="panel-header"
            >
                <InfoOutlinedIcon sx={styles.accordionIcon} />
                <Text size="sub" color="static.darkBrown" weight={'semibold'}>
                    {title}
                </Text>
            </AccordionSummary>
            <AccordionDetails sx={styles.accordionDetails}>
                {tags.map((tag, index) => (
                    <Box display={'flex'} mb={1}>
                        <Tag key={`${index}-type`} text={tag.txtp} variant={'filled'} />
                        <Tag key={`${index}-version`} text={tag.txtp_version} variant={'outlined'} />
                    </Box>
                ))}
            </AccordionDetails>
        </Accordion>
    </Grid>
));

ExcludedMessagesAccordion.displayName = 'ExcludedMessagesAccordion';

const NewSimulation = () => {

    const { values, functions } = useNewSimulationController()

    return (
        <Grid container sx={styles.container}>
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

            <Box sx={styles.actionBox}>
                <Button loading={values?.createLoading} height="40px" type="secondary" size="" text="Fetch Tokenized Data" Icon={StorageRoundedIcon} onClick={functions.handleSubmit} />
            </Box>

            {values.dataFetched && (
                <>
                    <Section header={'Data Summary'}>
                        <Grid container size={12} spacing={4}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Box sx={styles.summaryBox}>
                                    <Text color="text.ternary" weight={'500'} size={'sub'}>RECORD COUNT</Text>
                                    <Text color="black" size={'header'} weight={'bold'}>
                                        {values.count}
                                    </Text>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Box sx={styles.summaryBox}>
                                    <Text color="text.ternary" weight={'500'} size={'sub'}>DATE / TIME RANGE</Text>
                                    <Text color="black" size={'body'}>
                                        {values.formValues.date}
                                    </Text>
                                    <Text color="text.ternary" size={'body'}>{values.formValues.startTime} - {values.formValues.endTime}</Text>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Box sx={styles.summaryBox}>
                                    <Text color="text.ternary" weight={'500'} size={'sub'}>SIMULATION READINESS</Text>
                                    <Paper variant="outlined" sx={styles.readinessPaper}>
                                        <Box sx={styles.readinessIconBox}>
                                            <TaskAltIcon sx={styles.readinessIcon} />
                                            <Text size="sub" sx={styles.readinessText}>
                                                Ready to run
                                            </Text>
                                        </Box>
                                    </Paper>
                                </Box>
                            </Grid>
                        </Grid>
                    </Section>
                    <Box sx={styles.actionBox}>
                        <Button height="40px" type="secondary" size="md" text="Run Simulation" onClick={() => { }} />
                    </Box>

                    <ExcludedMessagesAccordion
                        title="Excluded Message Types (No tokenization configuration found)"
                        tags={values.excluded.filter((config) => config.record_status === 'Not Exists')}
                    />

                    <ExcludedMessagesAccordion
                        title="Excluded Message Types (No active Endpoints found)"
                        tags={values.excluded.filter((config) => config.record_status === 'Exists')}
                    />
                </>
            )
            }
        </Grid >
    )
}

export default NewSimulation;
