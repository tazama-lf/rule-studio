import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { PropertyRow } from '../../styles';

interface FetchDBQueryFieldProps {
  currentValue: string;
  isDisabled: boolean;
  isExecuting: boolean;
  fieldError?: string;
  onOpenQueryEditor: () => void;
  onExecuteQuery: (query: string) => void;
}

const FetchDBQueryField: React.FC<FetchDBQueryFieldProps> = ({
  currentValue,
  isDisabled,
  isExecuting,
  fieldError,
  onOpenQueryEditor,
  onExecuteQuery,
}) => {
  const queryLineCount = currentValue ? (currentValue.match(/\n/g) || []).length + 1 : 0;
  const hasQuery = Boolean(currentValue?.trim());

  return (
    <React.Fragment>
      <PropertyRow>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            SQL Query
            <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>
              *
            </Typography>
          </Typography>
          
          <Button
            fullWidth
            variant="outlined"
            startIcon={<CodeIcon />}
            onClick={onOpenQueryEditor}
            disabled={isDisabled}
            sx={{
              justifyContent: 'flex-start',
              textAlign: 'left',
              py: 1.5,
              px: 2,
              borderColor: fieldError ? 'error.main' : 'divider',
              borderWidth: fieldError ? 2 : 1,
              '&:hover': {
                borderColor: fieldError ? 'error.dark' : 'primary.main',
                backgroundColor: 'action.hover',
              },
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
              <Typography variant="body2" fontWeight={500}>
                {hasQuery ? 'Edit SQL Query' : 'Write SQL Query'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {hasQuery ? `${queryLineCount} lines` : 'Click to open query editor'}
              </Typography>
            </Box>
          </Button>
          
          {fieldError && (
            <Typography variant="caption" color="error">
              {fieldError}
            </Typography>
          )}
          
          {!fieldError && (
            <Typography variant="caption" color="text.secondary">
              💡 Use Monaco editor to write and test your SQL query
            </Typography>
          )}
        </Box>
      </PropertyRow>

      {hasQuery && !isDisabled && (
        <PropertyRow>
          <Button
            fullWidth
            variant="contained"
            color="success"
            startIcon={<PlayArrowIcon />}
            onClick={() => onExecuteQuery(currentValue)}
            disabled={isExecuting}
            sx={{ py: 1 }}
          >
            {isExecuting ? 'Executing Query...' : 'Execute & Test Query'}
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
            Test your query before saving to see sample results
          </Typography>
        </PropertyRow>
      )}
    </React.Fragment>
  );
};

export default React.memo(FetchDBQueryField);
