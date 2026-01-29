import { Box, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

interface SidebarContainerProps {
  collapsed: boolean;
}

export const SidebarContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})<SidebarContainerProps>(({ theme, collapsed }) => ({
  width: collapsed ? 0 : 380,
  minWidth: collapsed ? 0 : 380,
  maxWidth: collapsed ? 0 : 380,
  backgroundColor: theme.palette.background.paper,
  borderLeft: collapsed ? 'none' : `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: collapsed ? 'hidden' : 'auto',
  flexShrink: 0,
  transition: theme.transitions.create(['width', 'min-width', 'max-width'], {
    duration: theme.transitions.duration.standard,
    easing: theme.transitions.easing.easeInOut,
  }),
  position: 'relative',
}));

export const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  zIndex: 10,
}));

export const SectionContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const SectionTitle = styled(Box)(({ theme }) => ({
  fontSize: '0.875rem',
  fontWeight: 600,
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  marginBottom: theme.spacing(1.5),
  letterSpacing: '0.5px',
}));

export const PropertyRow = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '&:last-child': {
    marginBottom: 0,
  },
}));

export const EmptyState = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: theme.spacing(4),
  color: theme.palette.text.secondary,
  textAlign: 'center',
}));
