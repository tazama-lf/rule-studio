import React, { useState } from 'react';
import { Box, Typography, IconButton, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { NodeTemplate } from '../../../hooks/RuleBuilder/useNodePalette';

interface NodeParametersProps {
  template: NodeTemplate;
  params: Record<string, string>;
}

interface NodeInput {
  key: string;
  label: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export const NodeParameters: React.FC<NodeParametersProps> = ({ template, params }) => {
  const [expanded, setExpanded] = useState(false);

  if (!template || !template.inputs || template.inputs.length === 0) {
    return null;
  }

  const toggleExpanded = () => setExpanded((prev) => !prev);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
          Parameters
        </Typography>
        <IconButton size="small" onClick={toggleExpanded}>
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0.5 }}>
          {template.inputs.map((input: NodeInput) => {
            const value = params[input.key] || input.defaultValue;
            return (
              <Box
                key={input.key}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  {input.label}:
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    color: 'text.primary',
                    fontFamily: value && value.length > 20 ? 'monospace' : 'inherit',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {value}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Collapse>
    </>
  );
};
