import * as yup from 'yup';


export const destructureSchema = yup.object({
  source: yup
    .string()
    .required('Source object is required')
    .test('is-valid', 'Must be a valid object reference or template', (value) => {
      if (!value) return false;
      if (value.includes('{{') && value.includes('}}')) return true;
      if (/^[a-zA-Z_][a-zA-Z0-9_.[\]]*$/.test(value)) return true;
      return false;
    }),
  keys: yup
    .string()
    .required('Keys are required')
    .test('valid-keys', 'Must be valid comma-separated identifiers', (value) => {
      if (!value) return false;
      const keys = value.split(',').map((k) => k.trim());
      return keys.every((k) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k));
    }),
});
