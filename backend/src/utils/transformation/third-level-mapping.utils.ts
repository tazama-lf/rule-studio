/**
 * Handles third level mapping for nested object cases
 * @param mapping The mapping configuration
 * @param finalValue The final value to set
 * @param dataCache The data cache object to update
 */
export function handleThirdLevelMapping(mapping: any, finalValue: any, dataCache: any): void {
  if (typeof mapping.destination !== 'string' || mapping.destination.split('.').length < 3) {
    throw new Error(`Invalid third-level mapping destination: ${mapping.destination}`);
  }

  const destination = mapping.destination.split('.')[2];
  // Handle nested object case
  const objectName: string = mapping.destination.split('.')[1]; // instdAmt or intrBkSttlmAmt
  dataCache[objectName] ??= {};
  dataCache[objectName][destination] = finalValue;
}
