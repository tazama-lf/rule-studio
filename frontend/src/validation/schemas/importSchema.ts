import * as yup from 'yup';

export const importSchema = yup.object({
  importStatement: yup
    .string()
    .required('Import statement is required')
    .test('valid-import', 'Must contain at least one valid import statement', (value) => {
      if (!value || value.trim().length === 0) return false;

      const withoutComments = value
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*/g, '');

      const hasImport = /\bimport\b/i.test(withoutComments);
      
      return hasImport;
    }),
});

