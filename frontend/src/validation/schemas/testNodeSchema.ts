import * as yup from 'yup';


export const testNodeSchema = yup.object().shape({
  testName: yup
    .string()
    .required('Test name is required')
    .test('not-empty', 'Test name cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
  dbData: yup
    .string()
    .required('DB data array is required')
    .test('valid-array', 'Must be a valid array format', (value) => {
      if (!value) return false;
      try {
        const trimmed = value.trim();
        if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
          return false;
        }

        return true;
      } catch {
        return false;
      }
    }),
  expectStatement: yup
    .string()
    .required('Expect statement is required')
    .test('not-empty', 'Expect statement cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
});

export const testNodeNoDbDataSchema = yup.object().shape({
  testName: yup
    .string()
    .required('Test name is required')
    .test('not-empty', 'Test name cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
  expectStatement: yup
    .string()
    .required('Expect statement is required')
    .test('not-empty', 'Expect statement cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
});

export const errorTestDualExpectSchema = yup.object().shape({
  testName: yup
    .string()
    .required('Test name is required')
    .test('not-empty', 'Test name cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
  dbData: yup
    .string()
    .required('DB data array is required')
    .test('valid-array', 'Must be a valid array format', (value) => {
      if (!value) return false;
      try {
        const trimmed = value.trim();
        if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
    }),
  successExpectStatement: yup
    .string()
    .required('Success expect statement is required')
    .test('not-empty', 'Success expect statement cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
  errorExpectStatement: yup
    .string()
    .required('Error expect statement is required')
    .test('not-empty', 'Error expect statement cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
});

export const errorTestDualExpectNoDbDataSchema = yup.object().shape({
  testName: yup
    .string()
    .required('Test name is required')
    .test('not-empty', 'Test name cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
  successExpectStatement: yup
    .string()
    .required('Success expect statement is required')
    .test('not-empty', 'Success expect statement cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
  errorExpectStatement: yup
    .string()
    .required('Error expect statement is required')
    .test('not-empty', 'Error expect statement cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
});

export const errorTestToleranceSchema = yup.object().shape({
  testName: yup
    .string()
    .required('Test name is required')
    .test('not-empty', 'Test name cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
  dbData: yup
    .string()
    .required('DB data array is required')
    .test('valid-array', 'Must be a valid array format', (value) => {
      if (!value) return false;
      try {
        const trimmed = value.trim();
        if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
    }),
  toleranceValue: yup
    .string()
    .required('Tolerance value is required')
    .test('not-empty', 'Tolerance value cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
  expectStatement: yup
    .string()
    .required('Expect statement is required')
    .test('not-empty', 'Expect statement cannot be empty', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
});
