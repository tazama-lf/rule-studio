import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Tooltip } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { globalVariables } from '../../../utils/Flow/GlobalVariables';
import { SidebarContainer, NodeCard, ScrollableList } from '../LeftSidebar/styles';

interface VariableItem {
  path: string;
  label: string;
  description: string;
  color: string;
}

interface GlobalVariablesSidebarProps {
  collapsed?: boolean;
}

const GlobalVariablesSidebar: React.FC<GlobalVariablesSidebarProps> = ({ collapsed = false }) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const flattenObject = (
    obj: unknown,
    parentPath: string = '',
    parentLabel: string = '',
    items: VariableItem[] = [],
    color: string = '#60a5fa'
  ): VariableItem[] => {
    if (typeof obj !== 'object' || obj === null) {
      return items;
    }

    const entries = Object.entries(obj);

    entries.forEach(([key, value]) => {
      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      const currentLabel = parentLabel ? `${parentLabel}.${key}` : key;

      // Recurse if value is an object (not null)
      if (typeof value === 'object' && value !== null) {
        flattenObject(value, currentPath, currentLabel, items, color);
      } else {
        // Only add leaf nodes
        items.push({
          path: currentPath,
          label: key,
          description: currentLabel,
          color,
        });
      }
    });

    return items;
  };

  const ruleRequestVars: VariableItem[] = flattenObject(
    globalVariables.RuleRequest,
    'RuleRequest',
    'RuleRequest',
    [],
    '#60a5fa'
  );

  const ruleConfigVars: VariableItem[] = flattenObject(
    globalVariables.RuleConfig,
    'RuleConfig',
    'RuleConfig',
    [],
    '#8b5cf6'
  );

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setActiveTab(newValue);
  };

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, variablePath: string, value: unknown): void => {
    event.dataTransfer.setData('variablePath', variablePath);
    event.dataTransfer.setData('variableValue', JSON.stringify(value ?? null));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const getVariablesToShow = (): VariableItem[] => {
    return activeTab === 0 ? ruleRequestVars : ruleConfigVars;
  };

  const variablesToShow = getVariablesToShow();

  const getNestedValue = (path: string): unknown => {
    const keys = path.split('.');
    let value: unknown = globalVariables;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <SidebarContainer mode="main" collapsed={collapsed} activeTab={activeTab}>
        {!collapsed && (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{
                  minHeight: '48px',
                  '& .MuiTab-root': {
                    minHeight: '48px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  },
                }}
              >
                <Tab label="RuleRequest" />
                <Tab label="RuleConfig" />
              </Tabs>
            </Box>

            <ScrollableList>
              {variablesToShow.map((variable) => {
                const value = getNestedValue(variable.path);
                return (
                  <Tooltip
                    key={variable.path}
                    title={variable.description}
                    placement="right"
                    arrow
                  >
                    <NodeCard
                      draggable
                      onDragStart={(e) => onDragStart(e, variable.path, value)}
                      nodecolor={variable.color}
                      sx={{ cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DragIndicatorIcon sx={{ fontSize: 16, opacity: 0.5 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {variable.label}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              opacity: 0.8,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                            }}
                          >
                            {variable.description}
                          </Typography>
                        </Box>
                      </Box>
                    </NodeCard>
                  </Tooltip>
                );
              })}
            </ScrollableList>
          </>
        )}
      </SidebarContainer>
    </Box>
  );
};

export default GlobalVariablesSidebar;
