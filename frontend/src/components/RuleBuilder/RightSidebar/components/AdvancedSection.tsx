import React from 'react';
import { Typography, Divider } from '@mui/material';
import type { Node } from '@xyflow/react';
import { PropertyRow, SectionContainer, SectionTitle } from '../styles';

interface NodeData {
  nodeType?: string;
  [key: string]: unknown;
}

interface AdvancedSectionProps {
  selectedNode: Node;
}

const AdvancedSection: React.FC<AdvancedSectionProps> = ({ selectedNode }) => {
  const nodeData = selectedNode.data as NodeData | undefined;

  return (
    <>
      <Divider />
      <SectionContainer sx={{ backgroundColor: 'grey.50' }}>
        <SectionTitle>Advanced</SectionTitle>

        <PropertyRow>
          <Typography variant="caption" color="text.secondary">
            Position: X: {Math.round(selectedNode.position.x)}, Y: {Math.round(selectedNode.position.y)}
          </Typography>
        </PropertyRow>

        <PropertyRow>
          <Typography variant="caption" color="text.secondary">
            Type: {nodeData?.nodeType}
          </Typography>
        </PropertyRow>
      </SectionContainer>
    </>
  );
};

export default AdvancedSection;
