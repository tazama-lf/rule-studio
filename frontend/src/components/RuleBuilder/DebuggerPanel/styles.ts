import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';

export const DebugContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: '#1e293b',
  color: '#e2e8f0',
  fontFamily: 'monospace',
  fontSize: '0.75rem',
}));

export const Header = styled(Box)(({ theme }) => ({
  backgroundColor: '#334155',
  padding: theme.spacing(1.5),
  borderBottom: '1px solid #475569',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

export const SectionHeader = styled(Box)(({ theme }) => ({
  backgroundColor: '#334155',
  padding: theme.spacing(1, 1.5),
  fontSize: '0.625rem',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid #475569',
  position: 'sticky',
  top: 0,
  zIndex: 1,
}));

export const VariablesSection = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  borderBottom: '1px solid #475569',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: '#1e293b',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#475569',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: '#64748b',
    },
  },
});

export const ConsoleSection = styled(Box)({
  height: '40%',
  backgroundColor: '#0f172a',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

export const LogsContainer = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  padding: '12px 16px',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: '#0f172a',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#334155',
    borderRadius: '4px',
  },
});

export const VariableRow = styled(Box)({
  display: 'table-row',
  '&:hover': {
    backgroundColor: '#334155',
  },
  borderBottom: '1px solid #334155',
});

export const VariableKey = styled(Box)({
  display: 'table-cell',
  padding: '12px 16px',
  color: '#60a5fa',
  width: '35%',
  verticalAlign: 'middle',
  fontWeight: 500,
  fontSize: '0.875rem',
});

export const VariableValue = styled(Box)({
  display: 'table-cell',
  padding: '12px 16px',
  color: '#4ade80',
  wordBreak: 'break-all',
  fontFamily: 'monospace',
  fontSize: '0.875rem',
  verticalAlign: 'middle',
});
