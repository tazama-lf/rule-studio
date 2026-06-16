import {  TransactionDetails } from "@tazama-lf/frms-coe-lib";
import {Logger} from "@nestjs/common";
import { processSourceMapping } from "./transformation/mapping-sources.utils";

export async function executeConfiguredFunctions(
    payload: any,
    configuredMapping: any,
    configuredFunctions: any,
    transactionRelationship: TransactionDetails,
  ): Promise<string> {
    const loggerService = new Logger();
    let dbScript = '';
    loggerService.log(
      `starting to execute configured functions based on mapping configuration ${JSON.stringify(transactionRelationship)}`
    );

    if (configuredFunctions) {
      for (const row of configuredFunctions) {
        // prepare params (getPayloadByPath) --> and call each function one by one
        const functionToCall = row.functionName;
        loggerService.log(`function to call is : ${functionToCall}`);
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
       
        if(functionToCall === 'addAccount') {
          dbScript += `INSERT INTO account (id, tenantId, creDtTm) VALUES ('${sources[0]}', '${sources[1]}', '${sources[2]}') ON CONFLICT (id, tenantId) DO NOTHING;\n`;
        } else if(functionToCall === 'addEntity') {
          dbScript += `INSERT INTO entity (id, tenantId, creDtTm) VALUES ('${sources[0]}', '${sources[1]}', '${sources[2]}') ON CONFLICT (id, tenantId) DO NOTHING;\n`;
        } else if(functionToCall === 'addAccountHolder') {
          dbScript += `INSERT INTO account_holder (source, destination, creDtTm, tenantId) VALUES ('${sources[0]}', '${sources[1]}', '${sources[2]}', '${sources[3]}') ON CONFLICT (source, destination, tenantId) DO NOTHING;\n`;
        } else if(functionToCall === 'saveTransactionDetails') {
          dbScript += `INSERT INTO transaction (source, destination, transaction) VALUES ('${transactionRelationship.source}', '${transactionRelationship.destination}', '${JSON.stringify(transactionRelationship)}') ON CONFLICT (endToEndId, txTp, tenantId) DO NOTHING;\n`;
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