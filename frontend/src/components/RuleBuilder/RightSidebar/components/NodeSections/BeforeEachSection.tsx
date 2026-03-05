import React from 'react';
import { Typography, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

interface BeforeEachSectionProps {
  onEdit: () => void;
  viewOnly?: boolean;
}

export const BeforeEachSection: React.FC<BeforeEachSectionProps> = ({ onEdit, viewOnly = false }) => {
  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Setup code that runs before each test case
      </Typography>
      <Button
        variant="outlined"
        startIcon={<EditIcon />}
        onClick={onEdit}
        fullWidth
        disabled={viewOnly}
      >
        Edit beforeEach Code
      </Button>
    </>
  );
};
