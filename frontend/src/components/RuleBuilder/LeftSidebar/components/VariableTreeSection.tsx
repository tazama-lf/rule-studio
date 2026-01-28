import React from 'react';
import { Typography, Divider } from '@mui/material';
import type { VariableTreeNode } from '../../../../hooks/RuleBuilder/useVariableTree';
import VariableTreeItem from './VariableTreeItem';

interface VariableTreeSectionProps {
  title: string | React.ReactNode;
  icon: React.ReactNode;
  color: string;
  nodes: VariableTreeNode[];
  emptyMessage?: string;
  showDivider?: boolean;
}

const VariableTreeSection: React.FC<VariableTreeSectionProps> = ({
  title,
  icon,
  color,
  nodes,
  emptyMessage = 'No variables available',
  showDivider = true,
}) => {
  return (
    <>
      <Typography
        variant="subtitle2"
        fontWeight={600}
        sx={{
          mb: 1.5,
          px: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          color,
        }}
      >
        {icon}
        {title}
      </Typography>

      {nodes.length > 0 ? (
        nodes.map((node, index) => <VariableTreeItem key={`${node.path}-${index}`} node={node} level={0} />)
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ px: 0.5, display: 'block', mb: 2 }}>
          {emptyMessage}
        </Typography>
      )}

      {showDivider && <Divider sx={{ my: 2 }} />}
    </>
  );
};

export default VariableTreeSection;
