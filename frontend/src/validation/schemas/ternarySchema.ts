import * as yup from 'yup';

export const ternarySchema = yup.object({
  ternaryTree: yup
    .string()
    .required('Ternary tree structure is required')
    .test('valid-json', 'Must be a valid JSON object', (value) => {
      if (!value) return false;
      try {
        const parsed = JSON.parse(value);
        return (
          typeof parsed === 'object' &&
          parsed !== null &&
          'condition' in parsed &&
          'trueValue' in parsed &&
          'falseValue' in parsed
        );
      } catch {
        return false;
      }
    }),
  storeResult: yup.string().optional(),
  resultVar: yup
    .string()
    .optional()
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Must be a valid identifier'),
});
