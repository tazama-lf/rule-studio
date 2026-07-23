import { Box } from "@mui/material";
import { Text } from "../../../components/Text";
import useEvaluationController from "./useEvaluationController";
import Grid from "@mui/material/Grid";
import { useMemo } from "react";
import Debugger, { type DebugLog } from "../../../components/Debugger";
import Loader from "../../../components/Loader";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import type { SvgIconComponent } from "@mui/icons-material";
import StatusCard from "../../../components/Cards/StatusCard";
import Table from "../../../components/Table";

interface OverviewProps {
    title: string;
    Icon: SvgIconComponent;
    count: number;
    bgColor?: string;
    iconColor?: string;
}

const Overview = ({ title, Icon, count, bgColor = '#f3f4f6', iconColor = '#6b7280' }: OverviewProps) => (
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
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="8px"
                    width={32}
                    height={32}
                    bgcolor={bgColor}
                    border="1px solid"
                    borderColor="divider"
                >
                    <Icon sx={{ fontSize: 18, color: iconColor }} />
                </Box>
                <Text color="text.ternary" weight="500" size="sub">
                    {title}
                </Text>
            </Box>
            <Text color={iconColor} size="header" weight="bold">
                {count.toLocaleString()}
            </Text>
        </Box>
    </Grid>
);

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
        return now.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }) + " " + now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    }, []);

    const replayDuration = "32s";

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
                    {/* Title + Simulation ID + Status */}
                    <Grid size={12} mt={3} mb={2}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                                <Text weight="bold" color="black" size="bigHeader">
                                    Simulation Results
                                </Text>
                                <Text color="text.ternary" size="sub" mt={0.5}>
                                    {values.simulationId}
                                </Text>
                            </Box>
                            <StatusCard
                                status="COMPLETED"
                                bullet={false}
                            />
                        </Box>
                    </Grid>

                    {/* Run date & Replay duration — single card */}
                    <Grid size={12} mt={2}>
                        <Box
                            display="flex"
                            borderRadius={1}
                            border="1px solid"
                            borderColor="divider"
                            overflow="hidden"
                        >
                            <Box sx={{ width: 4, bgcolor: "#4789f6", flexShrink: 0 }} />
                            <Box display="flex" flex={1} p={2.5} gap={8}>
                                <Box>
                                    <Text color="text.ternary" weight="600" size="sub" sx={{ letterSpacing: 1, textTransform: "uppercase" }}>
                                        Run Date & Time
                                    </Text>
                                    <Text color="black" size="body" weight="500" mt={0.5}>
                                        {runDateTime}
                                    </Text>
                                </Box>
                                <Box>
                                    <Text color="text.ternary" weight="600" size="sub" sx={{ letterSpacing: 1, textTransform: "uppercase" }}>
                                        Replay Duration
                                    </Text>
                                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                        <AccessTimeIcon sx={{ fontSize: 16, color: "text.ternary" }} />
                                        <Text color="black" size="body" weight="500">
                                            {replayDuration}
                                        </Text>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Overview stat cards */}
                    <Grid container spacing={3} my={3} size={12}>
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

                    {/* Results table */}
                    <Grid size={12}>
                        <Box
                            border="1px solid"
                            borderColor="divider"
                            borderRadius={1}
                            p={2}
                        >
                            <Text weight="bold" color="black" size="main" mb={1}>
                                Simulation Results
                            </Text>
                            <Table
                                columns={values.columns}
                                data={values.data}
                                loading={values.isLoading}
                                pagination={values.pagination}
                            />
                        </Box>
                    </Grid>
                </>
            }
        </Grid>
    );
};

export default Evaluation;