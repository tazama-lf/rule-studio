import type { LoggerService } from '@tazama-lf/frms-coe-lib';
import type { Request } from 'express';
import type { ReturnArrayFieldsFromSchema } from '../interfaces/iXml2js.interfaces';

/**
 * Utility functions for XML2JS processing and schema-based transformations
 */

/**
 * Analyzes a JSON schema to extract field paths that should be arrays or strings
 * @param schema The JSON schema to analyze
 * @param loggerService Logger service for error logging
 * @returns Object containing arrays of field paths for arrays and strings
 */
export function returnArrayFieldsFromSchema(schema: unknown, loggerService?: LoggerService): ReturnArrayFieldsFromSchema {
  try {
    // Handle null/undefined schema
    if (!schema) {
      if (loggerService) {
        loggerService.error('Schema is null or undefined');
      }
      throw new Error('Schema cannot be null or undefined');
    }

    const arrayFields: string[] = [];
    const stringFields: string[] = [];
    const visited = new Set(); // Circular reference detection

    const buildPath = (base: string, key: string): string => (base ? `${base}.${key}` : key);

    const processProperty = (property: unknown, currentPath: string, traverseFn: (obj: unknown, path: string) => void): void => {
      if (!property || typeof property !== 'object') return;

      const prop = property as Record<string, unknown>;
      if (prop.type === 'array') arrayFields.push(currentPath);
      if (prop.type === 'string') stringFields.push(currentPath);
      if (prop.type === 'object' && prop.properties) traverseFn(property, currentPath);

      if (
        prop.type === 'array' &&
        (prop.items as Record<string, unknown> | undefined)?.type === 'object' &&
        (prop.items as Record<string, unknown>).properties
      ) {
        traverseFn(prop.items, currentPath);
      }

      const variants = prop.anyOf ?? prop.oneOf ?? prop.allOf;
      if (variants && Array.isArray(variants)) {
        variants.forEach((variant: unknown) => {
          if (
            variant &&
            typeof variant === 'object' &&
            (variant as Record<string, unknown>).type === 'object' &&
            (variant as Record<string, unknown>).properties
          ) {
            traverseFn(variant, currentPath);
          }
        });
      }
    };

    const processSchemaVariants = (obj: unknown, path: string, traverseFn: (obj: unknown, path: string) => void): void => {
      if (!obj || typeof obj !== 'object') return;
      const schema = obj as Record<string, unknown>;
      const variants = schema.anyOf ?? schema.oneOf ?? schema.allOf;
      if (variants && Array.isArray(variants)) {
        variants.forEach((variant: unknown) => {
          if (variant && typeof variant === 'object' && (variant as Record<string, unknown>).properties) traverseFn(variant, path);
        });
      }
    };

    const traverseSchema = (obj: unknown, path = ''): void => {
      if (!obj || typeof obj !== 'object' || visited.has(obj)) return;

      visited.add(obj);

      const schema = obj as Record<string, unknown>;
      if (schema.properties && typeof schema.properties === 'object') {
        Object.entries(schema.properties).forEach(([key, value]) => {
          processProperty(value, buildPath(path, key), traverseSchema);
        });
      }

      processSchemaVariants(obj, path, traverseSchema);
      visited.delete(obj);
    };

    traverseSchema(schema);
    return { arrayFields, stringFields };
  } catch (error) {
    if (loggerService) {
      loggerService.error(
        `Error in returnArrayFieldsFromSchema: ${String(error)}. Schema path or field causing issue: ${
          (error as Error).stack ?? 'Unknown'
        }`,
      );
    }
    throw error;
  }
}

/**
 * Replaces objects with arrays for fields that are marked as arrays in the schema
 * and converts numbers back to strings for fields that should be strings
 * @param payload The payload to modify
 * @param arrayFields Array of dot-notation paths that should be arrays
 * @param stringFields Array of dot-notation paths that should be strings
 * @param loggerService Optional logger service for logging conversions
 * @returns Modified payload with objects converted to arrays and numbers converted to strings where needed
 */
export function replaceObjectsWithArrays(
  payload: unknown,
  arrayFields: string[],
  stringFields: string[],
  loggerService?: LoggerService,
): unknown {
  try {
    if (payload === null || payload === undefined) {
      throw new Error('Payload cannot be null or undefined');
    }

    const modifiedPayload = structuredClone(payload);

    arrayFields.forEach((fieldPath) => {
      convertObjectToArrayAtPath(modifiedPayload, fieldPath, loggerService);
    });

    stringFields.forEach((fieldPath) => {
      convertNumberToStringAtPath(modifiedPayload, fieldPath, loggerService);
    });

    return modifiedPayload;
  } catch (error) {
    if (loggerService) {
      loggerService.error(
        `Error in replaceObjectsWithArrays: ${String(error)}. Field paths: arrays=${arrayFields.join(
          ',',
        )}, strings=${stringFields.join(',')}`,
      );
    }
    throw error;
  }
}

/**
 * Converts a number to a string at a specific dot-notation path
 * @param obj The object to modify
 * @param path The dot-notation path to the field
 * @param loggerService Optional logger service for logging conversions
 */
export function convertNumberToStringAtPath(obj: unknown, path: string, loggerService?: LoggerService): void {
  try {
    if (obj === null || obj === undefined) {
      throw new Error('Object cannot be null or undefined');
    }

    const pathParts = path.split('.');
    let current: unknown = obj;

    for (let i = 0; i < pathParts.length - 1; i += 1) {
      if (typeof current === 'object' && current !== null && !Array.isArray(current) && pathParts[i] in current) {
        current = (current as Record<string, unknown>)[pathParts[i]];
      } else {
        return;
      }
    }

    const targetFieldName = pathParts[pathParts.length - 1];

    if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
      const objCurrent = current as Record<string, unknown>;
      if (typeof objCurrent[targetFieldName] === 'number') {
        objCurrent[targetFieldName] = String(objCurrent[targetFieldName]);

        if (loggerService) {
          loggerService.log(`Converted field '${path}' from number to string: ${String(objCurrent[targetFieldName])}`);
        }
      }
    }
  } catch (error) {
    if (loggerService) {
      loggerService.error(`Error in convertNumberToStringAtPath: ${String(error)}. Path: ${path}`);
    }
    throw error;
  }
}

/**
 * Converts an object to an array at a specific dot-notation path
 * @param obj The object to modify
 * @param path The dot-notation path to the field
 * @param loggerService Optional logger service for logging conversions
 */
export function convertObjectToArrayAtPath(obj: unknown, path: string, loggerService?: LoggerService): void {
  try {
    if (obj === null || obj === undefined) {
      throw new Error('Object cannot be null or undefined');
    }
    const pathParts = path.split('.');
    let current: unknown = obj;
    for (let i = 0; i < pathParts.length - 1; i += 1) {
      if (typeof current === 'object' && current !== null && !Array.isArray(current) && pathParts[i] in current) {
        current = (current as Record<string, unknown>)[pathParts[i]];
      } else {
        return;
      }
    }
    const targetFieldName = pathParts[pathParts.length - 1];
    if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
      const objCurrent = current as Record<string, unknown>;
      if (objCurrent[targetFieldName] && typeof objCurrent[targetFieldName] === 'object' && !Array.isArray(objCurrent[targetFieldName])) {
        objCurrent[targetFieldName] = [objCurrent[targetFieldName]];
        if (loggerService) {
          loggerService.log(`Convertnpm ed field '${path}' from object to array`);
        }
      }
    }
  } catch (error) {
    if (loggerService) {
      loggerService.error(`Error in convertObjectToArrayAtPath: ${String(error)}. Path: ${path}`);
    }
    throw error;
  }
}

/**
 * Custom value processor that only converts to numbers if the field is not a string in the schema
 * @param stringFields Array of dot-notation paths that should remain as strings
 * @param loggerService Optional logger service for logging
 * @returns A function that processes values based on schema types
 */
export function createSchemaAwareNumberProcessor(stringFields: string[]) {
  const stringFieldSet = new Set(stringFields);
  return (value: unknown, name: string, path = '') => {
    const fullPath = path ? `${path}.${name}` : name;
    if (stringFieldSet.has(fullPath)) return value;

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== value) {
        return value;
      }
      if (trimmed !== '' && !isNaN(+trimmed)) {
        return +trimmed;
      }
    }
    return value;
  };
}

export function isXmlContentType(req: Request, loggerService?: LoggerService): boolean {
  try {
    const contentType = req.get('content-type') ?? req.get('Content-Type') ?? '';
    return contentType === 'application/xml';
  } catch (error) {
    if (loggerService) {
      loggerService.error(`Error in isXmlContentType: ${String(error)}`);
    }
    throw error;
  }
}
