import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import type { Node } from '@xyflow/react';
import CodeIcon from '@mui/icons-material/Code';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { SidebarContainer, ScrollableList, ToggleButton } from './styles';
import { globalVariables } from '../../../utils/Flow/GlobalVariables';
import { useGetGlobalVariablesQuery } from '../../../redux/Api/Rule-builder';
import {
  useVariableTree,
  useLocalVariables,
  useNodePalette,
} from '../../../hooks/RuleBuilder';
import {
  NodePalette,
  VariableTree,
} from './components';
import { getAllNodeTemplates } from '../../../utils/Flow/nodeTemplateService';

interface LeftSidebarProps {
  mode?: 'main' | 'modal';
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  hideCustomFunctions?: boolean;
  hideImportNode?: boolean;
  hideStartEnd?: boolean;
  showGlobalVariables?: boolean;
  allNodes?: Node[];
  edges?: import('@xyflow/react').Edge[];
  selectedNodeId?: string | null;
  ruleId?: string;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  mode = 'main',
  collapsed = false,
  onToggleCollapse,
  hideCustomFunctions = false,
  hideImportNode = false,
  hideStartEnd = false,
  showGlobalVariables = false,
  allNodes = [],
  edges = [],
  selectedNodeId = null,
  ruleId,
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const { data: globalVarsData } = useGetGlobalVariablesQuery(
    ruleId || '',
    { skip: !showGlobalVariables || !ruleId }
  );

  const currentGlobalVariables = useMemo(() => {
    if (globalVarsData) {
      return {
        RuleRequest: globalVarsData.RuleRequest || {},
        RuleConfig: globalVarsData.RuleConfig || {},
        RuleResult: globalVarsData.RuleResult || {},
      };
    }
    return globalVariables;
  }, [globalVarsData]);


  const nodeTemplates = getAllNodeTemplates();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setActiveTab(newValue);
  };

  const { getNodesToShow, functionNodes } = useNodePalette({ mode, hideCustomFunctions, hideImportNode, hideStartEnd, apiNodes: nodeTemplates });
  const { localVars, loopVars, loopContext } = useLocalVariables({ 
    allNodes, 
    edges, 
    selectedNodeId,
    globalVarsData
  });

  const localVarsTree = useVariableTree({ obj: localVars, parentPath: '' });
  const loopVarsTree = useVariableTree({ obj: loopVars, parentPath: '' });
  const ruleRequestTree = useVariableTree({ obj: currentGlobalVariables.RuleRequest, parentPath: 'RuleRequest' });
  const ruleConfigTree = useVariableTree({ obj: currentGlobalVariables.RuleConfig, parentPath: 'RuleConfig' });
  const ruleResultTree = useVariableTree({ obj: currentGlobalVariables.RuleResult || {}, parentPath: 'RuleResult' });

  const nodesToShow = getNodesToShow(activeTab);

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string, mode?: string): void => {
    if (nodeType === 'Start' || nodeType === 'End') {
      event.preventDefault();
      return;
    }

    const dragData = mode && mode !== 'undefined' ? `${nodeType}::${mode}` : nodeType;
    event.dataTransfer.setData('application/reactflow', dragData);
    event.dataTransfer.effectAllowed = 'move';
  };

  const showVariablesEmptyState = showGlobalVariables && activeTab === 2 && 
    ruleRequestTree.length === 0 && 
    ruleConfigTree.length === 0 && 
    localVarsTree.length === 0 && 
    loopVarsTree.length === 0 && 
    ruleResultTree.length === 0;
  const showFunctionsEmptyState = activeTab === 1 && functionNodes.length === 0;

  return (
    <Box sx={{ position: 'relative' }}>
      <SidebarContainer mode={mode} collapsed={collapsed} activeTab={activeTab}>
        {!collapsed && (
          <>
            {mode === 'main' && (
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Typography variant="h6" component="h2" fontWeight={600}>
                  Node Palette
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Drag nodes to the canvas
                </Typography>
              </Box>
            )}

            {mode === 'modal' && (
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Typography variant="h6" component="h2" fontWeight={600} textAlign="center">
                  Add Nodes
                </Typography>
              </Box>
            )}
            {!hideCustomFunctions && !showGlobalVariables && (
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                  width: '100%',
                  minWidth: 0,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    minWidth: 0,
                    padding: '12px 8px',
                  },
                }}
              >
                <Tab label="Basic Nodes" />
                <Tab label="Functions" />
              </Tabs>
            )}

            {showGlobalVariables && (
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                  width: '100%',
                  minWidth: 0,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    minWidth: 0,
                    padding: '12px 8px',
                  },
                }}
              >
                <Tab label="Basic Nodes" />
                <Tab label="Functions" />
                <Tab label="Variables" />
              </Tabs>
            )}

            {hideCustomFunctions && !showGlobalVariables && mode === 'main' && (
              <Box sx={{ p: 1.5, bgcolor: 'info.lighter', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="info.main" fontWeight={500}>
                  Basic Nodes Only (Nested Canvas Mode)
                </Typography>
              </Box>
            )}
            <ScrollableList>
              {showGlobalVariables && activeTab === 2 ? (
                <VariableTree
                  localVarsTree={localVarsTree}
                  loopVarsTree={loopVarsTree}
                  loopContext={loopContext}
                  ruleRequestTree={ruleRequestTree}
                  ruleConfigTree={ruleConfigTree}
                  ruleResultTree={ruleResultTree}
                />
              ) : showGlobalVariables && activeTab === 1 ? (
                <NodePalette
                  nodes={functionNodes}
                  onDragStart={onDragStart}
                />
              ) : (
                <NodePalette
                  nodes={nodesToShow}
                  onDragStart={onDragStart}
                />
              )}
              {showVariablesEmptyState && (
                <Box textAlign="center" py={6} color="text.secondary">
                  <InfoOutlinedIcon sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                  <Typography variant="body2">No global variables available</Typography>
                  <Typography variant="caption" display="block" mt={0.5}>
                    Add variables to GlobalVariables.ts
                  </Typography>
                </Box>
              )}

              {showFunctionsEmptyState && (
                <Box textAlign="center" py={6} color="text.secondary">
                  <CodeIcon sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                  <Typography variant="body2">No functions available</Typography>
                  <Typography variant="caption" display="block" mt={0.5}>
                    Add functions to nodeTemplates.js
                  </Typography>
                </Box>
              )}
            </ScrollableList>
            {mode === 'main' && (
              <Box
                sx={{
                  p: 1.5,
                  borderTop: 1,
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                }}
              >
                {activeTab === 0 && (
                  <Box display="flex" alignItems="center">
                    <InfoOutlinedIcon sx={{ fontSize: 16, color: 'primary.main', mr: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      Basic building blocks for your flow
                    </Typography>
                  </Box>
                )}
                {activeTab === 1 && (
                  <Box display="flex" alignItems="center">
                    <CodeIcon sx={{ fontSize: 16, color: 'teal.500', mr: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      Reusable functions with custom logic
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            {mode === 'modal' && (
              <Box
                sx={{
                  p: 1.5,
                  borderTop: 1,
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                }}
              >
                {activeTab === 0 && (
                  <Box display="flex" alignItems="center">
                    <InfoOutlinedIcon sx={{ fontSize: 16, color: 'primary.main', mr: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      Basic building blocks for your flow
                    </Typography>
                  </Box>
                )}
                {activeTab === 1 && (
                  <Box display="flex" alignItems="center">
                    <CodeIcon sx={{ fontSize: 16, color: 'teal.500', mr: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      Call functions defined in main canvas
                    </Typography>
                  </Box>
                )}
                {activeTab === 2 && (
                  <Box display="flex" alignItems="center">
                    <InfoOutlinedIcon sx={{ fontSize: 16, color: 'primary.main', mr: 1 }} />
                    <Typography variant="caption" color="text.secondary">
                      Global variables available for use
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </SidebarContainer>
      {mode === 'main' && onToggleCollapse && (
        <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
          <ToggleButton onClick={onToggleCollapse} size="small">
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </ToggleButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default LeftSidebar;
