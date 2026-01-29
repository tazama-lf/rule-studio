import type { ErrorObject } from 'ajv';

/**
 * Formats AJV validation errors into human-readable messages
 * @param errors Array of AJV error objects
 * @returns Array of formatted error messages
 */
export function formatValidationErrors(
  errors: ErrorObject[] | null | undefined,
): string[] {
  return (
    errors?.map((error) => {
      const path = error.instancePath || 'root';
      const message = error.message ?? 'validation failed';

      // Format specific error types
      if (error.keyword === 'required') {
        return `${path}: Missing required property '${error.params.missingProperty}'`;
      }
      if (error.keyword === 'additionalProperties') {
        return `${path}: Unexpected property '${error.params.additionalProperty}' not defined in schema`;
      }
      if (error.keyword === 'type') {
        return `${path}: Should be a ${error.params.type}`;
      }
      if (error.keyword === 'format') {
        return `${path}: Should match format '${error.params.format}'`;
      }
      if (error.keyword === 'pattern') {
        return `${path}: Should match pattern '${error.params.pattern}'`;
      }
      if (error.keyword === 'enum') {
        return `${path}: Should be one of: ${error.params.allowedValues?.join(', ')}`;
      }
      if (error.keyword === 'minLength') {
        return `${path}: Should be at least ${error.params.limit} characters`;
      }
      if (error.keyword === 'maxLength') {
        return `${path}: Should be no more than ${error.params.limit} characters`;
      }

      return `${path}: ${message}`;
    }) ?? []
  );
}
