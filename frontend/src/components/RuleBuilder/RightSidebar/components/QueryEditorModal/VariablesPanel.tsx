import React from 'react';
import { Box, Typography } from '@mui/material';
import type { VariableTreeNode } from '../../../../../hooks/RuleBuilder/useVariableTree';
import VariableTree from '../../../LeftSidebar/components/VariableTree';

interface VariablesPanelProps {
  localVarsTree: VariableTreeNode[];
  loopVarsTree: VariableTreeNode[];
  loopContext: {
    isInLoopScope: boolean;
    loopNames: string[];
  };
  ruleRequestTree: VariableTreeNode[];
  ruleConfigTree: VariableTreeNode[];
  ruleResultTree: VariableTreeNode[];
}

const VariablesPanel: React.FC<VariablesPanelProps> = ({
  localVarsTree,
  loopVarsTree,
  loopContext,
  ruleRequestTree,
  ruleConfigTree,
  ruleResultTree,
}) => {
  return (
    <Box 
      sx={{ 
        width: 350, 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: 'background.default',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Available Variables
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Drag and drop variables into the query editor
        </Typography>
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <VariableTree
          localVarsTree={localVarsTree}
          loopVarsTree={loopVarsTree}
          loopContext={loopContext}
          ruleRequestTree={ruleRequestTree}
          ruleConfigTree={ruleConfigTree}
          ruleResultTree={ruleResultTree}
        />
      </Box>
    </Box>
  );
};

export default React.memo(VariablesPanel);
