import * as yup from 'yup';

export const exitSchema = yup.object({
  exitType: yup
    .string()
    .required('Exit type is required')
    .oneOf(['break', 'continue', 'return'], 'Must be break, continue, or return'),
  returnValue: yup.string().optional(),
});
