import * as yup from 'yup';

/**
 * Validation schema for Code node
 */
export const codeSchema = yup.object({
  code: yup
    .string()
    .required('Code is required')
    .min(1, 'Code cannot be empty'),
});
