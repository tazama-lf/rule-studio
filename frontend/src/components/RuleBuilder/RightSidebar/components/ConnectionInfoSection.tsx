import React from 'react';
import { Box, Chip, Divider } from '@mui/material';
import { SectionContainer, SectionTitle } from '../styles';

interface ConnectionInfoSectionProps {
  template: {
    displayName: string;
    handles: {
      source: boolean;
      target: boolean;
    };
  };
}

const ConnectionInfoSection: React.FC<ConnectionInfoSectionProps> = ({ template }) => {
  return (
    <>
      <Divider />
      <SectionContainer>
        <SectionTitle>Connections</SectionTitle>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {template.handles.target && <Chip label="Has Input" size="small" color="success" variant="outlined" />}
          {template.handles.source && <Chip label="Has Output" size="small" color="info" variant="outlined" />}
        </Box>
      </SectionContainer>
    </>
  );
};

export default ConnectionInfoSection;
