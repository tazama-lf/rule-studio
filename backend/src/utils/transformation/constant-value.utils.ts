export function handleConstantValue(mapping: any, dataCache: any, transactionRelationship: any, type: string, destination: string): void {
  if (mapping.constantValue) {
    const stringSize = typeof mapping.destination === 'string' ? mapping.destination.split('.').length : -1;

    let finalValue: any = mapping.constantValue;
    if (mapping.type === 'number') {
      const numValue = Number(mapping.constantValue);
      if (!isNaN(numValue)) {
        finalValue = numValue;
      }
    }

    if (type === 'redis') {
      if (stringSize === 3) {
        const objectName: string = mapping.destination.split('.')[1];
        const nestedDest: string = mapping.destination.split('.')[2];
        dataCache[objectName] ??= {};
        dataCache[objectName][nestedDest] = finalValue;
      } else {
        dataCache[destination] = finalValue;
      }
    }
    if (type === 'transactionDetails') {
      transactionRelationship[destination] = finalValue;
    }
  }
}
