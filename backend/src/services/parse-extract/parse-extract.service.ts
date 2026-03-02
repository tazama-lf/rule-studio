import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { EndpointKey, RbacService } from '../../utils/rbac/rbacHelper';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { randomUUID } from 'node:crypto';
import { processMappings } from '@tazama-lf/tcs-lib';
import {
  TransactionalMessage,
  ParseExtractResponse,
  RuleRequest,
  NetworkMap,
  DataCache,
  MetaData,
} from './dto/message.dto';
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

  async processTransactionalMessage(
    request: TransactionalMessage,
    user: AuthenticatedUser,
    endpointKey: EndpointKey,
  ): Promise<ParseExtractResponse> {
    const correlationId = randomUUID();

    try {
      const normalizedRole = user.actorRole?.toLowerCase() ?? '';
      if (!this.rbacService.isRole(normalizedRole)) {
        throw new ForbiddenException(
          `Role ${normalizedRole} is not authorized to process transactional messages`,
        );
      }

      const tier2 = this.rbacService.getTier2({
        role: normalizedRole,
        endpointKey,
      });

      if (!tier2.allowed) {
        throw new ForbiddenException(
          tier2.reason ??
            `Role ${normalizedRole} is not authorized to process transactional messages`,
        );
      }

      this.logger.log(
        `Processing transactional message for ${request.TxTp} [${correlationId}]`,
      );
      this.logger.log(`tenant id is ${request.TenantId}`);
      const result = await this.processTransactionPayload(
        request,
        user.token.tokenString,
        correlationId,
      );

      if (!result.success) {
        return {
          success: false,
          message: result.message,
          processedAt: new Date().toISOString(),
          transactionType: request.TxTp,
          correlationId,
          validationErrors: result.validationErrors,
          configPayload: result.configPayload,
        };
      }

      const response: ParseExtractResponse = {
        success: true,
        message: `Successfully validated and processed ${request.TxTp} message`,
        processedAt: new Date().toISOString(),
        configPayload: result.configPayload,
        transactionType: request.TxTp,
        correlationId,
        validatedPayload: result.validatedPayload,
        ruleRequest: result.ruleRequest,
      };

      this.logger.log(
        `Message processing completed successfully for type: ${request.TxTp} [${correlationId}]`,
      );

      return response;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error processing transactional message [${correlationId}]: ${err.message}`,
        err.stack,
      );

      return {
        success: false,
        message: `Failed to process message: ${err.message}`,
        processedAt: new Date().toISOString(),
        transactionType: request.TxTp,
        correlationId,
      };
    }
  }

  /**
   * Core logic - fetch schema -> validate payload -> process mappings -> create RuleRequest
   * @param request The transactional message request
   * @param token Authentication token
   * @param correlationId Correlation ID for tracking
   * @returns Processing result with all necessary data
   */
  async processTransactionPayload(
    request: TransactionalMessage,
    token: string,
    correlationId: string,
  ): Promise<{
    success: boolean;
    message: string;
    validationErrors?: string[];
    configPayload?: any;
    validatedPayload?: any;
    ruleRequest?: RuleRequest;
  }> {
    // 1. Fetch schema from database via Admin Service
    const adminServiceResponse =
      await this.adminServiceClient.getConfigRowByTxTp(
        request.TxTp, // needs to be sent for saving ruleRequest in db table
        token,
      );

    if (!adminServiceResponse.config?.schema) {
      const errorMsg = `No schema configuration found for transaction type: ${request.TxTp}`;
      this.logger.warn(errorMsg);

      return {
        success: false,
        message: errorMsg,
      };
    }

    this.logger.log(`Found schema configuration for: ${request.TxTp}`);

    // 2. Extract payload to validate - exclude TxTp and TenantId from request
    const extractedData = this.extractPayloadFromRequest(request);

    if (!extractedData?.payloadToValidate) {
      return {
        success: false,
        message: 'No payload found to validate',
      };
    }

    const { TxTp, TenantId, payloadToValidate } = extractedData;

    // 3. Validate payload against schema thru AJV
    const validationResult = await this.validatePayload(
      payloadToValidate,
      adminServiceResponse.config.schema,
      request.TxTp,
      correlationId,
    );

    if (!validationResult.isValid) {
      return {
        success: false,
        message: 'Payload validation failed',
        validationErrors: validationResult.differences,
        configPayload: adminServiceResponse,
      };
    }

    // 4. After validation now, I will fetch mappings from config Table
    // and create the DataCache object based on that
    // we will utilize the TCS-LIB process mappings over here

    // Process mappings to extract dataCache and transaction relationship
    payloadToValidate.TxTp = TxTp;
    payloadToValidate.TenantId = TenantId;
   
    const mappingResult = processMappings(
      payloadToValidate,
      adminServiceResponse.config.mapping ?? [], // where is this coming form?
      request.TxTp,
    );

    // Fetch active network map for the tenant
    const activeNetworkMap =
      await this.adminServiceClient.getActiveNetworkMap(token);

    const networkMap: NetworkMap = activeNetworkMap ?? {};

    this.logger.log(
      `Processed mappings for ${request.TxTp}: extracted ${Object.keys(mappingResult.dataCache).length} data cache entries`,
    );

    // we create the RuleRequest object here
    const ruleRequest: RuleRequest = this.createRuleRequest(
      payloadToValidate,
      request,
      correlationId,
      mappingResult.dataCache,
      networkMap,
    );

    return {
      success: true,
      message: `Successfully validated and processed ${request.TxTp} message`,
      configPayload: adminServiceResponse,
      validatedPayload: payloadToValidate,
      ruleRequest,
    };
  }

  /**
   * Core logic = calls processTransactionPayload - fetch schema -> validate payload -> process mappings -> create RuleRequest
   * @param request The transactional message request
   * @param token Authentication token
   * @returns Processing result optimized for rule creation
   */
  async processForRuleCreation(
    request: TransactionalMessage,
    token: string,
  ): Promise<{
    success: boolean;
    message: string;
    correlationId: string;
    ruleRequest?: RuleRequest;
    validatedPayload?: any;
    configPayload?: any;
    validationErrors?: string[];
  }> {
    const correlationId = randomUUID();

    try {
      this.logger.log(
        `Processing transaction data for rule creation - TxTp: ${request.TxTp} [${correlationId}]`,
      );

      // CstmrCdtTrfInitn should be the root

      const result = await this.processTransactionPayload(
        request,
        token,
        correlationId,
      );

      return {
        success: result.success,
        message: result.message,
        correlationId,
        ruleRequest: result.ruleRequest,
        validatedPayload: result.validatedPayload,
        configPayload: result.configPayload,
        validationErrors: result.validationErrors,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error processing transaction data for rule creation [${correlationId}]: ${err.message}`,
        err.stack,
      );

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
  private async validatePayload(
    payload: any,
    configuredSchema: any,
    transactionType: string,
    correlationId: string,
  ): Promise<{ isValid: boolean; differences?: string[] }> {
    let isValid: boolean;

    try {
      isValid = this.ajv.validate(configuredSchema, payload);
    } catch (error) {
      this.logger.error(
        `AJV validation error for ${transactionType} [${correlationId}]: ${String(error)}`,
      );

      return {
        isValid: false,
        differences: [`AJV Validation Error: ${String(error)}`],
      };
    }

    if (!isValid) {
      const differences: string[] = formatValidationErrors(this.ajv.errors);

      this.logger.warn(
        `Schema validation failed for ${transactionType} [${correlationId}]:`,
      );
      differences.forEach((difference, index) => {
        this.logger.warn(`  ${index + 1}. ${difference}`);
      });

      return { isValid: false, differences };
    }

    this.logger.log(
      `Payload validation successful for ${transactionType} [${correlationId}]`,
    );
    return { isValid: true };
  }

  /**
   * Extracts payload from request object, excluding TxTp and TenantId
   * @param request The transactional message request
   * @returns Extracted payload object
   */
  private extractPayloadFromRequest(request: TransactionalMessage): any {
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
    transaction: any,
    originalRequest: TransactionalMessage,
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
      tenantId: originalRequest.TenantId,
      transactionType: originalRequest.TxTp,
    };

    const ruleRequest: RuleRequest = {
      transaction,
      networkMap,
      DataCache: dataCache,
      metaData,
    };

    this.logger.log(
      `Created RuleRequest for ${originalRequest.TxTp} with correlation ID: ${correlationId}`,
    );
    this.logger.log(
      `RuleRequest DataCache entries: ${Object.keys(dataCache).length}`,
    );
    this.logger.log(
      `RuleRequest NetworkMap populated: ${Object.keys(networkMap).length > 0}`,
    );

    return ruleRequest;
  }
}
