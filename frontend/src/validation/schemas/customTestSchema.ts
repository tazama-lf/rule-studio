import * as yup from 'yup';

export const customTestSchema = yup.object().shape({
  testCode: yup
    .string()
    .required('Test code is required')
    .test('not-empty', 'Test code cannot be empty or just whitespace', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
});
