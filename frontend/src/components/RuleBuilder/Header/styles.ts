import { Box, Button, Toolbar as MuiToolbar } from '@mui/material';
import { styled } from '@mui/material/styles';

export const StyledToolbar = styled(MuiToolbar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1.5, 2),
  minHeight: '64px !important',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

export const ButtonGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

export const ActionButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  padding: theme.spacing(0.75, 2),
  borderRadius: theme.shape.borderRadius,
  minWidth: '120px',
}));
