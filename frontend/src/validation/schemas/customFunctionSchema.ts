import * as yup from 'yup';

/**
 * Validation schema for CustomFunction node
 * Handles both definition and call modes
 */
export const customFunctionSchema = yup.object({
  // Function name - required for both modes
  function_name: yup
    .string()
    .test('required-if-definition', 'Function name is required', function(value) {
      const { mode, generation_type } = this.parent;
      const currentMode = mode || generation_type;
      
      // Only required for definition mode
      if (currentMode === 'definition') {
        return !!value && value.trim().length > 0;
      }
      return true;
    })
    .test('valid-identifier', 'Must be a valid function name', function(value) {
      if (!value) return true; // Skip if empty (handled by required test)
      return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);
    }),
  
  // Code template - only for definition mode
  code_template: yup
    .string()
    .test('required-if-definition', 'Function code is required', function(value) {
      const { mode, generation_type } = this.parent;
      const currentMode = mode || generation_type;
      
      // Only required for definition mode
      if (currentMode === 'definition') {
        return !!value && value.trim().length > 0;
      }
      return true;
    }),
  
  // Result variable - only for call mode
  resultVariable: yup
    .string()
    .test('required-if-call', 'Result variable is required', function(value) {
      const { mode, generation_type, storeResult } = this.parent;
      const currentMode = mode || generation_type;
      
      // Only required for call mode AND if storeResult is true
      if (currentMode === 'call' && storeResult !== 'false') {
        return !!value && value.trim().length > 0;
      }
      return true;
    })
    .test('valid-identifier', 'Must be a valid identifier', function(value) {
      if (!value) return true; // Skip if empty (handled by required test)
      return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);
    }),
});
