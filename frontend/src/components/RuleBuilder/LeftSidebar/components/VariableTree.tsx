import React from 'react';
import { Box, Chip } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CodeIcon from '@mui/icons-material/Code';
import LoopIcon from '@mui/icons-material/Loop';
import type { VariableTreeNode } from '../../../../hooks/RuleBuilder/useVariableTree';
import VariableTreeSection from './VariableTreeSection';

interface VariableTreeProps {
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

const VariableTree: React.FC<VariableTreeProps> = ({ 
  localVarsTree, 
  loopVarsTree,
  loopContext,
  ruleRequestTree, 
  ruleConfigTree,
  ruleResultTree
}) => {
  return (
    <Box sx={{ p: 1.5, overflowX: 'auto', minWidth: 0 }}>
      <Box sx={{ minWidth: 300 }}>
        {/* Loop Variables Section - Only show when in loop scope */}
        {loopContext.isInLoopScope && (
          <VariableTreeSection
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <span>Loop Variables</span>
                {loopContext.loopNames.length > 0 && (
                  <Chip 
                    label={`From: ${loopContext.loopNames.join(', ')}`}
                    size="small"
                    sx={{ 
                      height: '20px', 
                      fontSize: '0.7rem',
                      bgcolor: 'secondary.light',
                      color: 'secondary.contrastText'
                    }}
                  />
                )}
              </Box>
            }
            icon={<LoopIcon sx={{ fontSize: 18 }} />}
            color="secondary.main"
            nodes={loopVarsTree}
            emptyMessage="No loop variables available"
            showDivider={true}
          />
        )}

        {/* Local Variables Section */}
        <VariableTreeSection
          title="Local Variables"
          icon={<StorageIcon sx={{ fontSize: 18 }} />}
          color="info.main"
          nodes={localVarsTree}
          emptyMessage="No local variables defined yet. Use SetVariable or FetchDB nodes to create variables."
          showDivider={loopContext.isInLoopScope || localVarsTree.length > 0}
        />

        {/* Global Variables - RuleRequest */}
        <VariableTreeSection
          title="Global Variables (RuleRequest)"
          icon={<InfoOutlinedIcon sx={{ fontSize: 18 }} />}
          color="primary.main"
          nodes={ruleRequestTree}
          showDivider={true}
        />

        {/* Global Variables - RuleConfig */}
        <VariableTreeSection
          title="Global Variables (RuleConfig)"
          icon={<CodeIcon sx={{ fontSize: 18 }} />}
          color="primary.main"
          nodes={ruleConfigTree}
          showDivider={true}
        />

        {/* Global Variables - RuleResult */}
        <VariableTreeSection
          title="Global Variables (RuleResult)"
          icon={<CodeIcon sx={{ fontSize: 18 }} />}
          color="primary.main"
          nodes={ruleResultTree}
          showDivider={false}
        />
      </Box>
    </Box>
  );
};

export default VariableTree;
