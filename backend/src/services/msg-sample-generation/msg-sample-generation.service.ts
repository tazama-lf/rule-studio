import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { GenerateEnrichmentResponseDto, GenerateSampleMessagesResponseDto } from './dto/msg-sample-generation.dto';
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

      // eslint-disable-next-line no-await-in-loop -- We need to fetch the config for each item to process the payloads and generate function scripts
      const configRow = await this.adminServiceClient.getConfigRowByTxTpw3(item.txtp, item.txtp_version, token);
      
      
        const trackedFieldsResponse = [] as Array<{
          dataCache: any;
          transactionRelationship: any;
          endToEndId: string;
          dynamicMapping?: any;
          trackedFields: any;
        }>;

        for (const payload of item.payloads) {
          const mappingResult = processMappings(payload, configRow.config.mapping, false);
          functionResultScript += executeConfiguredFunctions(
            payload,
            configRow.config.mapping,
            configRow.config.functions,
            mappingResult.transactionRelationship,
          );
          trackedFieldsResponse.push(mappingResult);
        }

        // Standard Postgres single-quote escaping: '  →  '' (double the quote, do not strip it).
        const escapeSql = (value: string): string => value.replace(/'/g, '\'\'');

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
      
    };

    return { dbScript, functionResultScript };
  }

  generateEnrichmentDbScript(response: GenerateEnrichmentResponseDto, token:string): string {
    let dbScript = '';

    // Standard Postgres single-quote escaping: '  →  '' (double the quote, do not strip it).
    const escapeSql = (value: string): string => value.replace(/'/g, '\'\'');

    // The table_name flows into a quoted SQL identifier (CREATE TABLE public."${name}").
    // Reject anything that could break out of the quotes or smuggle in a different identifier.
    const assertSafeIdentifier = (name: string): void => {
      if (typeof name !== 'string' || name.length === 0 || name.length > 63) {
        throw new Error(`Invalid enrichment table_name: must be a 1..63 char string (got ${JSON.stringify(name)})`);
      }
      if (/["\0]/.test(name)) {
        throw new Error(`Invalid enrichment table_name: must not contain double-quotes or NUL (got ${JSON.stringify(name)})`);
      }
    };

    for (const item of response.data) {
      const tableName = item.table_name;
      assertSafeIdentifier(tableName);

      const ddl = `
        CREATE TABLE IF NOT EXISTS public."${tableName}"
        (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            data jsonb NOT NULL,
            job_id text COLLATE pg_catalog."default" NOT NULL,
            checksum text COLLATE pg_catalog."default" NOT NULL,
            created_at timestamp without time zone NOT NULL DEFAULT now(),
            CONSTRAINT "${tableName}_pkey" PRIMARY KEY (id)
        );`;

      dbScript += ddl;

      if (item.rows.length === 0) continue;

      const valuesList = item.rows
        .map((row) => {
          const dataValue = `'${escapeSql(JSON.stringify(row))}'::jsonb`;
          const jobIdValue = `'${escapeSql(item.enrichment_table_id)}'`;
          const checksumValue = `'${createHash('sha256').update(JSON.stringify(row)).digest('hex')}'`;
          return `(${dataValue}, ${jobIdValue}, ${checksumValue})`;
        })
        .join(',\n    ');

      const dml = `
        INSERT INTO public."${tableName}" (data, job_id, checksum)
        VALUES
            ${valuesList};`;

      dbScript += dml;
      
    }

    return dbScript;
  }
}
