import React from 'react';
import { Typography, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

interface BeforeAllSectionProps {
  onEdit: () => void;
  viewOnly?: boolean;
}

export const BeforeAllSection: React.FC<BeforeAllSectionProps> = ({ onEdit, viewOnly = false }) => {
  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Setup code that runs once before all test cases
      </Typography>
      <Button
        variant="outlined"
        startIcon={<EditIcon />}
        onClick={onEdit}
        fullWidth
        disabled={viewOnly}
      >
        Edit beforeAll Code
      </Button>
    </>
  );
};
