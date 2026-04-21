import { Box } from "@mui/material";
import styled from '@emotion/styled';

export const DebugContainer = styled(Box)`
  background: white;
  border: 1px solid #dfddde;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 450px;
  max-height: 350px;
  margin-top: 16px;
`;

export const ConsoleSection = styled(Box)`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
`;

export const SectionHeader = styled(Box)`
  padding: 10px 16px;
  background: #0f172a;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
`;

export const LogsContainer = styled(Box)`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 16px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  min-height: 0;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f8f9fa;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;

    &:hover {
      background: #94a3b8;
    }
  }
`;
