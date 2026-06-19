import { getValueByPath } from './has_nested_property';

export function processSourceMapping(sources: string[], configuredMapping: any[], payload: any): string[] {
  let splitResultValue: string;
  let isDestinationArray: boolean;

  return sources.map((source: string) => {
    const mapping = configuredMapping.find((sch: any) => {
      isDestinationArray = false;

      if (typeof sch.destination !== 'string') {
        for (let i = 0; i < sch.destination.length; i += 1) {
          if (sch.destination[i] === source) {
            isDestinationArray = true;
            const result: string = getValueByPath(payload, sch.source[0]);
            const splitResult = result.split(sch.delimiter);
            splitResultValue = splitResult[i];
            return splitResult[i];
          }
        }
      }

      return sch.destination === source;
    });

    if (isDestinationArray) {
      return splitResultValue;
    }

    if (!mapping) {
      throw new Error(`Mapping not found for destination: ${source}`);
    }

    if (mapping.constantValue) {
      return mapping.constantValue;
    }

    const extractedValues = mapping.source.map((s: string) => {
      const value = getValueByPath(payload, s);
      if (value === null || value === undefined) {
        throw new Error(`Source value not found at path: ${s}`);
      }
      return value;
    });

    const combinedValue = extractedValues.join('');
    return combinedValue;
  });
}
