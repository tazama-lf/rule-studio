import * as yup from 'yup';

/**
 * Validation schema for If node
 */
export const ifSchema = yup.object({
  conditions: yup
    .string()
    .required('At least one condition is required')
    .test('valid-json', 'Invalid conditions format', (value) => {
      try {
        const parsed = JSON.parse(value || '[]');
        return Array.isArray(parsed) && parsed.length > 0;
      } catch {
        return false;
      }
    })
    .test('has-if-condition', 'Must have at least one "if" condition', (value) => {
      try {
        const parsed = JSON.parse(value || '[]');
        return parsed.some((cond: { type: string }) => cond.type === 'if');
      } catch {
        return false;
      }
    })
    .test('valid-condition-text', 'All conditions must have valid text', (value) => {
      try {
        const parsed = JSON.parse(value || '[]');
        return parsed.every((cond: { type: string; condition?: string }) => {
          if (cond.type === 'else') return true;
          return cond.condition && cond.condition.trim().length > 0;
        });
      } catch {
        return false;
      }
    }),
});
