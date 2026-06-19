import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { GenerateEnrichmentResponseDto, GenerateSampleMessagesResponseDto } from './dto/msg-sample-generation.dto';
import { AdminServiceClient } from '../admin-service-client';
import { processMappings } from 'src/utils/process-mappings.util';
import { executeConfiguredFunctions } from 'src/utils/execute-functions.util';

@Injectable()
export class MsgSampleGenerationService {
  /**
   * Escapes SQL identifiers (table names, column names) by doubling internal double quotes
   * @param identifier The identifier to escape
   * @returns The escaped identifier ready for use with double quotes
   */
  private escapeIdentifier(identifier: string): string {
    return identifier.replace(/"/g, '""');
  }

  /**
   * Escapes SQL string literals by doubling internal single quotes
   * @param value The string value to escape
   * @returns The escaped string value ready for use in SQL
   */
  private escapeSqlString(value: string): string {
    return value.replace(/'/g, "''");
  }

  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  async getSampleMessages(generationId: number, token: string): Promise<GenerateSampleMessagesResponseDto> {
    return await this.adminServiceClient.getSampleMessages(token, generationId);
  }

  /**
   * Generates a database script with DDL and DML from sample message generation response
   * @param response The sample messages response containing transaction type patterns and payloads
   * @returns DbScript containing CREATE TABLE statements and INSERT statements
   */
  async generateDbScript(
    response: GenerateSampleMessagesResponseDto,
    token: string,
  ): Promise<{ dbScript: string; functionResultScript: string }> {
    let dbScript = '';
    let functionResultScript = '';

    for (const item of response.data) {
      const tableName = item.txtp;
      const escapedTableName = this.escapeIdentifier(tableName);

      const ddl = `
        CREATE TABLE IF NOT EXISTS public."${escapedTableName}"
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

      const valuesList = trackedFieldsResponse
        .map(({ trackedFields }, index) => {
          const payload = item.payloads[index];
          const documentValue = `'${this.escapeSqlString(JSON.stringify(payload))}'::jsonb`;
          const credttmValue = trackedFields.CreDtTm ? `'${this.escapeSqlString(trackedFields.CreDtTm)}'` : 'NULL';
          const messageIdValue = trackedFields.MsgId ? `'${this.escapeSqlString(trackedFields.MsgId)}'` : 'NULL';
          const endToEndIdValue = trackedFields.EndToEndId ? `'${this.escapeSqlString(trackedFields.EndToEndId)}'` : 'NULL';
          const debtorAccountIdValue = trackedFields.dbtrAcctId ? `'${this.escapeSqlString(trackedFields.dbtrAcctId)}'` : 'NULL';
          const creditorAccountIdValue = trackedFields.cdtrAcctId ? `'${this.escapeSqlString(trackedFields.cdtrAcctId)}'` : 'NULL';
          const tenantIdValue = trackedFields.TenantId ? `'${this.escapeSqlString(trackedFields.TenantId)}'` : 'NULL';

          return `(${documentValue}, ${credttmValue}, ${messageIdValue}, ${endToEndIdValue}, ${debtorAccountIdValue}, ${creditorAccountIdValue}, ${tenantIdValue})`;
        })
        .join(',\n    ');

      const dml = `
          INSERT INTO public."${escapedTableName}" (document, credttm, messageid, endtoendid, debtoraccountid, creditoraccountid, tenantid)
          VALUES
              ${valuesList};`;

      dbScript += dml;
    }

    return { dbScript, functionResultScript };
  }

  generateEnrichmentDbScript(response: GenerateEnrichmentResponseDto, token: string): string {
    let dbScript = '';

    for (const item of response.data) {
      const tableName = item.table_name;
      const escapedTableName = this.escapeIdentifier(tableName);

      const ddl = `
        CREATE TABLE IF NOT EXISTS public."${escapedTableName}"
        (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            data jsonb NOT NULL,
            job_id text COLLATE pg_catalog."default" NOT NULL,
            checksum text COLLATE pg_catalog."default" NOT NULL,
            created_at timestamp without time zone NOT NULL DEFAULT now(),
            CONSTRAINT "${escapedTableName}_pkey" PRIMARY KEY (id)
        );`;

      dbScript += ddl;

      const valuesList = item.rows
        .map((row) => {
          const dataValue = `'${this.escapeSqlString(JSON.stringify(row))}'::jsonb`;
          const jobIdValue = `'${this.escapeSqlString(item.enrichment_table_id)}'`;
          const checksumValue = `'${createHash('sha256').update(JSON.stringify(row)).digest('hex')}'`;
          return `(${dataValue}, ${jobIdValue}, ${checksumValue})`;
        })
        .join(',\n    ');

      const dml = `
          INSERT INTO public."${escapedTableName}" (data, job_id, checksum)
          VALUES
              ${valuesList};`;

      dbScript += dml;
    }

    return dbScript;
  }
}
