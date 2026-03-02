import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AdminServiceClient } from '../admin-service-client';
import {
  ResponseRuleFlowDto,
  Rules,
  GlobalVariableDto,
  RequestSaveFlow,
  RuleFiltersDto,
  RequestFlow,
  RuleFlowFilterDto,
  ResponseRuleFlow,
  ResponseUpdatedRuleFlowDto,
  ResponseRuleFlowStatusDto,
} from './dto/rules.dto';
import { ParseExtractService } from '../parse-extract/parse-extract.service';
import { BASE_RULE_ID } from '../../constants/constant';
import { AuthenticatedUser } from '../auth/auth.types';
import { RuleCategory } from '../../utils/enums/rule.enum';
import { RbacService } from '../../utils/rbac/rbacHelper';
// import * as xml2js from 'xml2js';
import { parseString, ParserOptions } from 'xml2js';

import {
  createSchemaAwareNumberProcessor,
  replaceObjectsWithArrays,
  returnArrayFieldsFromSchema,
} from '../../utils/xml2js.utils';

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);
  private readonly rbacService = new RbacService();

  constructor(
    private readonly adminServiceClient: AdminServiceClient,
    private readonly parseExtractService: ParseExtractService,
  ) {}

  private isRuleEnvelope(value: unknown): value is { rules: Rules } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'rules' in value &&
      typeof (value as { rules: unknown }).rules === 'object' &&
      (value as { rules: unknown }).rules !== null
    );
  }

  private async getRuleOrThrow(id: number, token: string): Promise<Rules> {
    try {
      const response: unknown = await this.adminServiceClient.getRulesById(id, token);

      if (this.isRuleEnvelope(response)) {
        return response.rules;
      }

      return response as Rules;
    } catch (error) {
      const err = error as Error;
      console.log(error);
      this.logger.error(`Error finding rules by ID ${id}: ${err.message}`);
      throw error;
    }
  }

  async getAllRules(
    offset: number,
    limit: number,
    filters: RuleFiltersDto,
    user: AuthenticatedUser,
  ): Promise<Rules[]> {
    const updatedFilters = { ...filters };
    const normalizedRole = user.actorRole?.toLowerCase() ?? '';

    if (!this.rbacService.isRole(normalizedRole)) {
      delete updatedFilters.status;
      return this.adminServiceClient.getAllRulesWithFilters(
        offset,
        limit,
        updatedFilters,
        user.token.tokenString,
      );
    }

    const tier2 = this.rbacService.getTier2({
      role: normalizedRole,
      endpointKey: 'POST /rules/api/all' as any,
    });

    const allowedStatuses = tier2?.allowedStatuses ?? [];
    if (allowedStatuses.length > 0) {
      updatedFilters.status = allowedStatuses.join(',');
    } else {
      delete updatedFilters.status;
    }

    return this.adminServiceClient.getAllRulesWithFilters(
      offset,
      limit,
      updatedFilters,
      user.token.tokenString,
    );
  }

  async getRuleById(
    id: number,
    user: AuthenticatedUser,
  ): Promise<Rules> {
    const userRole = user.actorRole.toLowerCase() as 'editor' | 'approver' | 'publisher';
    const token = user.token.tokenString;

    const rule = await this.getRuleOrThrow(id, token);

    const currentStatus = rule.status ?? '';

    const tier2 = this.rbacService.checkTier2({
      role: userRole,
      endpointKey: 'GET /rules/api/:ruleId',
      currentStatus,
    });

    if (!tier2.allowed) {
      throw new ForbiddenException(tier2.reason ?? 'Not authorized to access this rule');
    }

    return rule;
  }

  async createRule(
    ruleData: Partial<Rules>,
    user: AuthenticatedUser,
    endpointKey: string,
  ): Promise<any> {
    try {
      const transactionType = ruleData.txtp ?? '';

      const result = await this.adminServiceClient.getPayloadByTransactionType(
        transactionType,
        user.token.tokenString,
      );
      console.log('getPayloadByTransactionType in rules.service:', JSON.stringify(result, null, 2));

      const payload = result.payload;
      let typedPayload = payload as Record<string, unknown>;

      if (result.type === 'xml') {
        const result = await this.adminServiceClient.getConfigRowByTxTp(
          transactionType,
          user.token.tokenString,
        );
        console.log('having fetched the payload, now getConfigRowByTxTp result:', result);

        const configuredSchema = result.config.schema;

        console.log('the configured scehma is :', JSON.stringify(configuredSchema, null, 2));

        const { stringFields, arrayFields } = returnArrayFieldsFromSchema(configuredSchema);

        console.log('String fields identified for number processing:', stringFields.length);
        console.log('Array fields identified for replacement:', arrayFields.length);

        const options: ParserOptions = {
          explicitArray: false,
          ignoreAttrs: false,
          mergeAttrs: true,
          explicitRoot: true,
          explicitChildren: true,
          normalize: true,
          valueProcessors: [createSchemaAwareNumberProcessor(stringFields)],
        };

        console.log('Starting XML to JSON conversion with xml2js...');

        const transformedPayload = await new Promise((resolve, reject) => {
          parseString(payload, options, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });

        console.log('XML to JSON conversion completed');

        typedPayload = replaceObjectsWithArrays(transformedPayload, arrayFields, stringFields);
        console.log('Final converted payload:', JSON.stringify(typedPayload, null, 2));
      }

      const parseResult = await this.parseExtractService.processForRuleCreation(
        { TxTp: transactionType, TenantId: user.tenantId, ...typedPayload },
        user.token.tokenString,
      );

      const rule = await this.adminServiceClient.createRule(
        ruleData,
        user.token.tokenString,
        parseResult.ruleRequest,
      );
      let updatedRule = rule;
      if (rule.id) {
        const baseRuleFlow = await this.getRuleFlow(
          BASE_RULE_ID,
          user,
          'GET /rules/api/:ruleId/flow',
        );
        const newRuleFlow = await this.adminServiceClient.createRuleFlow(
          rule.id,
          {
            flow_json_rule_builder: baseRuleFlow.result.flow_json_rule_builder
              ? baseRuleFlow.result.flow_json_rule_builder
              : {},
            flow_json_test_case: baseRuleFlow.result.flow_json_test_case
              ? baseRuleFlow.result.flow_json_test_case
              : {},
          },
          user.token.tokenString,
        );
        if (newRuleFlow) {
          updatedRule = await this.adminServiceClient.updateRule(
            rule.id,
            { flow_id: newRuleFlow.id },
            user.token.tokenString,
          );
        } else {
          this.logger.warn(
            `No flow ID returned when creating rule flow for rule ${rule.id}`,
          );
        }
      }

      return updatedRule;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error creating rule: ${err.message}`);
      throw error;
    }
  }

  async cloneRule(
    ruleId: string,
    user: AuthenticatedUser,
    payload: any,
    endpointKey: string,
  ): Promise<Rules> {
    try {
      const normalizedRole = user.actorRole.toLowerCase();

      if (!this.rbacService.isRole(normalizedRole)) {
        throw new ForbiddenException(`Role is not authorized to clone rule with ID ${ruleId}`);
      }

      const numericId = Number(ruleId);
      if (!Number.isInteger(numericId)) {
        throw new BadRequestException('Invalid ruleId. Expected a numeric value.');
      }

      const rule = await this.getRuleOrThrow(numericId, user.token.tokenString);
      const currentStatus = rule.status ?? '';

      const tier2 = this.rbacService.checkTier2({
        role: normalizedRole,
        endpointKey,
        currentStatus,
      });

      if (!tier2.allowed) {
        throw new ForbiddenException(tier2.reason ?? 'Tier 2 authorization failed');
      }

      const transactionType = payload.txtp ?? '';

      const result = await this.adminServiceClient.getPayloadByTransactionType(
        transactionType,
        user.token.tokenString,
      );
      console.log('getPayloadByTransactionType in rules.service:', JSON.stringify(result, null, 2));

      let typedPayload = result.payload as Record<string, unknown>;

      if (result.type === 'xml') {
        const result = await this.adminServiceClient.getConfigRowByTxTp(
          transactionType,
          user.token.tokenString,
        );
        console.log('having fetched the payload, now getConfigRowByTxTp result:', result);

        const configuredSchema = result.config.schema;

        console.log('the configured scehma is :', JSON.stringify(configuredSchema, null, 2));

        const { stringFields, arrayFields } = returnArrayFieldsFromSchema(configuredSchema);

        console.log('String fields identified for number processing:', stringFields.length);
        console.log('Array fields identified for replacement:', arrayFields.length);

        const options: ParserOptions = {
          explicitArray: false,
          ignoreAttrs: false,
          mergeAttrs: true,
          explicitRoot: true,
          explicitChildren: true,
          normalize: true,
          valueProcessors: [createSchemaAwareNumberProcessor(stringFields)],
        };

        console.log('Starting XML to JSON conversion with xml2js...');

        const transformedPayload = await new Promise((resolve, reject) => {
          parseString(payload, options, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });

        console.log('XML to JSON conversion completed');

        typedPayload = replaceObjectsWithArrays(transformedPayload, arrayFields, stringFields);
        console.log('Final converted payload:', JSON.stringify(typedPayload, null, 2));
      }

      const parseResult = await this.parseExtractService.processForRuleCreation(
        { TxTp: transactionType, TenantId: 'default', ...typedPayload },
        user.token.tokenString,
      );
      console.log(`Cloning rule with ID ${ruleId} and payload:`, JSON.stringify(payload, null, 2));
      return await this.adminServiceClient.cloneRule(
        ruleId,
        user.token.tokenString,
        payload,
        parseResult.ruleRequest,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error cloning rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async getRuleIds(user: AuthenticatedUser): Promise<any[]> {
    try {
      const normalizedRole = user.actorRole?.toLowerCase() ?? '';
      if (!this.rbacService.isRole(normalizedRole)) {
        throw new ForbiddenException('Role is not authorized to access rule IDs');
      }

      const tier2 = this.rbacService.getTier2({
        role: normalizedRole,
        endpointKey: 'GET /rules/api/ids',
      });

      if (!tier2.allowed) {
        throw new ForbiddenException(tier2.reason ?? 'Not authorized to access rule IDs');
      }

      return await this.adminServiceClient.getRuleIds(user.token.tokenString);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching rule IDs: ${err.message}`);
      throw error;
    }
  }

  async getRuleConfiguration(
    ruleId: string,
    user: AuthenticatedUser,
    endpointKey: string,
  ): Promise<any> {
    try {
      const normalizedRole = user.actorRole?.toLowerCase() ?? '';

      if (!this.rbacService.isRole(normalizedRole)) {
        throw new ForbiddenException('Role is not authorized to access rule configuration');
      }

      const tier2 = this.rbacService.getTier2({
        role: normalizedRole,
        endpointKey,
      });

      if (!tier2.allowed) {
        throw new ForbiddenException(
          tier2.reason ?? 'Not authorized to access rule configuration',
        );
      }
      return await this.adminServiceClient.getRuleConfiguration(ruleId, user.token.tokenString);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error fetching configuration for rule ${ruleId}: ${err.message}`,
      );
      throw error;
    }
  }

  async updateRule(
    ruleId: string,
    updateData: Partial<Rules>,
    user: AuthenticatedUser,
    endpointKey: string,
  ): Promise<Rules> {
    try {
      const normalizedRole = user.actorRole.toLowerCase();

      if (!this.rbacService.isRole(normalizedRole)) {
        throw new ForbiddenException('Role is not authorized to update rule status');
      }

      const numericId = Number(ruleId);
      if (!Number.isInteger(numericId)) {
        throw new BadRequestException('Invalid ruleId. Expected a numeric value.');
      }

      const rule = await this.getRuleOrThrow(numericId, user.token.tokenString);
      const currentStatus = rule.status ?? '';

      const tier2 = this.rbacService.checkTier2({
        role: normalizedRole,
        endpointKey,
        currentStatus,
      });

      if (!tier2.allowed) {
        throw new ForbiddenException(tier2.reason ?? 'Tier 2 authorization failed');
      }

      if (updateData.status) {
        const tier3 = this.rbacService.checkTier3({
          role: normalizedRole,
          endpointKey,
          currentStatus,
          targetStatus: updateData.status,
        });
        if (!tier3.allowed) {
          throw new ForbiddenException(tier3.reason ?? 'Tier 3 authorization failed');
        }
      }

      return await this.adminServiceClient.updateRule(
        ruleId,
        updateData,
        user.token.tokenString,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error updating rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async getActiveNetworkMap(token: string): Promise<any> {
    try {
      return await this.adminServiceClient.getActiveNetworkMap(token);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching active network map: ${err.message}`);
      throw error;
    }
  }

  async getRuleFlow(
    ruleId: string,
    user: AuthenticatedUser,
    endpointKey: string,
    filters?: RuleFlowFilterDto,
  ): Promise<ResponseRuleFlow> {
    try {
      const normalizedRole = user.actorRole.toLowerCase();

      if (!this.rbacService.isRole(normalizedRole)) {
        throw new ForbiddenException('Role is not authorized to update rule status');
      }

      const numericId = Number(ruleId);
      if (!Number.isInteger(numericId)) {
        throw new BadRequestException('Invalid ruleId. Expected a numeric value.');
      }

      const rule = await this.getRuleOrThrow(numericId, user.token.tokenString);
      const currentStatus = rule.status ?? '';

      const tier2 = this.rbacService.checkTier2({
        role: normalizedRole,
        endpointKey,
        currentStatus,
      });

      if (!tier2.allowed) {
        throw new ForbiddenException(tier2.reason ?? 'Tier 2 authorization failed');
      }
      const ruleFlow = await this.adminServiceClient.getRuleFlow(
        ruleId,
        user.token.tokenString,
        filters,
      );
      return ruleFlow;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error fetching flow for rule ${ruleId}: ${err.message}`,
      );
      throw error;
    }
  }

  async getRuleFlowStatus(
    ruleId: string,
    user: AuthenticatedUser,
    endpointKey: string,
    filters?: RuleFlowFilterDto,
  ): Promise<ResponseRuleFlowStatusDto> {
    try {
      const normalizedRole = user.actorRole.toLowerCase();

      if (!this.rbacService.isRole(normalizedRole)) {
        throw new ForbiddenException('Role is not authorized to update rule status');
      }

      const numericId = Number(ruleId);
      if (!Number.isInteger(numericId)) {
        throw new BadRequestException('Invalid ruleId. Expected a numeric value.');
      }

      const rule = await this.getRuleOrThrow(numericId, user.token.tokenString);
      const currentStatus = rule.status ?? '';

      const tier2 = this.rbacService.checkTier2({
        role: normalizedRole,
        endpointKey,
        currentStatus,
      });

      if (!tier2.allowed) {
        throw new ForbiddenException(tier2.reason ?? 'Tier 2 authorization failed');
      }
      const status = await this.adminServiceClient.getRuleFlowStatus(
        ruleId,
        user.token.tokenString,
        filters,
      );
      return status;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error fetching flow status for rule ${ruleId}: ${err.message}`,
      );
      throw error;
    }
  }

  async createRuleFlow(
    ruleId: string,
    body: RequestFlow,
    user: AuthenticatedUser,
  ): Promise<ResponseRuleFlowDto> {
    try {
      return await this.adminServiceClient.createRuleFlow(
        ruleId,
        body,
        user.token.tokenString,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error creating flow for rule ${ruleId}: ${err.message}`,
      );
      throw error;
    }
  }

  async updateRuleFlow(
    ruleId: string,
    payload: RequestSaveFlow,
    user: AuthenticatedUser,
    endpointKey: string,
  ): Promise<ResponseUpdatedRuleFlowDto> {
    try {
      const normalizedRole = user.actorRole.toLowerCase();

      if (!this.rbacService.isRole(normalizedRole)) {
        throw new ForbiddenException('Role is not authorized to update rule status');
      }

      const numericId = Number(ruleId);
      if (!Number.isInteger(numericId)) {
        throw new BadRequestException('Invalid ruleId. Expected a numeric value.');
      }

      const rule = await this.getRuleOrThrow(numericId, user.token.tokenString);
      const currentStatus = rule.status ?? '';

      const tier2 = this.rbacService.checkTier2({
        role: normalizedRole,
        endpointKey,
        currentStatus,
      });

      if (!tier2.allowed) {
        throw new ForbiddenException(tier2.reason ?? 'Tier 2 authorization failed');
      }

      return await this.adminServiceClient.updateRuleFlow(
        ruleId,
        payload,
        user.token.tokenString,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error updating flow for rule ${ruleId}: ${err.message}`,
      );
      throw error;
    }
  }

  getRulesStatusbyRole(user: AuthenticatedUser): string[] {
    return user.allowedStatuses ?? [];
  }

  async getGlobalVariables(
    ruleId: string,
    user: AuthenticatedUser,
    endpointKey: string,
  ): Promise<GlobalVariableDto> {
    try {
      const normalizedRole = user.actorRole.toLowerCase();

      if (!this.rbacService.isRole(normalizedRole)) {
        throw new ForbiddenException(
          'Role is not authorized to read global variables of the rule ',
          ruleId,
        );
      }

      const numericId = Number(ruleId);
      if (!Number.isInteger(numericId)) {
        throw new BadRequestException('Invalid ruleId. Expected a numeric value.');
      }

      const rule = await this.getRuleOrThrow(numericId, user.token.tokenString);
      const currentStatus = rule.status ?? '';

      const tier2 = this.rbacService.checkTier2({
        role: normalizedRole,
        endpointKey,
        currentStatus,
      });

      if (!tier2.allowed) {
        throw new ForbiddenException(tier2.reason ?? 'Tier 2 authorization failed');
      }
      const ruleData = await this.adminServiceClient.getGlobalVariables(
        ruleId,
        user.tenantId,
        user.token.tokenString,
      );
      return ruleData;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error fetching global variables for rule ${ruleId}: ${err.message}`,
      );
      throw error;
    }
  }

  async updateRuleStatus(
    ruleId: string,
    status: string,
    reason: string,
    user: AuthenticatedUser,
    endpointKey: string,
  ): Promise<Rules> {
    try {
      const normalizedRole = user.actorRole.toLowerCase();

      if (!this.rbacService.isRole(normalizedRole)) {
        throw new ForbiddenException(
          `Role ${normalizedRole} is not authorized to update rule status for rule ${ruleId}`,
        );
      }

      const numericId = Number(ruleId);
      if (!Number.isInteger(numericId)) {
        throw new BadRequestException('Invalid ruleId. Expected a numeric value.');
      }

      const rule = await this.getRuleOrThrow(numericId, user.token.tokenString);
      const currentStatus = rule.status ?? '';

      const tier2 = this.rbacService.checkTier2({
        role: normalizedRole,
        endpointKey,
        currentStatus,
      });

      if (!tier2.allowed) {
        throw new ForbiddenException(tier2.reason ?? 'Tier 2 authorization failed');
      }

      const tier3 = this.rbacService.checkTier3({
        role: normalizedRole,
        endpointKey,
        currentStatus,
        targetStatus: status,
      });

      if (!tier3.allowed) {
        throw new ForbiddenException(tier3.reason ?? 'Tier 3 authorization failed');
      }

      return await this.adminServiceClient.updateRuleStatus(
        ruleId,
        status,
        reason,
        user.token.tokenString,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error updating status for rule ${ruleId}: ${err.message}`,
      );
      throw error;
    }
  }
}
