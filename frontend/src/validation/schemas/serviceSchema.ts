import * as yup from 'yup';

export const serviceSchema = yup.object().shape({
  variableName: yup
    .string()
    .required('Variable name is required')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Must be a valid identifier')
    .test('not-empty', 'Variable name cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
});
