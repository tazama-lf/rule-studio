import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRunSimulationMutation } from "../../../redux/Api/SendToDems";
import { joinRoom, leaveRoom, getSocket, type ProgressUpdate } from "../../../service/socketService";
import { toast } from "react-hot-toast";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TableActions from "../../../components/TableActions";
import useFilters from "../../../hooks/useFilters";
import { simulationTableData } from "../../../utils/Constants/data";
import { Paper } from "@mui/material";
import { Text } from "../../../components/Text";


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

type MediaType = "processed" | "alerts" | "hits" | "passed";

interface OverviewScore {
    processed: number;
    alerts: number;
    hits: number;
    passed: number;
}

const getMedia = (type: MediaType) => {
    const mediaConfig = {
        processed: {
            title: "Records Processed",
            icon: StorageRoundedIcon,
            bgColor: "#dbeafe",
            color: "#2563eb",
        },
        alerts: {
            title: "Alerts Generated",
            icon: WarningAmberRoundedIcon,
            bgColor: "#fee2e2",
            color: "red",
        },
        hits: {
            title: "Rule Hits",
            icon: TrendingUpRoundedIcon,
            bgColor: "#fef3c7",
            color: "#d97706",
        },
        passed: {
            title: "No-Hit Records",
            icon: TaskAltIcon,
            bgColor: "#dcfce7",
            color: "#16a34a",
        },
    };

    return mediaConfig[type];
};

const useEvaluationController = () => {
    const [runSimulation, { isLoading }] = useRunSimulationMutation();
    const currentJobIdRef = useRef<string | null>(null);
    const hasStartedRef = useRef(false);

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
        const startIndex = offset;
        const endIndex = offset + limit;
        return simulationTableData.slice(startIndex, endIndex);
    }, [offset, limit]);

    const pagination = useMemo(() => ({
        offset,
        limit,
        total,
        onPageChange: (page: number) => setOffset((page - 1) * limit),
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


    const overviewScore = useMemo<OverviewScore>(
        () => ({
            processed: 1247,
            alerts: 23,
            hits: 23,
            passed: 1224,
        }),
        []
    );

    const handleView = (_data: Record<string, unknown>) => {
    }

    const columns = [
        {
            label: 'Message ID',
            key: 'message_id'
        },
        {
            label: 'Transaction Type',
            key: 'txtp'
        },
        {
            label: 'Time',
            key: 'time'
        },
        {
            label: 'Outcome',
            key: 'outcome',
            render: (row: Record<string, unknown>) => {
                const isHit = row.outcome == 'Hit';
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
            label: "Actions",
            key: "actions",
            render: (row: Record<string, unknown>) => (
                <TableActions
                    onView={() => handleView(row)}
                />
            ),
        },
    ]

    const clearLogs = useCallback(() => setLogs([]), []);

    return {
        values: {
            simulationState,
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
