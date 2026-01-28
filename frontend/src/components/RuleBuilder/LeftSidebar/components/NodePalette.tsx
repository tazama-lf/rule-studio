import React from 'react';
import { CardContent, Box, Typography, Chip } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import LockIcon from '@mui/icons-material/Lock';
import { NodeCard } from '../styles';
import type { NodeTemplate } from '../../../../hooks/RuleBuilder/useNodePalette';

interface NodePaletteProps {
  nodes: NodeTemplate[];
  onDragStart: (event: React.DragEvent<HTMLDivElement>, nodeType: string, mode?: string) => void;
}

const NodePalette: React.FC<NodePaletteProps> = ({ nodes, onDragStart }) => {
  const isNonDraggable = (nodeType: string): boolean => {
    return nodeType === 'Start' || nodeType === 'End';
  };

  return (
    <>
      {nodes.map((node) => {
        let nodeType = node.nodeType || node.type || '';
        if (nodeType.includes('::')) {
          [nodeType] = nodeType.split('::');
        }
        const nonDraggable = isNonDraggable(nodeType);
        return (
        <NodeCard
          key={`${nodeType}-${node.mode || 'default'}`}
          elevation={1}
          nodecolor={node.color || '#gray'}
          draggable={!nonDraggable}
          onDragStart={(e) => onDragStart(e, nodeType, node.mode)}
          sx={{
            opacity: nonDraggable ? 0.6 : 1,
            cursor: nonDraggable ? 'not-allowed' : 'grab',
            '&:hover': {
              transform: nonDraggable ? 'none' : 'translateY(-2px)',
            },
          }}
        >
          <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 }, boxSizing: 'border-box' }}>
            <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={0.5}>
              <Box flex={1} minWidth={0} sx={{ overflow: 'hidden' }}>
                <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                  <Typography variant="body2" fontWeight={500} color="text.primary" sx={{ wordBreak: 'break-word' }}>
                    {node.label}
                  </Typography>
                  {nonDraggable && (
                    <Chip
                      label="Already present"
                      size="small"
                      icon={<LockIcon />}
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        '& .MuiChip-label': { px: 0.75 },
                        '& .MuiChip-icon': { fontSize: 12 },
                      }}
                    />
                  )}
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    wordBreak: 'break-word',
                    lineHeight: 1.3,
                    pr: 0.5,
                  }}
                >
                  {node.description}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" mt={1}>
              {nonDraggable ? (
                <>
                  <LockIcon sx={{ fontSize: 14, color: 'text.disabled', mr: 0.5 }} />
                  <Typography variant="caption" color="text.disabled">
                    Already in canvas
                  </Typography>
                </>
              ) : (
                <>
                  <DragIndicatorIcon sx={{ fontSize: 14, color: 'text.disabled', mr: 0.5 }} />
                  <Typography variant="caption" color="text.disabled">
                    Drag to canvas
                  </Typography>
                </>
              )}
            </Box>
          </CardContent>
        </NodeCard>
        );
      })}
    </>
  );
};

export default NodePalette;
