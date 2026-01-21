import * as yup from 'yup';

/**
 * Validation schema for Log node
 */
export const logSchema = yup.object({
  text: yup.string().required('Message is required'),
  message: yup.string().optional(), // Alias for text
});
