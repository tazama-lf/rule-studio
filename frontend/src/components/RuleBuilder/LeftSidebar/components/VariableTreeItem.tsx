import React, { useState } from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { VariableTreeNode } from '../../../../hooks/RuleBuilder/useVariableTree';

interface VariableTreeItemProps {
  node: VariableTreeNode;
  level: number;
}

const VariableTreeItem: React.FC<VariableTreeItemProps> = ({ node, level }) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const hasChildren = node.children && node.children.length > 0;

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'object':
        return '#8b5cf6';
      case 'array':
        return '#ec4899';
      case 'string':
        return '#10b981';
      case 'number':
        return '#3b82f6';
      case 'boolean':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getTypeLabel = (type: string): string => {
    return `(${type})`;
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    if (node.isDraggable) {
      event.stopPropagation();
      event.dataTransfer.setData('variablePath', `{{ ${node.path} }}`);
      event.dataTransfer.setData('variableValue', JSON.stringify(node.value));
      event.dataTransfer.effectAllowed = 'copy';
    }
  };

  return (
    <>
      <Box
        sx={{
          pl: level * 3,
          py: 0.75,
          pr: 2,
          display: 'inline-flex',
          minWidth: '100%',
          width: 'fit-content',
          alignItems: 'center',
          gap: 0.75,
          cursor: node.isDraggable ? 'grab' : hasChildren ? 'pointer' : 'default',
          '&:hover': {
            backgroundColor: node.isDraggable ? 'action.hover' : hasChildren ? 'action.selected' : 'transparent',
          },
          '&:active': {
            cursor: node.isDraggable ? 'grabbing' : hasChildren ? 'pointer' : 'default',
          },
        }}
        draggable={node.isDraggable}
        onDragStart={handleDragStart}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {/* Expand/Collapse Icon - Fixed width for alignment */}
        <Box sx={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {hasChildren ? (
            <IconButton size="small" sx={{ p: 0, width: 20, height: 20 }}>
              {expanded ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ChevronRightIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          ) : null}
        </Box>

        {/* Drag Icon for draggable items - Fixed width for alignment */}
        <Box sx={{ width: 18, height: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {node.isDraggable && <DragIndicatorIcon sx={{ fontSize: 14, color: 'primary.main' }} />}
        </Box>

        {/* Key Name */}
        <Typography
          variant="body2"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.813rem',
            fontWeight: hasChildren ? 600 : 400,
            color: hasChildren ? 'primary.main' : 'text.primary',
            whiteSpace: 'nowrap',
          }}
        >
          {node.key}
        </Typography>

        {/* Type Label */}
        <Typography
          variant="caption"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.688rem',
            color: getTypeColor(node.type),
            opacity: 0.8,
            whiteSpace: 'nowrap',
          }}
        >
          {getTypeLabel(node.type)}
        </Typography>

        {/* Value for primitive types */}
        {node.isDraggable && node.type !== 'null' && (
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.688rem',
              color: 'text.secondary',
              whiteSpace: 'nowrap',
            }}
          >
            {node.type === 'string' ? `"${node.value}"` : String(node.value)}
          </Typography>
        )}
      </Box>

      {/* Children */}
      {hasChildren && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          {node.children!.map((child, index) => (
            <VariableTreeItem key={`${child.path}-${index}`} node={child} level={level + 1} />
          ))}
        </Collapse>
      )}
    </>
  );
};

export default VariableTreeItem;
