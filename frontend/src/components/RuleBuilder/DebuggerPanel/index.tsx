import React, { useEffect, useRef } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import {
  DebugContainer,
  Header,
  SectionHeader,
  VariablesSection,
  ConsoleSection,
  LogsContainer,
  VariableRow,
  VariableKey,
  VariableValue,
} from './styles';

export interface DebugLog {
  time: string;
  message: string;
  type: 'info' | 'error';
}

interface DebuggerPanelProps {
  variables: Record<string, unknown>;
  logs: DebugLog[];
  currentNodeId?: string;
  isPlaying: boolean;
}

const DebuggerPanel: React.FC<DebuggerPanelProps> = ({
  variables,
  logs,
  currentNodeId,
  isPlaying,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs when new log is added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const formatValue = (value: unknown): string => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <DebugContainer>
      {/* Header */}
      <Header>
        <Box display="flex" alignItems="center" gap={1}>
          {isPlaying ? (
            <PlayArrowIcon sx={{ fontSize: 16, color: '#10b981' }} />
          ) : (
            <PauseIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
          )}
          <Typography
            variant="caption"
            fontWeight={700}
            sx={{ color: isPlaying ? '#10b981' : '#f59e0b' }}
          >
            STATUS: {isPlaying ? 'RUNNING' : 'IDLE'}
          </Typography>
        </Box>
        {currentNodeId && isPlaying && (
          <Chip
            label={`Node: ${currentNodeId}`}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.625rem',
              bgcolor: '#3b82f6',
              color: 'white',
            }}
          />
        )}
      </Header>

      {/* Variables Table */}
      <VariablesSection>
        <SectionHeader>Variables Scope</SectionHeader>
        {Object.keys(variables).length === 0 ? (
          <Box p={3} textAlign="center" color="#64748b" fontStyle="italic">
            <Typography variant="caption">
              No variables captured yet.
              <br />
              Run the flow to populate.
            </Typography>
          </Box>
        ) : (
          <Box component="table" width="100%" sx={{ borderCollapse: 'collapse', display: 'table' }}>
            <tbody style={{ display: 'table-row-group' }}>
              {Object.entries(variables).map(([key, value]) => (
                <VariableRow key={key}>
                  <VariableKey>{key}</VariableKey>
                  <VariableValue>{formatValue(value)}</VariableValue>
                </VariableRow>
              ))}
            </tbody>
          </Box>
        )}
      </VariablesSection>

      {/* Console Logs */}
      <ConsoleSection>
        <SectionHeader sx={{ borderTop: '1px solid #475569' }}>
          Console Output
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
                  color: log.type === 'error' ? '#f87171' : '#e2e8f0',
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

export default DebuggerPanel;
