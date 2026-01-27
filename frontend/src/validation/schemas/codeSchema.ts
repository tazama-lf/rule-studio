import * as yup from 'yup';

export const codeSchema = yup.object({
  code: yup
    .string()
    .required('Code is required')
    .min(1, 'Code cannot be empty'),
});
