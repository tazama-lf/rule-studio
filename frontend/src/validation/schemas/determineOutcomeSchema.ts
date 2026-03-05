import * as yup from 'yup';

const isValidVariableOrPlaceholder = (value: string | undefined): boolean => {
  if (!value) return false;
  
  // Matches {{placeholder}} or variable paths like obj.prop or obj['key']
  if (/^\{\{\s*[a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[['"][^'"]+['"]\])*\s*\}\}$/.test(value)) return true;
  
  // Matches variable.property or variable['key'] access patterns
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[['"][^'"]+['"]\])*$/.test(value)) return true;
  
  return false;
};

export const determineOutcomeSchema = yup.object({
  argument1: yup
    .string()
    .required('Argument 1 is required')
    .test('is-valid-variable', 'Must be a valid variable or identifier', isValidVariableOrPlaceholder),
  
  argument2: yup
    .string()
    .required('Argument 2 is required')
    .test('is-valid-variable', 'Must be a valid variable or identifier', isValidVariableOrPlaceholder),
  
  argument3: yup
    .string()
    .required('Argument 3 is required')
    .test('is-valid-variable', 'Must be a valid variable or identifier', isValidVariableOrPlaceholder),
});
