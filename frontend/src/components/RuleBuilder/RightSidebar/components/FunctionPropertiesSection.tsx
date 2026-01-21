import React from 'react';
import { Divider, Typography } from '@mui/material';
import { PropertyRow, SectionContainer, SectionTitle } from '../styles';

interface FunctionPropertiesSectionProps {
  template: {
    description?: string;
  };
}

const FunctionPropertiesSection: React.FC<FunctionPropertiesSectionProps> = ({ template }) => {
  if (!template.description) return null;
  
  return (
    <>
      <Divider />
      <SectionContainer>
        <SectionTitle>Function Properties</SectionTitle>
        <PropertyRow>
          <Typography variant="body2" color="text.secondary">
            {template.description}
          </Typography>
        </PropertyRow>
      </SectionContainer>
    </>
  );
};

export default FunctionPropertiesSection;
