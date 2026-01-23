import { useCallback, useMemo } from 'react';
import * as yup from 'yup';
import { getSchemaForNode, hasValidation } from '../../validation/schemas';
import { useValidationContext } from '../../validation/context';

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const useNodeValidation = (nodeId: string, nodeType: string, nodeName: string) => {
  const { setNodeErrors, getNodeError } = useValidationContext();

  const validate = useCallback(
    async (params: Record<string, unknown>): Promise<ValidationResult> => {
      if (!hasValidation(nodeType)) {
        setNodeErrors(nodeId, nodeName, nodeType, {});
        return { isValid: true, errors: {} };
      }

      const schema = getSchemaForNode(nodeType);
      if (!schema) {
        setNodeErrors(nodeId, nodeName, nodeType, {});
        return { isValid: true, errors: {} };
      }

      try {
        await schema.validate(params, { abortEarly: false });
        
        setNodeErrors(nodeId, nodeName, nodeType, {});
        return { isValid: true, errors: {} };
      } catch (err) {
        if (err instanceof yup.ValidationError) {
          const errors: Record<string, string> = {};
          
          err.inner.forEach((error) => {
            if (error.path) {
              errors[error.path] = error.message;
            }
          });
          
          setNodeErrors(nodeId, nodeName, nodeType, errors);
          return { isValid: false, errors };
        }
        
        return { isValid: false, errors: {} };
      }
    },
    [nodeId, nodeType, nodeName, setNodeErrors]
  );

  const validateField = useCallback(
    async (fieldName: string, value: unknown, allParams: Record<string, unknown>): Promise<string | null> => {
      if (!hasValidation(nodeType)) {
        return null;
      }

      const schema = getSchemaForNode(nodeType);
      if (!schema) {
        return null;
      }

      try {
        await schema.validateAt(fieldName, { ...allParams, [fieldName]: value });
        return null;
      } catch (err) {
        if (err instanceof yup.ValidationError) {
          return err.message;
        }
        return null;
      }
    },
    [nodeType]
  );

  const currentError = useMemo(
    () => getNodeError(nodeId),
    [nodeId, getNodeError]
  );
  
  const hasError = useMemo(
    () => !!currentError && Object.keys(currentError.errors).length > 0,
    [currentError]
  );

  const errors = useMemo(
    () => currentError?.errors || {},
    [currentError]
  );

  const getFieldError = useCallback(
    (fieldName: string): string | undefined => {
      const latestError = getNodeError(nodeId);
      return latestError?.errors[fieldName];
    },
    [nodeId, getNodeError]
  );

  const hasFieldError = useCallback(
    (fieldName: string): boolean => {
      const latestError = getNodeError(nodeId);
      return !!latestError?.errors[fieldName];
    },
    [nodeId, getNodeError]
  );

  const getErrorMessages = useCallback((): string[] => {
    const latestError = getNodeError(nodeId);
    if (!latestError) return [];
    return Object.values(latestError.errors);
  }, [nodeId, getNodeError]);

  return {
    validate,
    validateField,
    hasError,
    errors,
    getFieldError,
    hasFieldError,
    getErrorMessages,
    isValidatable: hasValidation(nodeType),
  };
};
