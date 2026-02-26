import * as yup from 'yup';

export const determineOutcomeSchema = yup.object({
  argument1: yup
    .string()
    .required('Argument 1 is required')
    .test('is-valid-variable', 'Must be a valid variable or identifier', (value) => {
      if (!value) return false;
      
      if (value.includes('{{') && value.includes('}}')) return true;
      
      if (/^[a-zA-Z_$][a-zA-Z0-9_$.[\]'"]*$/.test(value)) return true;
      
      return false;
    }),
  
  argument2: yup
    .string()
    .required('Argument 2 is required')
    .test('is-valid-variable', 'Must be a valid variable or identifier', (value) => {
      if (!value) return false;
      
      if (value.includes('{{') && value.includes('}}')) return true;
      
      if (/^[a-zA-Z_$][a-zA-Z0-9_$.[\]'"]*$/.test(value)) return true;
      
      return false;
    }),
  
  argument3: yup
    .string()
    .required('Argument 3 is required')
    .test('is-valid-variable', 'Must be a valid variable or identifier', (value) => {
      if (!value) return false;

      if (value.includes('{{') && value.includes('}}')) return true;

      if (/^[a-zA-Z_$][a-zA-Z0-9_$.[\]'"]*$/.test(value)) return true;
      
      return false;
    }),
});
