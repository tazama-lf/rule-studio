import * as yup from 'yup';

export const stringFuncSchema = yup.object({
  text: yup
    .string()
    .required('String is required')
    .test('is-valid', 'Must be a valid string or variable', (value) => {
      if (!value) return false;
      return true;
    }),
  method: yup
    .string()
    .required('Operation is required')
    .oneOf(
      ['split', 'slice', 'trim', 'substring', 'toUpperCase', 'toLowerCase', 'toString', 'length'],
      'Must be a valid string operation'
    ),
  resultVar: yup
    .string()
    .required('Result variable is required')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Must be a valid identifier'),
  separator: yup.string().optional(),
  start: yup.number().optional(),
  end: yup.number().optional(),
});
