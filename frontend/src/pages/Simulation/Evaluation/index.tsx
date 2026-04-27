import { Box } from "@mui/material";
import { Text } from "../../../components/Text";
import useEvaluationController from "./useEvaluationController";
import Grid from "@mui/material/Grid";
import { useMemo } from "react";
import Debugger, { type DebugLog } from "../../../components/Debugger";
import Loader from "../../../components/Loader";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import type { SvgIconComponent } from "@mui/icons-material";
import Table from "../../../components/Table";

interface OverviewProps {
    title: string;
    Icon: SvgIconComponent;
    count: number;
    bgColor?: string;
    iconColor?: string;
}

const Overview = ({ title, Icon, count, bgColor = '#f3f4f6', iconColor = '#6b7280' }: OverviewProps) => {
    return (
        <Grid size={{ xs: 6, md: 3 }}>
            <Box
                p={2}
                bgcolor={bgColor}
                borderRadius={1}
                border="1px solid"
                borderColor="divider"
                height="80px"
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
            >
                <Box display="flex" alignItems="center" gap={1}>
                    <Icon sx={{ fontSize: 20, color: iconColor }} />
                    <Text color="text.ternary" weight="500" size="sub">
                        {title}
                    </Text>
                </Box>
                <Text color="black" size="header" weight="bold">
                    {count.toLocaleString()}
                </Text>
            </Box>
        </Grid>
    );
};

const Evaluation = () => {
    const { values, functions } = useEvaluationController();

    const debugLogs = useMemo<DebugLog[]>(
        () =>
            values.logs.map((log) => ({
                time: new Date(log.timestamp).toLocaleTimeString("en-US", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                }),
                message: log.message,
                type:
                    log.level === "error"
                        ? "error"
                        : log.level === "success"
                            ? "success"
                            : "info",
            })),
        [values.logs]
    );

    const isPlaying = values.simulationState.status === "running";

    const runDateTime = useMemo(() => {
        const now = new Date();
        return {
            date: now.toLocaleDateString("en-US", {
                month: "numeric",
                day: "numeric",
                year: "numeric",
            }),
            time: now.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
            }),
        };
    }, []);

    const replayDuration = useMemo(() => {
        const start = new Date();
        const end = new Date(start.getTime() + 10 * 60000);
        return `10 min (${start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} - ${end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })})`;
    }, []);

    const overviewItems = useMemo(() => {
        return Object.entries(values.overviewScore).map(([key, count]) => {
            const media = functions.getMedia(key as keyof typeof values.overviewScore);
            return {
                key,
                title: media.title,
                Icon: media.icon,
                count,
                bgColor: media.bgColor,
                iconColor: media.color,
            };
        });
    }, [values.overviewScore, functions]);

    return (
        <Grid container py={3} justifyContent="center">
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
            >
                <Box
                    display="flex"
                    bgcolor="static.skyBlue"
                    borderRadius="64px"
                    width="64px"
                    height="64px"
                    alignItems="center"
                    justifyContent="center"
                >
                    {isPlaying ? (
                        <Loader color="info" />
                    ) : (
                        <TaskAltIcon sx={{ fontSize: "35px" }} color="success" />
                    )}
                </Box>
                <Text my={2} color="black" size="bigHeader" weight="bold">
                    {`Simulation ${isPlaying ? "running" : "completed"}`}
                </Text>
                <Text color="static.ternary" size="body" weight="semibold">
                    {isPlaying
                        ? "Replaying transactions in historical sequence..."
                        : "All transactions processed successfully."}
                </Text>
            </Box>

            <Grid
                size={12}
                border={1}
                my={1}
                mt={3}
                px={3}
                py={2}
                borderColor="#dfddde"
                borderRadius={1}
            >
                <Grid size={12} display="flex" justifyContent="space-between">
                    <Text color="black" size="sub" weight="400">
                        Execution Progress
                    </Text>
                    <Text color="black" size="sub" weight="400">
                        {values.simulationState.progress}%
                    </Text>
                </Grid>
                <Box position="relative">
                    <Box
                        width="100%"
                        mt={1}
                        bgcolor="static.lightGrey"
                        height="11px"
                        borderRadius={2}
                    />
                    <Box
                        position="absolute"
                        bottom={0}
                        bgcolor="progressbar.main"
                        height="11px"
                        borderRadius={2}
                        width={`${values.simulationState.progress}%`}
                    />
                </Box>

                <Debugger
                    logs={debugLogs}
                    isPlaying={isPlaying}
                    onClear={functions.clearLogs}
                />
            </Grid>


            {!isPlaying &&
                <>
                    <Grid
                        container
                        size={12}
                        spacing={4}
                        display="flex"
                        justifyContent="space-between"
                    >
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box
                                p={2}
                                bgcolor="static.lightGrey"
                                borderRadius={1}
                                border="1px solid"
                                borderColor="divider"
                                height="70px"
                            >
                                <Text color="text.ternary" weight="500" size="sub">
                                    RUN DATE / TIME
                                </Text>
                                <Text color="black" size="body">
                                    {runDateTime.date}
                                </Text>
                                <Text color="text.ternary" size="body">
                                    {runDateTime.time}
                                </Text>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box
                                p={2}
                                bgcolor="static.lightGrey"
                                borderRadius={1}
                                border="1px solid"
                                borderColor="divider"
                                height="70px"
                            >
                                <Text color="text.ternary" weight="500" size="sub">
                                    REPLAY DURATION
                                </Text>
                                <Text color="black" size="body">
                                    {replayDuration}
                                </Text>
                            </Box>
                        </Grid>
                    </Grid>
                    <Grid
                        container
                        my={3}
                        size={12}
                        spacing={4}
                        display="flex"
                        justifyContent="space-between"
                    >
                        {overviewItems.map((item) => (
                            <Overview
                                key={item.key}
                                title={item.title}
                                Icon={item.Icon}
                                count={item.count}
                                bgColor={item.bgColor}
                                iconColor={item.iconColor}
                            />
                        ))}
                    </Grid>
                    <Grid size={12} >
                        <Table
                            columns={values.columns}
                            data={values.data}
                            loading={values.isLoading}
                            pagination={values.pagination}
                        />
                    </Grid>
                </>
            }
        </Grid>
    );
};

export default Evaluation;