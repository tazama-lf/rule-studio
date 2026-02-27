import * as yup from 'yup';

export const arrayOpSchema = yup.object({
  array: yup
    .string()
    .required('Array is required')
    .test('is-valid', 'Must be a valid array reference or template', (value) => {
      if (!value) return false;
      if (value.includes('{{') && value.includes('}}')) return true;

      if (/^[a-zA-Z_][a-zA-Z0-9_.[\]]*$/.test(value)) return true;
      return false;
    }),
  operation: yup
    .string()
    .required('Operation is required')
    .oneOf(
      ['pop', 'push', 'reverse', 'flat', 'concat', 'findIndex', 'length'],
      'Must be a valid array operation'
    ),
  resultVar: yup
    .string()
    .optional()
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Must be a valid identifier'),
  value: yup.string().optional(),
});
