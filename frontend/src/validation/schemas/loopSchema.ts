import * as yup from 'yup';

export const loopSchema = yup.object({
  loopType: yup
    .string()
    .required('Loop type is required')
    .oneOf(
      ['forEach', 'for', 'while', 'map', 'filter', 'every', 'some', 'reduce', 'find'],
      'Must be a valid loop type'
    ),
  arrayVariable: yup
    .string()
    .when(['loopType', 'loopCondition'], {
      is: (loopType: string, loopCondition: string | undefined) => {
        const arrayIterationTypes = ['forEach', 'map', 'filter', 'every', 'some', 'reduce', 'find'];
        return arrayIterationTypes.includes(loopType) || !loopCondition;
      },
      then: (schema) => schema
        .required('Array variable is required')
        .test('is-valid', 'Must be a valid variable name or template', (value) => {
          if (!value) return false;
          if (value.includes('{{') && value.includes('}}')) return true;
          if (/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(value)) return true;
          return false;
        }),
      otherwise: (schema) => schema
        .optional()
        .test('is-valid', 'Must be a valid variable name or template', (value) => {
          if (!value) return true;
          if (value.includes('{{') && value.includes('}}')) return true;
          if (/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(value)) return true;
          return false;
        }),
    }),
  itemVariable: yup.string().optional(),
  indexVariable: yup.string().optional(),
  resultVariable: yup.string().optional(),
  initialization: yup.string().optional(),
  loopCondition: yup.string().optional(),
  incrementOperation: yup.string().optional(),
  customIncrement: yup.string().optional(),
  filterCondition: yup.string().optional(),
  condition: yup.string().optional(),
  reduceLogic: yup.string().optional(),
  initialValue: yup.string().optional(),
});
