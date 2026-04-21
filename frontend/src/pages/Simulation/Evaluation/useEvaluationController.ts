import { useEffect, useRef, useState } from "react";
import { useRunSimulationMutation } from "../../../redux/Api/SendToDems";
import { joinRoom, leaveRoom, getSocket, type ProgressUpdate } from "../../../service/socketService";
import { toast } from "react-hot-toast";

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

    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = (level: LogEntry['level'], message: string) => {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
        };
        setLogs(prev => [...prev, logEntry]);
    };

    const handleProgressUpdate = (update: ProgressUpdate) => {
        setSimulationState(prev => ({
            ...prev,
            progress: update.progress,
            processed: update.processed,
            total: update.total,
            status: update.status,
        }));

        // Add progress update to logs
        const progressMessage = `Progress: ${update.progress}% (${update.processed}/${update.total}) - ${update.status}`;
        addLog('info', update.message || progressMessage);

        if (update.status === 'completed') {
            toast.success(`Simulation completed! Processed ${update.processed}/${update.total} messages`);
            addLog('success', `Simulation completed! Processed ${update.processed}/${update.total} messages`);
        } else if (update.status === 'failed') {
            toast.error('Simulation failed.');
            addLog('error', 'Simulation failed.');
        }
    };

    const startSimulation = async (tableNames: string[]) => {
        try {
            // Clear previous logs
            setLogs([]);
            addLog('info', `Starting simulation with tables: ${tableNames.join(', ')}`);

            setSimulationState({
                jobId: null,
                progress: 0,
                processed: 0,
                total: 0,
                status: null,
            });

            const response = await runSimulation({ tableNames }).unwrap();
            const { jobId } = response;

            addLog('success', `Simulation job created with ID: ${jobId}`);

            setSimulationState(prev => ({
                ...prev,
                jobId,
                status: 'running',
            }));
            currentJobIdRef.current = jobId;

            await joinRoom(jobId);
            addLog('info', `Connected to simulation room: ${jobId}`);

            const socket = getSocket();
            if (socket) {
                socket.on('simulationProgress', handleProgressUpdate);
            }

            toast.success('Simulation started successfully!');
        } catch (error: any) {
            let errorMessage = 'Failed to start simulation';
            if (error?.message?.includes('Socket connection')) {
                errorMessage = 'Failed to connect to simulation server';
            } else if (error?.data?.message) {
                errorMessage = error.data.message;
            }

            addLog('error', errorMessage);
            toast.error(errorMessage);
            setSimulationState(prev => ({ ...prev, status: 'failed' }));
        }
    };

    useEffect(() => {
        if (!hasStartedRef.current) {
            hasStartedRef.current = true;
            startSimulation(['sim001']);
        }

        return () => {
            if (currentJobIdRef.current) {
                leaveRoom(currentJobIdRef.current);

                const socket = getSocket();
                socket?.off('simulationProgress', handleProgressUpdate);
            }
        };
    }, []);

    return {
        values: {
            simulationState,
            isLoading,
            logs,
        },
        functions: {
            startSimulation,
            clearLogs: () => setLogs([]),
        }
    };
};

export default useEvaluationController;
