import { Logger } from '@nestjs/common';
import { getValueByPath } from './has_nested_property';

export function handleDynamicMapping(mapping: any, payload: any, dynamicMapping: any): void {
  const ObjectName: string = mapping.destination.split('.')[0];
  const PropertyName: string = mapping.destination.split('.')[1];
  const nestedPropertyName: string = mapping.destination.split('.')[2];

  const loggerService = new Logger();
  loggerService.log('dataModel case for dynamic mapping source: ', mapping.source[0]);
  loggerService.log('dataModel case for dynamic mapping value: ', getValueByPath(payload, mapping.source[0]));

  dynamicMapping[ObjectName] ??= {};
  if (nestedPropertyName) {
    dynamicMapping[ObjectName][PropertyName] ??= {};
    dynamicMapping[ObjectName][PropertyName][nestedPropertyName] = getValueByPath(payload, mapping.source[0]);
  } else {
    dynamicMapping[ObjectName][PropertyName] = getValueByPath(payload, mapping.source[0]);
  }

  loggerService.log('dynamicMapping object is now: ', JSON.stringify(dynamicMapping));
}
