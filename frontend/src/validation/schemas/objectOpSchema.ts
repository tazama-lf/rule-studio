import * as yup from 'yup';

export const objectOpSchema = yup.object({
  object: yup
    .string()
    .required('Object is required')
    .test('is-valid', 'Must be a valid object reference or template', (value) => {
      if (!value) return false;
      if (value.includes('{{') && value.includes('}}')) return true;
      if (/^[a-zA-Z_][a-zA-Z0-9_.[\]]*$/.test(value)) return true;
      return false;
    }),
  operation: yup
    .string()
    .required('Operation is required')
    .oneOf(
      ['keys', 'values', 'entries', 'assign', 'hasOwnProperty', 'destructure'],
      'Must be a valid object operation'
    ),
  resultVar: yup
    .string()
    .required('Result variable is required')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Must be a valid identifier'),
  keys: yup.string().optional(),
  property: yup.string().optional(),
  sourceObjects: yup.string().optional(),
});
