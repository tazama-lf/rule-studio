import { useState, useCallback } from 'react';
import { validateSQLQuery, sanitizeQuery } from '../../utils/Common/queryValidation';

export const useQueryValidation = (query: string) => {
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateAndSanitize = useCallback((): { isValid: boolean; sanitized: string | null; error: string | null } => {
    const currentValidation = validateSQLQuery(query);
    
    if (!currentValidation.isValid) {
      const error = currentValidation.error || 'Invalid query';
      setValidationError(error);
      return { isValid: false, sanitized: null, error };
    }

    setValidationError(null);
    const sanitized = sanitizeQuery(query);
    return { isValid: true, sanitized, error: null };
  }, [query]);

  const clearValidationError = useCallback(() => {
    setValidationError(null);
  }, []);

  return {
    validationError,
    validateAndSanitize,
    clearValidationError,
  };
};
