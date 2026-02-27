import * as yup from 'yup';

export const describeSchema = yup.object().shape({
  describeName: yup
    .string()
    .required('Describe name is required')
    .test('not-empty', 'Describe name cannot be empty or just whitespace', (value) => {
      return value ? value.trim().length > 0 : false;
    }),
});
