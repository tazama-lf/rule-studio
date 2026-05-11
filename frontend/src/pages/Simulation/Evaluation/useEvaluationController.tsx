import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRunSimulationMutation } from "../../../redux/Api/SendToDems";
import { joinRoom, leaveRoom, getSocket, type ProgressUpdate } from "../../../service/socketService";
import { toast } from "react-hot-toast";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import useFilters from "../../../hooks/useFilters";
import { simulationTableData } from "../../../utils/Constants/data";
import { Button, Paper } from "@mui/material";
import { Text } from "../../../components/Text";
import SimulationAnalysisModal from "../../../components/Modals/SimulationAnalysis";
import { useModal } from "../../../contexts/ModalContext";
import { useLazyGetSimulationStatsQuery } from "../../../redux/Api/RuleSimulation";


interface SimulationState {
    jobId: string | null;
    progress: number;
    processed: number;
    total: number;
    status: null | 'running' | 'completed' | 'failed';
}

export interface LogEntry {
    timestamp: string;
    level: 'info' | 'success' | 'error' | 'debug';
    message: string;
}

export interface SimulationTableRow {
    message_id: string;
    txtp: string;
    time: string;
    outcome: string;
    score: number;
    reason: string;
}

type MediaType = "total" | "evaluated" | "alerts" | "notAlerts";

interface OverviewScore {
    total: number;
    evaluated: number;
    alerts: number;
    notAlerts: number;
}

const getMedia = (type: MediaType) => {
    const mediaConfig = {
        total: {
            title: "Total Records",
            icon: StorageRoundedIcon,
            bgColor: "#dbeafe",
            color: "#2563eb",
        },
        evaluated: {
            title: "Records Evaluated",
            icon: CheckCircleOutlineIcon,
            bgColor: "#dcfce7",
            color: "#16a34a",
        },
        alerts: {
            title: "Alerts Generated",
            icon: WarningAmberRoundedIcon,
            bgColor: "#fee2e2",
            color: "red",
        },
        notAlerts: {
            title: "Alerts Not Generated",
            icon: RemoveCircleOutlineIcon,
            bgColor: "#fef3c7",
            color: "#d97706",
        },
    };

    return mediaConfig[type];
};

const useEvaluationController = () => {
    const [runSimulation, { isLoading }] = useRunSimulationMutation();
    const currentJobIdRef = useRef<string | null>(null);
    const hasStartedRef = useRef(false);
    const { open } = useModal();

    const [simulationState, setSimulationState] = useState<SimulationState>({
        jobId: null,
        progress: 0,
        processed: 0,
        total: 0,
        status: null,
    });

    const total = simulationTableData.length;

    const { offset, limit, setOffset } = useFilters();

    const paginatedData = useMemo(() => {
        const start = offset * limit;
        return simulationTableData.slice(start, start + limit);
    }, [offset, limit]);

    const pagination = useMemo(() => ({
        offset,
        limit,
        total,
        onPageChange: (page: number) => setOffset(page - 1),
    }), [offset, limit, total, setOffset]);

    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = useCallback((level: LogEntry["level"], message: string) => {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
        };
        setLogs((prev) => [...prev, logEntry]);
    }, []);

    const handleProgressUpdate = useCallback((update: ProgressUpdate) => {
        setSimulationState((prev) => ({
            ...prev,
            progress: update.progress,
            processed: update.processed,
            total: update.total,
            status: update.status,
        }));

        const progressMessage = `Progress: ${update.progress}% (${update.processed}/${update.total}) - ${update.status}`;
        addLog("info", update.message || progressMessage);

        if (update.status === "completed") {
            toast.success(
                `Simulation completed! Processed ${update.processed}/${update.total} messages`
            );
            addLog(
                "success",
                `Simulation completed! Processed ${update.processed}/${update.total} messages`
            );
        } else if (update.status === "failed") {
            toast.error("Simulation failed.");
            addLog("error", "Simulation failed.");
        }
    }, [addLog]);

    const startSimulation = useCallback(
        async (tableNames: string[]) => {
            try {
                setLogs([]);
                addLog("info", `Starting simulation with tables: ${tableNames.join(", ")}`);

                setSimulationState({
                    jobId: null,
                    progress: 0,
                    processed: 0,
                    total: 0,
                    status: null,
                });

                const response = await runSimulation({ tableNames }).unwrap();
                const { jobId } = response;

                addLog("success", `Simulation job created with ID: ${jobId}`);

                setSimulationState((prev) => ({
                    ...prev,
                    jobId,
                    status: "running",
                }));
                currentJobIdRef.current = jobId;

                await joinRoom(jobId);
                addLog("info", `Connected to simulation room: ${jobId}`);

                const socket = getSocket();
                if (socket) {
                    socket.on("simulationProgress", handleProgressUpdate);
                }

                toast.success("Simulation started successfully!");
            } catch (error: unknown) {
                let errorMessage = "Failed to start simulation";
                if (error instanceof Error && error.message?.includes("Socket connection")) {
                    errorMessage = "Failed to connect to simulation server";
                } else if (
                    typeof error === "object" &&
                    error !== null &&
                    "data" in error &&
                    typeof error.data === "object" &&
                    error.data !== null &&
                    "message" in error.data
                ) {
                    errorMessage = String(error.data.message);
                }

                addLog("error", errorMessage);
                toast.error(errorMessage);
                setSimulationState((prev) => ({ ...prev, status: "failed" }));
            }
        },
        [runSimulation, addLog, handleProgressUpdate]
    );

    useEffect(() => {
        if (!hasStartedRef.current) {
            hasStartedRef.current = true;
            // eslint-disable-next-line react-hooks/set-state-in-effect
            startSimulation(["sim001"]);
        }

        return () => {
            if (currentJobIdRef.current) {
                leaveRoom(currentJobIdRef.current);

                const socket = getSocket();
                socket?.off("simulationProgress", handleProgressUpdate);
            }
        };
    }, [startSimulation, handleProgressUpdate]);


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [getSimulationStats, { data: statsData }] = useLazyGetSimulationStatsQuery();

    const overviewScore = useMemo<OverviewScore>(
        () => ({
            total: statsData?.total_no_of_records ?? 0,
            evaluated: statsData?.records_evaluated ?? 0,
            alerts: statsData?.alerts_generated ?? 0,
            notAlerts: statsData?.alerts_not_generated ?? 0,
        }),
        [statsData]
    );

    const handleView = (row: Record<string, unknown>) => {
        const analysisData = {
            messageId: row.message_id as string,
            outcome: row.outcome as string,
            score: row.score as number,
            triggeredRules: (row.triggered_rules as Array<{ ruleId: string; description: string; status: string }>) || [],
            triggeredTypologies: (row.triggered_typologies as Array<{ name: string; score: number; rules: Array<{ ruleId: string; weight: number; subRef: string }> }>) || [],
        };
        open(
            'Simulation Analysis',
            <SimulationAnalysisModal data={analysisData} />,
            null,
            { maxWidth: 'md' },
        );
    }

    const columns = [
        {
            label: 'Message ID',
            key: 'message_id'
        },
        {
            label: 'Message Type',
            key: 'txtp',
            render: (row: Record<string, unknown>) => (
                <Paper
                    variant="outlined"
                    sx={{
                        display: 'inline-block',
                        borderRadius: 1,
                        px: 1.2,
                        py: 0.3,
                        bgcolor: '#f1f5f9',
                        borderColor: '#e2e8f0',
                    }}
                >
                    <Text
                        size="sub"
                        sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#334155' }}
                    >
                        {row.txtp as string}
                    </Text>
                </Paper>
            ),
        },
        {
            label: 'Time',
            key: 'time'
        },
        {
            label: 'Outcome',
            key: 'outcome',
            render: (row: Record<string, unknown>) => {
                const isHit = row.outcome === 'Hit';
                return (
                    <Paper
                        variant="outlined"
                        sx={{
                            display: 'inline-block',
                            borderRadius: 4,
                            px: 1.8,
                            py: 0.3,
                            border: 0,
                            bgcolor: !isHit ? '#dcfce7' : 'error.main',
                        }}
                    >
                        <Text
                            size="sub"
                            weight={'600'}
                            sx={{
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap',
                                color: !isHit ? 'static.darkGreen' : 'white'
                            }}
                        >
                            {row.outcome as string}
                        </Text>
                    </Paper>
                );
            }
        },
        {
            label: 'Score',
            key: 'score'
        },
        {
            label: 'Reason',
            key: 'reason'
        },
        {
            label: "Action",
            key: "actions",
            render: (row: Record<string, unknown>) => (
                <Button
                    variant="outlined"
                    size="small"
                    sx={{
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        borderColor: '#e2e8f0',
                        color: '#334155',
                        '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
                    }}
                    onClick={() => handleView(row)}
                >
                    View Details
                </Button>
            ),
        },
    ]

    const clearLogs = useCallback(() => setLogs([]), []);

    return {
        values: {
            simulationState,
            simulationId: simulationState.jobId,
            isLoading,
            logs,
            overviewScore,
            columns,
            data: paginatedData,
            pagination
        },
        functions: {
            startSimulation,
            clearLogs,
            getMedia,
        },
    };
};

export default useEvaluationController;
