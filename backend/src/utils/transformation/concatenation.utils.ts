import { getValueByPath } from './has_nested_property';

export function handleConcatenation(
  sources: string[],
  payload: any,
  type: string,
  prefix: string,
  separator: string,
): { dataCacheValue: string; transactionRelationshipValue: string } {
  let dataCacheValue = prefix;
  let transactionRelationshipValue = prefix;

  for (let i = 0; i < sources.length; i += 1) {
    if (type === 'redis') {
      dataCacheValue += getValueByPath(payload, sources[i]);

      if (i < sources.length - 1) {
        dataCacheValue += separator;
      }
    } else {
      transactionRelationshipValue += getValueByPath(payload, sources[i]);

      if (i < sources.length - 1) {
        transactionRelationshipValue += separator;
      }
    }
  }

  return { dataCacheValue, transactionRelationshipValue };
}
