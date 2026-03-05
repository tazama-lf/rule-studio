import { Injectable, Logger } from '@nestjs/common';
import { RbacService } from '../../utils/rbac/rbacHelper';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { randomUUID } from 'node:crypto';
import { processMappings, FieldMapping } from '@tazama-lf/tcs-lib';
import { TransactionalMessage, RuleRequest, NetworkMap, DataCache, MetaData } from './dto/message.dto';
import { AdminServiceClient } from '../admin-service-client';
import { formatValidationErrors } from '../../utils/validation.utils';
import type { AuthenticatedUser } from '../auth/auth.types';

@Injectable()
export class ParseExtractService {
  private readonly logger = new Logger(ParseExtractService.name);
  private readonly rbacService = new RbacService();
  private readonly ajv: Ajv;

  constructor(private readonly adminServiceClient: AdminServiceClient) {
    // Initialize AJV with same configuration as DEMS
    this.ajv = new Ajv({ allErrors: true, logger: false });
    addFormats(this.ajv);
  }

  /**
   * Core logic = calls processTransactionPayload - fetch schema -> validate payload -> process mappings -> create RuleRequest
   * @param request The transactional message request
   * @param token Authentication token
   * @returns Processing result optimized for rule creation
   */
  async processForRuleCreation(
    transactionType: string,
    transactionVersion: string,
    schemaResult: Record<string, unknown>,
    mappingResult: FieldMapping[],
    payloadResult: Record<string, unknown>,
    user: AuthenticatedUser,
  ): Promise<{
    success: boolean;
    message: string;
    correlationId: string;
    ruleRequest?: RuleRequest;
    validatedPayload?: Record<string, unknown>;
    configPayload?: Record<string, unknown>;
    validationErrors?: string[];
  }> {
    const correlationId = randomUUID();

    try {
      this.logger.log(`Processing transaction data for rule creation - TxTp: ${transactionType} [${correlationId}]`);
      const payloadToValidate = { ...payloadResult, TxTp: transactionType, TenantId: user.tenantId };

      const validationResult = this.validatePayload(payloadToValidate, schemaResult, transactionType, correlationId);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: 'Payload validation failed',
          validationErrors: validationResult.differences,
          configPayload: payloadResult,
          correlationId,
        };
      }
      const mappingOutcome = processMappings(payloadToValidate, mappingResult, transactionType);
      const activeNetworkMap = await this.adminServiceClient.getActiveNetworkMap(user.token.tokenString);

      const networkMap: NetworkMap = activeNetworkMap ?? {};

      this.logger.log(
        `Processed mappings for ${transactionType}: extracted ${Object.keys(mappingOutcome.dataCache).length} data cache entries`,
      );

      const ruleRequest: RuleRequest = this.createRuleRequest(payloadToValidate, user, correlationId, mappingOutcome.dataCache, networkMap);

      return {
        success: true,
        message: 'Transaction data processed successfully',
        correlationId,
        ruleRequest,
        validatedPayload: payloadToValidate,
        configPayload: payloadResult,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error processing transaction data for rule creation [${correlationId}]: ${err.message}`, err.stack);

      return {
        success: false,
        message: `Failed to process transaction data: ${err.message}`,
        correlationId,
      };
    }
  }

  /**
   * Validates payload against the configured schema using AJV
   * @param payload The payload to validate
   * @param configuredSchema The schema to validate against
   * @param transactionType The transaction type for error tracking
   * @param correlationId Correlation ID for tracking
   * @returns Validation result with isValid flag and formatted errors
   */
  private validatePayload(
    payload: Record<string, unknown>,
    configuredSchema: Record<string, unknown>,
    transactionType: string,
    correlationId: string,
  ): { isValid: boolean; differences?: string[] } {
    let isValid: boolean;

    try {
      isValid = this.ajv.validate(configuredSchema, payload);
    } catch (error) {
      this.logger.error(`AJV validation error for ${transactionType} [${correlationId}]: ${String(error)}`);

      return {
        isValid: false,
        differences: [`AJV Validation Error: ${String(error)}`],
      };
    }

    if (!isValid) {
      const differences: string[] = formatValidationErrors(this.ajv.errors);

      this.logger.warn(`Schema validation failed for ${transactionType} [${correlationId}]:`);
      differences.forEach((difference, index) => {
        this.logger.warn(`  ${index + 1}. ${difference}`);
      });

      return { isValid: false, differences };
    }

    this.logger.log(`Payload validation successful for ${transactionType} [${correlationId}]`);
    return { isValid: true };
  }

  /**
   * Extracts payload from request object, excluding TxTp and TenantId
   * @param request The transactional message request
   * @returns Extracted payload object
   */
  private extractPayloadFromRequest(
    request: TransactionalMessage,
  ): { TxTp: string; TenantId?: string; payloadToValidate: Record<string, unknown> } | null {
    const { TxTp, TenantId, ...payloadData } = request;

    // If there's meaningful data after excluding metadata fields, return it
    if (Object.keys(payloadData).length > 0) {
      return { TxTp, TenantId, payloadToValidate: payloadData };
    }

    return null;
  }

  /**
   * Creates a RuleRequest object for fraud detection rules
   * @param transaction The validated payload to be analyzed
   * @param originalRequest The original request for metadata
   * @param correlationId Correlation ID for tracking
   * @param extractedDataCache The data cache extracted from mapping processing
   * @param extractedNetworkMap The network map fetched for the tenant
   * @returns RuleRequest object ready for rule processing
   */
  private createRuleRequest(
    transaction: Record<string, unknown> & { TxTp?: string },
    user: AuthenticatedUser,
    correlationId: string,
    extractedDataCache?: DataCache,
    extractedNetworkMap?: NetworkMap,
  ): RuleRequest {
    // Use extracted networkMap or create empty one
    const networkMap: NetworkMap = extractedNetworkMap ?? {};

    // Use extracted dataCache from mappings or create empty one
    const dataCache: DataCache = extractedDataCache ?? {};

    // Create metadata with context information
    const metaData: MetaData = {
      correlationId,
      timestamp: new Date().toISOString(),
      tenantId: user.token.tenantId,
      transactionType: transaction.TxTp,
    };

    const ruleRequest: RuleRequest = {
      transaction,
      networkMap,
      DataCache: dataCache,
      metaData,
    };

    this.logger.log(`Created RuleRequest for ${transaction.TxTp} with correlation ID: ${correlationId}`);
    this.logger.log(`RuleRequest DataCache entries: ${Object.keys(dataCache).length}`);
    this.logger.log(`RuleRequest NetworkMap populated: ${Object.keys(networkMap).length > 0}`);

    return ruleRequest;
  }
}
