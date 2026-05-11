import { Box, Typography } from '@mui/material';
import { memo, useEffect, useRef } from 'react';
import { ConsoleSection, DebugContainer, LogsContainer, SectionHeader } from './styles';

export interface DebugLog {
    time: string;
    message: string;
    type: 'info' | 'error' | 'success';
}

interface DebuggerProps {
    logs: DebugLog[];
    isPlaying: boolean;
    onClear?: () => void;
}

const Debugger = ({
    logs,
}: DebuggerProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    return (
        <DebugContainer>
            <ConsoleSection>
                <SectionHeader>
                    {'>'} Execution Logs
                </SectionHeader>
                <LogsContainer>
                    {logs.length === 0 && (
                        <Typography variant="caption" color="#475569" fontStyle="italic">
                            Waiting for logs...
                        </Typography>
                    )}
                    {logs.map((log, index) => (
                        <Box key={index} display="flex" gap={1.5} mb={1}>
                            <Typography
                                variant="caption"
                                component="span"
                                sx={{
                                    color: '#64748b',
                                    flexShrink: 0,
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                }}
                            >
                                [{log.time}]
                            </Typography>
                            <Typography
                                variant="caption"
                                component="span"
                                sx={{
                                    color: log.type === 'error' ? '#d32f2f' :
                                        log.type === 'success' ? '#4caf50' :
                                            'static.ternary',
                                    fontSize: '0.75rem',
                                    lineHeight: 1.5,
                                }}
                            >
                                {log.message}
                            </Typography>
                        </Box>
                    ))}
                    <div ref={scrollRef}></div>
                </LogsContainer>
            </ConsoleSection>
        </DebugContainer>
    );
};

export default memo(Debugger);

