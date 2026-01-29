import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useValidationContext } from '../../../validation/context';

interface ValidationErrorModalProps {
  open: boolean;
  onClose: () => void;
}

export const ValidationErrorModal: React.FC<ValidationErrorModalProps> = ({ open, onClose }) => {
  const { getAllErrors, getErrorCount } = useValidationContext();
  const errors = getAllErrors();

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ErrorOutlineIcon color="error" />
          <Typography variant="h6" component="span">
            Validation Errors
          </Typography>
          <Chip 
            label={`${getErrorCount()} ${getErrorCount() === 1 ? 'node' : 'nodes'}`} 
            color="error" 
            size="small"
            sx={{ ml: 'auto' }}
          />
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {errors.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No validation errors found
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {errors.map((error, index) => (
              <React.Fragment key={error.nodeId}>
                <ListItem
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    py: 2,
                    px: 2,
                    backgroundColor: 'error.lighter',
                    borderRadius: 1,
                    mb: index < errors.length - 1 ? 2 : 0,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, width: '100%' }}>
                    <Typography variant="subtitle1" fontWeight={600} color="error.dark">
                      {error.nodeName}
                    </Typography>
                    <Chip 
                      label={error.nodeType} 
                      size="small" 
                      variant="outlined"
                      sx={{ borderColor: 'error.main', color: 'error.main' }}
                    />
                  </Box>

                  <Box sx={{ width: '100%', pl: 2 }}>
                    {Object.entries(error.errors).map(([field, message]) => (
                      <Box 
                        key={field} 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          component="span"
                          sx={{ 
                            fontWeight: 500,
                            minWidth: '100px',
                            color: 'text.primary',
                          }}
                        >
                          {field}:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          component="span"
                          color="error"
                        >
                          {message}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
