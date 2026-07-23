import type { TransactionDetails } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { handleThirdLevelMapping } from './third-level-mapping.utils';

/**
 * Converts a value to the appropriate type based on mapping configuration
 * @param value The string value to convert
 * @param mapping The mapping configuration
 * @returns The converted value (number if mapping.type is 'number' and convertible, otherwise original string)
 */
function convertToMappingType(value: string, mapping: any): any {
  if (mapping.type === 'number') {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      return numValue;
    }
  }
  return value;
}

/**
 * Handles post processing for both dataCache and transactionRelationship
 * @param dataCacheValue The data cache value to process
 * @param transactionRelationshipValue The transaction relationship value to process
 * @param mapping The mapping configuration
 * @param dataCache The data cache object to update
 * @param transactionRelationship The transaction relationship object to update
 * @returns The endToEndId if the destination is 'EndToEndId', otherwise empty string
 */
export function handlePostProcessing(
  dataCacheValue: string,
  transactionRelationshipValue: string,
  mapping: any,
  dataCache: any,
  transactionRelationship: TransactionDetails,
  relatedTransactionBoolean: boolean,
): string {
  let endToEndId = '';

  let type: string;
  let pathParts: number;
  let destination: string;

  if (typeof mapping.destination === 'string') {
    const parts = mapping.destination.split('.');
    if (parts.length < 2) {
      throw new Error(`Invalid mapping destination format: ${mapping.destination}`);
    }
    type = parts[0];
    pathParts = parts.length;
    destination = parts[1];
  } else {
    type = mapping.destination;
    pathParts = -1;
    destination = mapping.destination;
  }

  if (type === 'redis') {
    if (relatedTransactionBoolean) {
      return '';
    }
    // eslint-disable-next-line no-param-reassign -- reassignment needed because the aim is to modify the original value with the suffix for both dataCache and transactionRelationship
    dataCacheValue += mapping.suffix ?? '';

    const finalValue = convertToMappingType(dataCacheValue, mapping);

    if (pathParts === 3) {
      handleThirdLevelMapping(mapping, finalValue, dataCache);
    } else {
      dataCache[destination] = finalValue;
    }
  } else {
    // eslint-disable-next-line no-param-reassign -- reassignment needed because the aim is to modify the original value with the suffix for both dataCache and transactionRelationship
    transactionRelationshipValue += mapping.suffix ?? '';

    const finalValue = convertToMappingType(transactionRelationshipValue, mapping);

    transactionRelationship[destination] = finalValue;

    if (destination === 'EndToEndId') {
      endToEndId = transactionRelationshipValue;
    }
  }

  return endToEndId;
}
