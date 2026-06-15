import { getValueByPath } from './has_nested_property';
import type { TransactionDetails } from '@tazama-lf/frms-coe-lib/lib/interfaces';

export function handleSplitValue(mapping: any, payload: any, dataCache: any, transactionRelationship: TransactionDetails): void {
  if (!mapping.source || !Array.isArray(mapping.source) || mapping.source.length === 0 || !mapping.source[0]) {
    throw new Error('Invalid mapping: source must be a non-empty array with at least one valid entry');
  }

  const rawSourceValue = getValueByPath(payload, mapping.source[0]);
  if (rawSourceValue === null || rawSourceValue === undefined) {
    throw new Error(`Source value not found at path: ${mapping.source[0]}`);
  }
  const sourceValue = String(rawSourceValue);

  const splitValues = sourceValue.split(mapping.delimiter);

  if (!mapping.destination || !Array.isArray(mapping.destination) || mapping.destination.length === 0) {
    throw new Error('Invalid mapping: destination must be a non-empty array');
  }

  for (let j = 0; j < mapping.destination.length; j++) {
    const destEntry = mapping.destination[j];
    if (typeof destEntry !== 'string' || !destEntry.includes('.')) {
      throw new Error(`Invalid destination format at index ${j}: ${destEntry}. Expected format: 'type.destination'`);
    }

    const destParts = destEntry.split('.');
    if (destParts.length < 2 || !destParts[0] || !destParts[1]) {
      throw new Error(`Invalid destination format at index ${j}: ${destEntry}. Both type and destination must be non-empty`);
    }

    const destType = destParts[0];
    const dest = destParts[1];
    const stringSize = destParts.length;

    if (j >= splitValues.length) {
      continue;
    }

    let finalValue: any = splitValues[j];
    if (mapping.type === 'number') {
      const numValue = Number(splitValues[j]);
      if (!isNaN(numValue)) {
        finalValue = numValue;
      }
    }

    if (destType === 'redis') {
      if (stringSize === 3) {
        const objectName = destParts[1];
        const nestedDest = destParts[2];
        dataCache[objectName] ??= {};
        dataCache[objectName][nestedDest] = finalValue;
      } else {
        dataCache[dest] = finalValue;
      }
    }
    if (destType === 'transactionDetails') {
      transactionRelationship[dest] = finalValue;
    }
  }
}
