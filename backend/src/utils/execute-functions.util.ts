import type { TransactionDetails } from '@tazama-lf/frms-coe-lib';
import { Logger } from '@nestjs/common';
import { processSourceMapping } from './transformation/mapping-sources.utils';

/**
 * Escapes SQL string literals by doubling internal single quotes
 * Prevents SQL injection when constructing SQL strings
 * @param value The string value to escape
 * @returns The escaped string value ready for use in SQL
 */
function escapeSqlString(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  const stringValue = String(value);
  // eslint-disable-next-line @stylistic/quotes -- We need to use single quotes for SQL string literals, so we escape single quotes by doubling them
  return stringValue.replace(/'/g, "''");
}

export function executeConfiguredFunctions(
  payload: any,
  configuredMapping: any,
  configuredFunctions: any,
  transactionRelationship: TransactionDetails,
): string {
  const loggerService = new Logger();
  let dbScript = '';
  loggerService.log(`starting to execute configured functions based on mapping configuration ${JSON.stringify(transactionRelationship)}`);

  if (configuredFunctions) {
    for (const row of configuredFunctions) {
      // prepare params (getPayloadByPath) --> and call each function one by one
      const functionToCall = row.functionName;
      let sources = row.params ?? [];

      const ALLOWED_DB_FUNCTIONS = [
        'addAccount',
        'addEntity',
        'addAccountHolder',
        'saveTransactionHistory',
        'addDataModelTable',
        'saveTransactionDetails',
      ];
      if (!ALLOWED_DB_FUNCTIONS.includes(functionToCall)) {
        throw new Error(`Function '${functionToCall}' is not in the allowed functions list`);
      }

      // process only when it exists.
      if (configuredMapping?.length > 0) {
        sources = processSourceMapping(sources, configuredMapping, payload);
      }

      try {
        if (functionToCall === 'addAccount') {
          const id = escapeSqlString(sources[0]);
          const tenantId = escapeSqlString(sources[1]);
          const creDtTm = escapeSqlString(sources[2]);
          dbScript += `INSERT INTO account (id, tenantId, creDtTm) VALUES ('${id}', '${tenantId}', '${creDtTm}') ON CONFLICT (id, tenantId) DO NOTHING;\n`;
        } else if (functionToCall === 'addEntity') {
          const id = escapeSqlString(sources[0]);
          const tenantId = escapeSqlString(sources[1]);
          const creDtTm = escapeSqlString(sources[2]);
          dbScript += `INSERT INTO entity (id, tenantId, creDtTm) VALUES ('${id}', '${tenantId}', '${creDtTm}') ON CONFLICT (id, tenantId) DO NOTHING;\n`;
        } else if (functionToCall === 'addAccountHolder') {
          const source = escapeSqlString(sources[0]);
          const destination = escapeSqlString(sources[1]);
          const creDtTm = escapeSqlString(sources[2]);
          const tenantId = escapeSqlString(sources[3]);
          dbScript += `INSERT INTO account_holder (source, destination, creDtTm, tenantId) VALUES ('${source}', '${destination}', '${creDtTm}', '${tenantId}') ON CONFLICT (source, destination, tenantId) DO NOTHING;\n`;
        } else if (functionToCall === 'saveTransactionDetails') {
          const source = escapeSqlString(transactionRelationship.source);
          const destination = escapeSqlString(transactionRelationship.destination);
          const transaction = escapeSqlString(JSON.stringify(transactionRelationship));
          dbScript += `INSERT INTO transaction (source, destination, transaction) VALUES ('${source}', '${destination}', '${transaction}') ON CONFLICT (endToEndId, txTp, tenantId) DO NOTHING;\n`;
        }
      } catch (error) {
        const errorMessage = `Function '${functionToCall}' failed: ${String(error)}`;
        loggerService.error(errorMessage, '');
        throw new Error(errorMessage, { cause: error });
      }
    }
  }

  return dbScript;
}
