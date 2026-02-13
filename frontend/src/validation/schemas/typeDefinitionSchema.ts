import * as yup from 'yup';


export const typeDefinitionSchema = yup.object({
  typeKind: yup
    .string()
    .optional()
    .oneOf(['type', 'interface'], 'Must be type or interface'),
  typeName: yup
    .string()
    .test('typeName-required', 'Type name is required', function (value) {
      const { typeKind, typeDefinition } = this.parent;
      if (typeKind || typeDefinition) {
        if (!value || value.trim() === '') {
          return false;
        }
        if (!/^[A-Z][a-zA-Z0-9_]*$/.test(value)) {
          return this.createError({
            message: 'Must be a valid TypeScript type name (PascalCase)',
          });
        }
      }
      return true;
    }),
  typeDefinition: yup
    .string()
    .optional()
    .test('typeDefinition-required', 'Type definition is required', function (value) {
      const { typeKind } = this.parent;
      if (typeKind && (!value || value.trim() === '')) {
        return false;
      }
      return true;
    }),
  variableName: yup
    .string()
    .optional()
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Must be a valid variable name'),
});
