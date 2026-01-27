import * as yup from 'yup';

export const setVariableSchema = yup.object({
  name: yup
    .string()
    .required('Variable name is required')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Must be a valid identifier (letters, numbers, underscore)')
    .test('not-reserved', 'Cannot use reserved keywords', (value) => {
      const reserved = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'switch', 'case'];
      return !reserved.includes(value || '');
    }),
  declarationType: yup
    .string()
    .oneOf(['var', 'let', 'const'], 'Must be var, let, or const')
    .default('var'),
  dataType: yup
    .string()
    .oneOf(['string', 'number', 'boolean', 'array', 'object', 'any', 'undefined'], 'Must be a valid data type')
    .default('any'),
  value: yup
    .string()
    .optional()
    .when('dataType', {
      is: 'number',
      then: (schema) =>
        schema.test('is-number', 'Value must be a valid number', (value) => {
          if (!value || value.trim() === '') return true;
          if (value.includes('{{') && value.includes('}}')) return true;
          return !isNaN(Number(value));
        }),
    })
    .when('dataType', {
      is: 'boolean',
      then: (schema) =>
        schema.test('is-boolean', 'Value must be true or false', (value) => {
          if (!value || value.trim() === '') return true;
          if (value.includes('{{') && value.includes('}}')) return true;
          const lower = value.toLowerCase().trim();
          return ['true', 'false', '1', '0'].includes(lower);
        }),
    })
    .when('dataType', {
      is: 'array',
      then: (schema) =>
        schema.test('is-array', 'Value must be a valid JSON array', (value) => {
          if (!value || value.trim() === '') return true;
          if (value.includes('{{') && value.includes('}}')) return true;
          const trimmed = value.trim();
          if (!trimmed.startsWith('[')) return false;
          try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed);
          } catch {
            return false;
          }
        }),
    })
    .when('dataType', {
      is: 'object',
      then: (schema) =>
        schema.test('is-object', 'Value must be a valid JSON object', (value) => {
          if (!value || value.trim() === '') return true;
          if (value.includes('{{') && value.includes('}}')) return true;
          const trimmed = value.trim();
          if (!trimmed.startsWith('{')) return false;
          try {
            const parsed = JSON.parse(trimmed);
            return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
          } catch {
            return false;
          }
        }),
    })
    .when('dataType', {
      is: 'undefined',
      then: (schema) =>
        schema.test('is-empty', 'Value should be empty for undefined type', (value) => {
          return !value || value.trim() === '';
        }),
    }),
  variableName: yup.string().optional(),
  variableValue: yup.string().optional(),
});
