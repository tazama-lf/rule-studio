import { useState, useCallback, type ReactNode } from 'react';
import { ValidationContext } from './ValidationContext';
import type { ValidationContextType, ValidationError } from './ValidationContext';

interface ValidationProviderProps {
  children: ReactNode;
}

export const ValidationProvider: React.FC<ValidationProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<Map<string, ValidationError>>(new Map());

  const setNodeErrors = useCallback(
    (nodeId: string, nodeName: string, nodeType: string, nodeErrors: Record<string, string>) => {
      setErrors((prev) => {
        const newErrors = new Map(prev);
        
        if (Object.keys(nodeErrors).length === 0) {
          newErrors.delete(nodeId);
        } else {
          newErrors.set(nodeId, {
            nodeId,
            nodeName,
            nodeType,
            errors: nodeErrors,
          });
        }
        
        return newErrors;
      });
    },
    []
  );

  const clearNodeErrors = useCallback((nodeId: string) => {
    setErrors((prev) => {
      const newErrors = new Map(prev);
      newErrors.delete(nodeId);
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors(new Map());
  }, []);

  const getNodeError = useCallback(
    (nodeId: string) => {
      return errors.get(nodeId);
    },
    [errors]
  );

  const getAllErrors = useCallback(() => {
    return Array.from(errors.values());
  }, [errors]);

  const getErrorCount = useCallback(() => {
    return errors.size;
  }, [errors]);

  const hasErrors = errors.size > 0;

  const value: ValidationContextType = {
    errors,
    setNodeErrors,
    clearNodeErrors,
    clearAllErrors,
    hasErrors,
    getNodeError,
    getAllErrors,
    getErrorCount,
  };

  return <ValidationContext.Provider value={value}>{children}</ValidationContext.Provider>;
};
