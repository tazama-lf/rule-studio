
import { Injectable } from '@nestjs/common';
import { GenerateSampleMessagesResponseDto } from './dto/msg-sample-generation.dto';
import { AdminServiceClient } from '../admin-service-client';
import { processMappings } from 'src/utils/process-mappings.util';
import { executeConfiguredFunctions } from 'src/utils/execute-functions.util';

@Injectable()
export class MsgSampleGenerationService {
  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  async getSampleMessages(generationId: number, token: string): Promise<GenerateSampleMessagesResponseDto> {
    return await this.adminServiceClient.getSampleMessages(token, generationId);
  }

  /**
   * Generates a database script with DDL and DML from sample message generation response
   * @param response The sample messages response containing transaction type patterns and payloads
   * @returns DbScript containing CREATE TABLE statements and INSERT statements
   */
  async generateDbScript(response: GenerateSampleMessagesResponseDto, token:string): Promise<{ dbScript: string; functionResultScript: string }> {
    let dbScript = '';
    let functionResultScript = '';

    for (const item of response.data) {
      const tableName = item.txtp;

      const ddl = `
        CREATE TABLE IF NOT EXISTS public."${tableName}"
        (
            document jsonb NOT NULL,
            credttm text COLLATE pg_catalog."default",
            messageid text COLLATE pg_catalog."default",
            endtoendid text COLLATE pg_catalog."default",
            debtoraccountid text COLLATE pg_catalog."default",
            creditoraccountid text COLLATE pg_catalog."default",
            tenantid text COLLATE pg_catalog."default"
        );`;

      dbScript += ddl;

      const configRow = await this.adminServiceClient.getConfigRowByTxTpw3(item.txtp, item.txtp_version, token);
      
      if (item.payloads && Array.isArray(item.payloads) && item.payloads.length > 0) {
        const trackedFieldsResponse = [] as Array<{
          dataCache: any;
          transactionRelationship: any;
          endToEndId: string;
          dynamicMapping?: any;
          trackedFields: any;
        }>;

        for (const payload of item.payloads) {
          const mappingResult = await processMappings(payload, configRow.config.mapping, false);
          functionResultScript += await executeConfiguredFunctions(
            payload,
            configRow.config.mapping,
            configRow.config.functions,
            mappingResult.transactionRelationship,
          );
          trackedFieldsResponse.push(mappingResult);
        }
        console.log(`Generated function result script for payload with EndToEndId ${functionResultScript}`);

        const escapeSql = (value: string): string => value.replace(/'/g, "''");

        const valuesList = trackedFieldsResponse
          .map(({ trackedFields }, index) => {  
            const payload = item.payloads[index];
            const documentValue = `'${escapeSql(JSON.stringify(payload))}'::jsonb`;
            const credttmValue = trackedFields.CreDtTm ? `'${escapeSql(trackedFields.CreDtTm)}'` : 'NULL';
            const messageIdValue = trackedFields.MsgId ? `'${escapeSql(trackedFields.MsgId)}'` : 'NULL';
            const endToEndIdValue = trackedFields.EndToEndId ? `'${escapeSql(trackedFields.EndToEndId)}'` : 'NULL';
            const debtorAccountIdValue = trackedFields.dbtrAcctId ? `'${escapeSql(trackedFields.dbtrAcctId)}'` : 'NULL';
            const creditorAccountIdValue = trackedFields.cdtrAcctId ? `'${escapeSql(trackedFields.cdtrAcctId)}'` : 'NULL';
            const tenantIdValue = trackedFields.TenantId ? `'${escapeSql(trackedFields.TenantId)}'` : 'NULL';

            return `(${documentValue}, ${credttmValue}, ${messageIdValue}, ${endToEndIdValue}, ${debtorAccountIdValue}, ${creditorAccountIdValue}, ${tenantIdValue})`;
          })
          .join(',\n    ');

        const dml = `
          INSERT INTO public."${tableName}" (document, credttm, messageid, endtoendid, debtoraccountid, creditoraccountid, tenantid)
          VALUES
              ${valuesList};`;

        dbScript += dml;
      }
    };

    return { dbScript, functionResultScript };
  }
}
