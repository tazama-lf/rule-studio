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
export function returnArrayFieldsFromSchema(schema: any, loggerService?: LoggerService): ReturnArrayFieldsFromSchema {
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

    const processProperty = (property: any, currentPath: string, traverseFn: (obj: any, path: string) => void): void => {
      if (!property || typeof property !== 'object') return;

      if (property.type === 'array') arrayFields.push(currentPath);
      if (property.type === 'string') stringFields.push(currentPath);
      if (property.type === 'object' && property.properties) traverseFn(property, currentPath);

      if (property.type === 'array' && property.items?.type === 'object' && property.items.properties) {
        traverseFn(property.items, currentPath);
      }

      const variants = property.anyOf ?? property.oneOf ?? property.allOf;
      if (variants) {
        variants.forEach((variant: any) => {
          if (variant?.type === 'object' && variant.properties) traverseFn(variant, currentPath);
        });
      }
    };

    const processSchemaVariants = (obj: any, path: string, traverseFn: (obj: any, path: string) => void): void => {
      const variants = obj.anyOf ?? obj.oneOf ?? obj.allOf;
      if (variants) {
        variants.forEach((variant: any) => {
          if (variant?.properties) traverseFn(variant, path);
        });
      }
    };

    const traverseSchema = (obj: any, path = ''): void => {
      if (!obj || typeof obj !== 'object' || visited.has(obj)) return;

      visited.add(obj);

      if (obj.properties && typeof obj.properties === 'object') {
        Object.entries(obj.properties).forEach(([key, value]) => {
          processProperty(value as any, buildPath(path, key), traverseSchema);
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
export function replaceObjectsWithArrays(payload: any, arrayFields: string[], stringFields: string[], loggerService?: LoggerService): any {
  try {
    if (payload === null || payload === undefined) {
      throw new Error('Payload cannot be null or undefined');
    }

    // console.log("Starting replacement of objects with arrays and numbers with strings in payload...");
    const modifiedPayload = structuredClone(payload); // deep copy
    // console.log("Payload cloned successfully, modified payload.", JSON.stringify(modifiedPayload, null, 2));

    // console.log("Array fields to process:", arrayFields);

    arrayFields.forEach((fieldPath) => {
      convertObjectToArrayAtPath(modifiedPayload, fieldPath, loggerService);
    });

    // console.log("Completed object to array conversions. Now starting number to string conversions...");
    // console.log(JSON.stringify(modifiedPayload, null, 2));
    // console.log("String fields to process:", stringFields);

    stringFields.forEach((fieldPath) => {
      convertNumberToStringAtPath(modifiedPayload, fieldPath, loggerService);
    });

    // console.log("Completed number to string conversions. Final modified payload:", JSON.stringify(modifiedPayload, null, 2));

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
export function convertNumberToStringAtPath(obj: any, path: string, loggerService?: LoggerService): void {
  try {
    if (obj === null || obj === undefined) {
      throw new Error('Object cannot be null or undefined');
    }

    const pathParts = path.split('.');
    let current = obj;

    for (let i = 0; i < pathParts.length - 1; i += 1) {
      if (current && typeof current === 'object' && !Array.isArray(current) && current[pathParts[i]]) {
        current = current[pathParts[i]];
      } else {
        return;
      }
    }

    const targetFieldName = pathParts[pathParts.length - 1];

    if (current?.[targetFieldName] !== undefined && typeof current[targetFieldName] === 'number') {
      current[targetFieldName] = String(current[targetFieldName]);

      if (loggerService) {
        loggerService.log(`Converted field '${path}' from number to string: ${current[targetFieldName]}`);
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
export function convertObjectToArrayAtPath(obj: any, path: string, loggerService?: LoggerService): void {
  try {
    if (obj === null || obj === undefined) {
      throw new Error('Object cannot be null or undefined');
    }

    const pathParts = path.split('.');
    let current = obj;

    for (let i = 0; i < pathParts.length - 1; i += 1) {
      if (current && typeof current === 'object' && !Array.isArray(current) && current[pathParts[i]]) {
        current = current[pathParts[i]];
      } else {
        return;
      }
    }

    const targetFieldName = pathParts[pathParts.length - 1];

    if (current?.[targetFieldName] && typeof current[targetFieldName] === 'object' && !Array.isArray(current[targetFieldName])) {
      current[targetFieldName] = [current[targetFieldName]];

      if (loggerService) {
        loggerService.log(`Converted field '${path}' from object to array`);
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
  return (value: any, name: string, path = '') => {
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
