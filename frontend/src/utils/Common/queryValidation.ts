export interface QueryValidationResult {
  isValid: boolean;
  error?: string;
}

const FORBIDDEN_SQL_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'ALTER',
  'DROP',
  'TRUNCATE',
  'CREATE',
  'REPLACE',
  'MERGE',
  'GRANT',
  'REVOKE',
] as const;

export const validateSQLQuery = (query: string): QueryValidationResult => {
  if (!query || typeof query !== 'string') {
    return { isValid: false, error: 'Query cannot be empty' };
  }

  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 5) {
    return { isValid: false, error: 'Query must be at least 5 characters' };
  }

  const forbiddenPattern = new RegExp(
    `^\\s*(${FORBIDDEN_SQL_KEYWORDS.join('|')})\\b`,
    'i'
  );

  if (forbiddenPattern.test(trimmedQuery)) {
    return {
      isValid: false,
      error: `Only SELECT queries are allowed. ${FORBIDDEN_SQL_KEYWORDS.join(', ')} operations are not permitted for security reasons.`,
    };
  }
  const dangerousPatterns = [
    /;\s*(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)/i,
    /--\s*$/m,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmedQuery)) {
      return {
        isValid: false,
        error: 'Query contains potentially dangerous patterns. Please remove multiple statements or comments.',
      };
    }
  }

  return { isValid: true };
};

export const hasForbiddenKeywords = (text: string): boolean => {
  const validation = validateSQLQuery(text);
  return !validation.isValid;
};

export const sanitizeQuery = (query: string): string => {
  if (!query) return '';
  
  return query
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
};
