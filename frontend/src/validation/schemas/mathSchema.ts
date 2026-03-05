import * as yup from 'yup';

export const mathSchema = yup.object({
  method: yup
    .string()
    .required('Operation is required')
    .oneOf(['sqrt', 'abs', 'pow', 'sin', 'cos', 'asin'], 'Must be a valid math operation'),
  value: yup
    .string()
    .required('Value is required')
    .test('is-valid', 'Must be a valid number or variable', (value) => {
      if (!value) return false;
      if (value.includes('{{') && value.includes('}}')) return true;
      if (/^[a-zA-Z_][a-zA-Z0-9_.[\]]*$/.test(value)) return true;
      if (!isNaN(Number(value))) return true;
      return false;
    }),
  resultVar: yup
    .string()
    .required('Result variable is required')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Must be a valid identifier'),
  value2: yup.string().optional(),
});
