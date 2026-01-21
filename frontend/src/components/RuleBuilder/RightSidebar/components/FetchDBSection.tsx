import React from 'react';
import { TextField, Typography, Divider } from '@mui/material';
import type { Node } from '@xyflow/react';
import { PropertyRow, SectionContainer, SectionTitle } from '../styles';

interface FetchDBSectionProps {
  currentParams: Record<string, string>;
  onParamChange: (paramKey: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onParamBlur?: () => void;
  onDrop: (paramKey: string) => (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | HTMLTextAreaElement>>;
  isReadOnly: boolean;
  viewOnly: boolean;
  allNodes?: Node[];
  getFieldError?: (fieldName: string) => string | undefined;
}

const FetchDBSection: React.FC<FetchDBSectionProps> = ({
  currentParams,
  onParamChange,
  onParamBlur,
  onDrop,
  onDragOver,
  inputRefs: inputRefsRef,
  isReadOnly,
  viewOnly,
  getFieldError,
}) => {
  return (
    <>
      <Divider />
      <SectionContainer>
        <SectionTitle>Database Query</SectionTitle>

        {/* Query Input */}
        <PropertyRow>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            SQL Query
            <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>
              *
            </Typography>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={12}
            value={currentParams.query ?? ''}
            onChange={onParamChange('query')}
            onBlur={onParamBlur}
            disabled={isReadOnly || viewOnly}
            placeholder="Enter SQL query..."
            error={!!getFieldError?.('query')}
            helperText={getFieldError?.('query') || '💡 Drag global variables into the query'}
            onDrop={onDrop('query')}
            onDragOver={onDragOver}
            inputRef={(el: HTMLInputElement | null) => {
              if (el) {
                inputRefsRef.current['query'] = el;
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                backgroundColor: 'background.paper',
                transition: 'all 0.2s',
              },
              '& .MuiOutlinedInput-input': {
                ...((currentParams.query &&
                  currentParams.query.length > 0 &&
                  (currentParams.query.includes('RuleRequest.') || currentParams.query.includes('RuleConfig.'))) && {
                  background: `linear-gradient(to bottom, 
                    transparent 0%, 
                    transparent calc(100% - 2px), 
                    #4caf50 calc(100% - 2px), 
                    #4caf50 100%
                  )`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                }),
              },
            }}
          />
        </PropertyRow>

        {/* Result Variable */}
        <PropertyRow>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Store Result In
            <Typography component="span" sx={{ color: 'error.main', ml: 0.5 }}>
              *
            </Typography>
          </Typography>
          <TextField
            fullWidth
            value={currentParams.resultVar ?? currentParams.variable ?? ''}
            onChange={onParamChange('resultVar')}
            onBlur={onParamBlur}
            disabled={isReadOnly || viewOnly}
            placeholder="Variable name (e.g., dbResult)"
            error={!!getFieldError?.('resultVar')}
            helperText={getFieldError?.('resultVar') || '💡 Variable name to store query results'}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'monospace',
                fontSize: '0.875rem',
              },
            }}
          />
        </PropertyRow>
      </SectionContainer>
    </>
  );
};

export default FetchDBSection;
