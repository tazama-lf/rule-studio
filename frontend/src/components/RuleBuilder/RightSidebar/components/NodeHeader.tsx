import React from 'react';
import { Box, Typography, Chip, Divider } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { SectionContainer } from '../styles';

interface NodeHeaderProps {
  templateDisplayName: string;
  isFunctionNode: boolean;
  description?: string;
}

const NodeHeader: React.FC<NodeHeaderProps> = ({ templateDisplayName, isFunctionNode, description }) => {
  return (
    <>
      <SectionContainer>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SettingsIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Node Properties
          </Typography>
        </Box>
        <Chip label={templateDisplayName} size="small" color="primary" variant="outlined" />
      </SectionContainer>

      <Divider />

      {isFunctionNode && description && (
        <>
          <SectionContainer>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Description
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </SectionContainer>
          <Divider />
        </>
      )}
    </>
  );
};

export default NodeHeader;
