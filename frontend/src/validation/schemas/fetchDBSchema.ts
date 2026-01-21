import * as yup from 'yup';

/**
 * Validation schema for FetchDB node
 */
export const fetchDBSchema = yup.object({
  query: yup
    .string()
    .required('Database query is required')
    .min(5, 'Query must be at least 5 characters'),
  resultVar: yup
    .string()
    .required('Result variable name is required')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Must be a valid identifier'),
  variable: yup.string().optional(), // Alias for resultVar
});
