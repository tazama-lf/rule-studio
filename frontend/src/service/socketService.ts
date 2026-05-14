import { io, Socket } from 'socket.io-client';

interface ProgressUpdate {
    jobId: string;
    progress: number;
    processed: number;
    total: number;
    status: 'running' | 'completed' | 'failed';
    message?: string;
    timestamp?: string;
}

let socket: Socket | null = null;
let currentJobId: string | null = null;

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const connect = async (): Promise<void> => {
    if (socket?.connected) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        socket = io(`${baseUrl}/simulation`, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        const timeout = setTimeout(() => {
            reject(new Error('Socket connection timeout'));
        }, 10000);

        socket.once('connect', () => {
            clearTimeout(timeout);
            resolve();
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        socket.on('connect_error', (error) => {
            clearTimeout(timeout);
            console.error('Socket connection error:', error.message);
            reject(error);
        });

        socket.on('joinedJob', (data: { jobId: string; room: string }) => {
            console.log(`Joined job room: ${data.room}`);
        });
    });
};

export const joinRoom = async (jobId: string): Promise<void> => {
    try {
        if (!socket?.connected) {
            await connect();
        }

        if (currentJobId && currentJobId !== jobId) {
            socket?.emit('leaveJob', { jobId: currentJobId });
        }

        currentJobId = jobId;
        socket?.emit('joinJob', { jobId });
    } catch (error) {
        console.error('Failed to join room:', error);
        throw error;
    }
};

export const leaveRoom = (jobId: string): void => {
    socket?.emit('leaveJob', { jobId });
    console.log(`Leaving room for job: ${jobId}`);

    if (currentJobId === jobId) {
        currentJobId = null;
    }
};

export const getSocket = (): Socket | null => socket;

export const disconnect = (): void => {
    if (socket) {
        socket.disconnect();
        socket = null;
        currentJobId = null;
        console.log('Socket disconnected and cleaned up');
    }
};

export type { ProgressUpdate };