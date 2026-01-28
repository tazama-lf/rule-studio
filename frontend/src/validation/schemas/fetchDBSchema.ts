import * as yup from 'yup';
import { validateSQLQuery } from '../../utils/Common/queryValidation';

export const fetchDBSchema = yup.object({
  query: yup
    .string()
    .required('Database query is required')
    .test('valid-sql-query', '', function(value) {
      if (!value) return true;
      
      const validation = validateSQLQuery(value);
      
      if (!validation.isValid) {
        return this.createError({ message: validation.error });
      }
      
      return true;
    }),
  resultVar: yup
    .string()
    .test('resultVar-or-variable-required', 'Result variable name is required', function(value) {
      const { variable } = this.parent;
      
      const hasResultVar = value != null && typeof value === 'string' && value.trim() !== '';
      const hasVariable = variable != null && typeof variable === 'string' && variable.trim() !== '';
      
      if (!hasResultVar && !hasVariable) {
        return false;
      }
      

      if (hasResultVar && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value!)) {
        return this.createError({ 
          message: 'Must be a valid identifier (letters, numbers, underscores only, cannot start with a number)' 
        });
      }
      return true;
    }),
  variable: yup
    .string()
    .test('variable-validation', 'Must be a valid identifier', function(value) {
      const hasValue = value != null && typeof value === 'string' && value.trim() !== '';
      if (hasValue && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value!)) {
        return this.createError({ 
          message: 'Must be a valid identifier (letters, numbers, underscores only, cannot start with a number)' 
        });
      }
      return true;
    }),
});
