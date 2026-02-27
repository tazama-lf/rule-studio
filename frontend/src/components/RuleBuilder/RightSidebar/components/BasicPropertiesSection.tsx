import React from 'react';
import { TextField, Divider } from '@mui/material';
import type { Node } from '@xyflow/react';
import { PropertyRow, SectionContainer, SectionTitle } from '../styles';
import { withCursorPreservation } from '../../../../utils/cursorPreservation';

interface BasicPropertiesSectionProps {
  selectedNode: Node | null;
  currentLabel: string;
  onLabelChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLabelBlur: () => void;
  templateDisplayName: string;
  isReadOnly: boolean;
  viewOnly: boolean;
}

const BasicPropertiesSection: React.FC<BasicPropertiesSectionProps> = ({
  selectedNode,
  currentLabel,
  onLabelChange,
  onLabelBlur,
  templateDisplayName,
  isReadOnly,
  viewOnly,
}) => {
  if (!selectedNode) return null;

  return (
    <>
      <SectionContainer>
        <SectionTitle>Basic Properties</SectionTitle>

        <PropertyRow>
          <TextField
            fullWidth
            label="Label"
            value={currentLabel}
            onChange={withCursorPreservation(onLabelChange)}
            onBlur={onLabelBlur}
            size="small"
            variant="outlined"
            placeholder={templateDisplayName}
            helperText={
              isReadOnly ? 'Start/End nodes cannot be renamed' : viewOnly ? 'View only mode' : 'Display name for this node'
            }
            disabled={isReadOnly || viewOnly}
          />
        </PropertyRow>
      </SectionContainer>
      <Divider />
    </>
  );
};

export default BasicPropertiesSection;
