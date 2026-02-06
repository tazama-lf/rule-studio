import { Box, Card, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

interface SidebarContainerProps {
  mode: 'main' | 'modal';
  collapsed: boolean;
  activeTab: number;
}

export const SidebarContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'mode' && prop !== 'collapsed' && prop !== 'activeTab',
})<SidebarContainerProps>(({ theme, mode, collapsed, activeTab }) => {
  const getExpandedWidth = () => {
    if (activeTab === 0) {
      return mode === 'main' ? 340 : 300;
    }
    return mode === 'main' ? 380 : 340;
  };

  return {
    width: collapsed ? 60 : getExpandedWidth(),
    minWidth: collapsed ? 60 : getExpandedWidth(),
    maxWidth: collapsed ? 60 : getExpandedWidth(),
    backgroundColor: theme.palette.grey[50],
    borderRight: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    flexShrink: 0,
    transition: theme.transitions.create(['width', 'min-width', 'max-width'], {
      duration: theme.transitions.duration.standard,
      easing: theme.transitions.easing.easeInOut,
    }),
  };
});

export const ToggleButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: 16,
  right: -20,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  width: 40,
  height: 40,
  zIndex: 10,
  boxShadow: theme.shadows[2],
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    boxShadow: theme.shadows[4],
  },
  transition: theme.transitions.create(['background-color', 'color'], {
    duration: theme.transitions.duration.shorter,
  }),
}));

export const NodeCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'nodecolor',
})<{ nodecolor: string }>(({ theme, nodecolor }) => ({
  cursor: 'grab',
  marginBottom: theme.spacing(1.5),
  borderLeft: `4px solid ${nodecolor || theme.palette.grey[400]}`,
  transition: 'all 0.2s ease',
  width: '100%',
  maxWidth: '100%',
  overflow: 'hidden',
  boxSizing: 'border-box',
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateX(4px)',
  },
  '&:active': {
    cursor: 'grabbing',
  },
}));

export const ScrollableList = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  overflowX: 'auto',
  padding: theme.spacing(1.5),
  width: '100%',
  height: '100%',
  boxSizing: 'border-box',
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: theme.palette.grey[100],
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.grey[400],
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: theme.palette.grey[500],
    },
  },
}));
