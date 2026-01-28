import React from 'react';
import { Typography } from '@mui/material';

interface NodeHeaderProps {
  isSpecialNode: boolean;
  label: string;
  displayName?: string;
  nodeType: string;
}

export const NodeHeader: React.FC<NodeHeaderProps> = ({
  isSpecialNode,
  label,
  displayName,
  nodeType,
}) => {
  if (isSpecialNode) {
    return (
      <Typography
        sx={{
          fontSize: '1rem',
          fontWeight: 600,
          color: 'text.primary',
          textAlign: 'center',
          padding: '12px 16px',
        }}
      >
        {label || displayName || 'Node'}
      </Typography>
    );
  }

  return (
    <>
      <Typography
        sx={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'text.primary',
          textAlign: 'center',
        }}
      >
        {displayName || nodeType}
      </Typography>
    </>
  );
};
