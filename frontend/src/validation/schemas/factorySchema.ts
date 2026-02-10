import * as yup from 'yup';

export const factorySchema = yup.object().shape({
  factoryName: yup
    .string()
    .required('Factory name is required')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Must be a valid identifier')
    .test('not-empty', 'Factory name cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
});

export const ruleRequestScenarioSchema = yup.object().shape({
  factoryName: yup
    .string()
    .required('Factory name is required')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Must be a valid identifier')
    .test('not-empty', 'Factory name cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
  modifications: yup.string().optional(),
});

export const factoryWithDataSchema = yup.object().shape({
  factoryName: yup
    .string()
    .required('Factory name is required')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Must be a valid identifier')
    .test('not-empty', 'Factory name cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
  ruleRequestData: yup.string().optional(),
}) as yup.ObjectSchema<Record<string, unknown>>;


export const ruleConfigFactorySchema = yup.object().shape({
  factoryName: yup
    .string()
    .required('Factory name is required')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Must be a valid identifier')
    .test('not-empty', 'Factory name cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
  ruleConfigData: yup.string().optional(),
}) as yup.ObjectSchema<Record<string, unknown>>;

export const ruleResultFactorySchema = yup.object().shape({
  factoryName: yup
    .string()
    .required('Factory name is required')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Must be a valid identifier')
    .test('not-empty', 'Factory name cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
  ruleResultData: yup.string().optional(),
}) as yup.ObjectSchema<Record<string, unknown>>;

export const dataCacheFactorySchema = yup.object().shape({
  variableName: yup
    .string()
    .required('Variable name is required')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Must be a valid identifier')
    .test('not-empty', 'Variable name cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
  dataCacheData: yup
    .string()
    .required('Data cache data is required')
    .test('valid-json', 'Must be valid JSON', (value) => {
      if (!value || value.trim() === '') return false;
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }),
});


