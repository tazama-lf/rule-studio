import { createContext } from 'react';

export interface ValidationError {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  errors: Record<string, string>;
}

export interface ValidationContextType {
  errors: Map<string, ValidationError>;
  setNodeErrors: (nodeId: string, nodeName: string, nodeType: string, errors: Record<string, string>) => void;
  clearNodeErrors: (nodeId: string) => void;
  clearAllErrors: () => void;
  hasErrors: boolean;
  getNodeError: (nodeId: string) => ValidationError | undefined;
  getAllErrors: () => ValidationError[];
  getErrorCount: () => number;
}

export const ValidationContext = createContext<ValidationContextType | null>(null);

