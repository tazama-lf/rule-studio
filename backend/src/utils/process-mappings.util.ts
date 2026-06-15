import type { TransactionDetails, TrackedFields } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { handleSplitValue } from './transformation/split-value.utils';
import { handleDynamicMapping } from './transformation/dynamic-mapping.utils';
import { handleConstantValue } from './transformation/constant-value.utils';
import { handleConcatenation } from './transformation/concatenation.utils';
import { handlePostProcessing } from './transformation/post-processing.utils';
import { Logger } from '@nestjs/common';

export async function processMappings(
  payload: any,
  configuredMapping: any,
  relatedTransactionBoolean: boolean,
): Promise<{
  dataCache: any;
  transactionRelationship: TransactionDetails;
  endToEndId: string;
  dynamicMapping?: any;
  trackedFields: TrackedFields;
}> {
  const dataCache: any = {};
  const loggerService = new Logger();
  const transactionRelationship: TransactionDetails = {
    source: '',
    destination: '',
    TxTp: '',
    TenantId: payload.TenantId ?? '',
    MsgId: '',
    CreDtTm: '',
    Amt: 0,
    Ccy: '',
    EndToEndId: '',
    lat: '',
    long: '',
    TxSts: '',
  };

  const dynamicMapping: any = {};

  const trackedFields: TrackedFields = {
    CreDtTm: '',
    MsgId: '',
    EndToEndId: '',
    dbtrAcctId: '',
    cdtrAcctId: '',
    TenantId: '',
  };

  let endToEndId = '';

  if (configuredMapping) {
    try {
      for (const mapping of configuredMapping) {
        const sources = mapping.source;
        const separator = mapping.delimiter;

        const destination = typeof mapping.destination === 'string' ? mapping.destination.split('.')[1] : mapping.destination;
        const type = typeof mapping.destination === 'string' ? mapping.destination.split('.')[0] : mapping.destination;

        if (typeof destination !== 'string' || typeof type !== 'string') {
          handleSplitValue(mapping, payload, dataCache, transactionRelationship);
          continue;
        }

        if (type !== 'redis' && type !== 'transactionDetails') {
          handleDynamicMapping(mapping, payload, dynamicMapping);
          continue;
        }

        if (mapping.constantValue) {
          handleConstantValue(mapping, dataCache, transactionRelationship, type, destination);
          continue;
        }

        let dataCacheValue = mapping.prefix ?? '';
        let transactionRelationshipValue = mapping.prefix ?? '';

        const concatenationResult = handleConcatenation(sources, payload, type, mapping.prefix ?? '', separator);
        dataCacheValue = concatenationResult.dataCacheValue;
        transactionRelationshipValue = concatenationResult.transactionRelationshipValue;

        const postProcessingEndToEndId = handlePostProcessing(
          dataCacheValue,
          transactionRelationshipValue,
          mapping,
          dataCache,
          transactionRelationship,
          relatedTransactionBoolean,
        );
        if (postProcessingEndToEndId) {
          endToEndId = postProcessingEndToEndId;
        }
      }
    } catch (error) {
      loggerService.error(`Failed to process mapping data: ${String(error)}`);
      return {
        dataCache,
        transactionRelationship,
        endToEndId,
        dynamicMapping,
        trackedFields,
      };
    }
  } else {
    loggerService.log('No mapping configured for endpoint, skipping mapping processing.');
  }

  trackedFields.CreDtTm = transactionRelationship.CreDtTm;
  trackedFields.MsgId = transactionRelationship.MsgId;
  trackedFields.EndToEndId = transactionRelationship.EndToEndId;
  trackedFields.dbtrAcctId = dataCache.dbtrAcctId ?? null;
  trackedFields.cdtrAcctId = dataCache.cdtrAcctId ?? null;
  trackedFields.TenantId = transactionRelationship.TenantId;

  return {
    dataCache,
    transactionRelationship,
    endToEndId,
    dynamicMapping,
    trackedFields,
  };
}
