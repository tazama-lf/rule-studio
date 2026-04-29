import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
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
import { EventType } from '../../utils/enums/events.enum';
import { NotificationService } from '../notification/notification.service';
import { EndpointKey, RbacService } from '../../utils/rbac/rbacHelper';

type CloneRulePayload = Record<string, unknown> & { txtp?: string; txtpVersion?: string };

const STATUS_EVENT_MATRIX: Record<string, EventType> = {
  STATUS_03_UNDER_REVIEW: EventType.EditorSubmit,
  STATUS_04_APPROVED: EventType.ApproverApprove,
  STATUS_05_REJECTED: EventType.ApproverReject,
  STATUS_08_DEPLOYED: EventType.PublisherDeploy,
  ACTIVE: EventType.PublisherActivate,
  INACTIVE: EventType.PublisherDeactivate,
} as const;

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);
  private readonly rbacService = new RbacService();
  constructor(
    private readonly adminServiceClient: AdminServiceClient,
    private readonly parseExtractService: ParseExtractService,
    private readonly notificationService: NotificationService,
  ) {}

  private isRuleEnvelope(value: unknown): value is { rules: Rules } {
    if (typeof value !== 'object' || value === null || !('rules' in value)) {
      return false;
    }

    const rulesValue = Reflect.get(value, 'rules');
    return typeof rulesValue === 'object' && rulesValue !== null;
  }

  private async getRuleOrThrow(id: number, token: string): Promise<Rules> {
    try {
      const response: unknown = await this.adminServiceClient.getRulesById(id, token);
      if (this.isRuleEnvelope(response)) return response.rules;
      return response as Rules;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error finding rules by ID ${id}: ${err.message}`);
      throw error;
    }
  }

  private mapStatusToEventType(status: string): EventType | null {
    const normalizedStatus = status.toUpperCase();
    return STATUS_EVENT_MATRIX[normalizedStatus] ?? null;
  }

  async getAllRules(offset: number, limit: number, filters: RuleFiltersDto, user: AuthenticatedUser): Promise<Rules[]> {
    const updatedFilters = filters;
    const normalizedRole = this.rbacService.getNormalizedRole(user);
    const tier2 = this.rbacService.getTier2({ role: normalizedRole, endpointKey: 'POST /rules/api/all' });
    if (!tier2.allowed) {
      throw new ForbiddenException(tier2.reason ?? 'Not authorized to access rules');
    }
    if (tier2.allowedStatuses && tier2.allowedStatuses.length > 0) {
      if (filters.status && tier2.allowedStatuses.includes(filters.status)) {
        updatedFilters.status = filters.status;
      } else {
        updatedFilters.status = tier2.allowedStatuses.join(',');
      }
    } else {
      delete updatedFilters.status;
    }
    return await this.adminServiceClient.getAllRulesWithFilters(offset, limit, updatedFilters, user.token.tokenString);
  }

  async getRuleById(id: number, user: AuthenticatedUser): Promise<Rules> {
    const normalizedRole = this.rbacService.getNormalizedRole(user);
    const token = user.token.tokenString;
    const rule = await this.getRuleOrThrow(id, token);
    const currentStatus = rule.status ?? '';
    const tier2 = this.rbacService.checkTier2({ role: normalizedRole, endpointKey: 'GET /rules/api/:ruleId', currentStatus });
    if (!tier2.allowed) throw new ForbiddenException(tier2.reason ?? 'Not authorized to access this rule');
    return rule;
  }

  async createRule(ruleData: Partial<Rules>, user: AuthenticatedUser): Promise<Rules> {
    try {
      const endpointKey: EndpointKey = 'POST /rules/api/create';
      const normalizedRole = this.rbacService.getNormalizedRole(user);
      if (!this.rbacService.isRole(normalizedRole)) throw new ForbiddenException('Role is not authorized to create rules');
      const tier2 = this.rbacService.getTier2({ role: normalizedRole, endpointKey });
      if (!tier2.allowed) throw new ForbiddenException(tier2.reason ?? 'Not authorized to create rules');
      const transactionType = ruleData.txtp ?? '';
      const transactionVersion = ruleData.txtpVersion ?? ruleData.txtp_version ?? '';
      const result = await this.adminServiceClient.getConfigRowByTxTp(transactionType, transactionVersion, user.token.tokenString);
      const schemaResult = result.config.schema;
      const mappingResult = result.config.mapping;
      const payloadResult = result.config.payload;
      const parseResult = await this.parseExtractService.processForRuleCreation(
        transactionType,
        transactionVersion,
        schemaResult,
        mappingResult,
        payloadResult,
        user,
      );
      if (!parseResult.ruleRequest) {
        this.logger.error(`Rule request is missing in parse result for transaction type ${transactionType}`);
        throw new BadRequestException('Failed to generate rule request from payload');
      }
      const rule = await this.adminServiceClient.createRule(ruleData, user.token.tokenString, parseResult.ruleRequest);
      if (rule.id) {
        const baseRuleFlow = await this.getRuleFlow(BASE_RULE_ID, user, 'GET /rules/api/:ruleId/flow');
        await this.adminServiceClient.createRuleFlow(
          rule.id,
          {
            flow_json_rule_builder: baseRuleFlow.result.flow_json_rule_builder ?? {},
            flow_json_test_case: baseRuleFlow.result.flow_json_test_case ?? {},
          },
          user.token.tokenString,
        );
      }
      return rule;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error creating rule: ${err.message}`);
      throw error;
    }
  }

  async cloneRule(ruleId: string, user: AuthenticatedUser, payload: CloneRulePayload): Promise<Rules> {
    try {
      const endpointKey: EndpointKey = 'POST /rules/api/clone/:ruleId';
      const normalizedRole = this.rbacService.getNormalizedRole(user);
      if (!this.rbacService.isRole(normalizedRole)) throw new ForbiddenException(`Role is not authorized to clone rule with ID ${ruleId}`);
      const numericId = Number(ruleId);
      if (!Number.isInteger(numericId)) throw new BadRequestException('Invalid ruleId. Expected a numeric value.');
      const rule = await this.getRuleOrThrow(numericId, user.token.tokenString);
      const currentStatus = rule.status ?? '';
      const tier2 = this.rbacService.checkTier2({ role: normalizedRole, endpointKey, currentStatus });
      if (!tier2.allowed) throw new ForbiddenException(tier2.reason ?? 'Tier 2 authorization failed');
      return await this.adminServiceClient.cloneRule(ruleId, user.token.tokenString, payload);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error cloning rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async getRuleIds(user: AuthenticatedUser): Promise<Array<Record<string, unknown>>> {
    try {
      const normalizedRole = this.rbacService.getNormalizedRole(user);
      if (!this.rbacService.isRole(normalizedRole)) throw new ForbiddenException('Role is not authorized to access rule IDs');
      const tier2 = this.rbacService.getTier2({ role: normalizedRole, endpointKey: 'GET /rules/api/ids' });
      if (!tier2.allowed) throw new ForbiddenException(tier2.reason ?? 'Not authorized to access rule IDs');
      return await this.adminServiceClient.getRuleIds(user.token.tokenString);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching rule IDs: ${err.message}`);
      throw error;
    }
  }

  async getRuleConfiguration(ruleId: string, user: AuthenticatedUser, endpointKey: EndpointKey): Promise<Record<string, unknown>> {
    try {
      const normalizedRole = this.rbacService.getNormalizedRole(user);
      if (!this.rbacService.isRole(normalizedRole)) throw new ForbiddenException('Role is not authorized to access rule configuration');
      const tier2 = this.rbacService.getTier2({ role: normalizedRole, endpointKey });
      if (!tier2.allowed) throw new ForbiddenException(tier2.reason ?? 'Not authorized to access rule configuration');
      return await this.adminServiceClient.getRuleConfiguration(ruleId, user.token.tokenString);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching configuration for rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async updateRule(ruleId: string, updateData: Partial<Rules>, user: AuthenticatedUser, endpointKey: EndpointKey): Promise<Rules> {
    try {
      const normalizedRole = this.rbacService.getNormalizedRole(user);
      if (!this.rbacService.isRole(normalizedRole)) throw new ForbiddenException('Role is not authorized to update rule status');
      const numericId = Number(ruleId);
      if (!Number.isInteger(numericId)) throw new BadRequestException('Invalid ruleId. Expected a numeric value.');
      const rule = await this.getRuleOrThrow(numericId, user.token.tokenString);
      const currentStatus = rule.status ?? '';
      const tier2 = this.rbacService.checkTier2({ role: normalizedRole, endpointKey, currentStatus });
      if (!tier2.allowed) throw new ForbiddenException(tier2.reason ?? 'Tier 2 authorization failed');
      if (updateData.status) {
        const tier3 = this.rbacService.checkTier3({ role: normalizedRole, endpointKey, currentStatus, targetStatus: updateData.status });
        if (!tier3.allowed) throw new ForbiddenException(tier3.reason ?? 'Tier 3 authorization failed');
      }
      return await this.adminServiceClient.updateRule(ruleId, updateData, user.token.tokenString);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error updating rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async getActiveNetworkMap(token: string): Promise<Record<string, unknown>> {
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
    endpointKey: EndpointKey,
    filters?: RuleFlowFilterDto,
  ): Promise<ResponseRuleFlow> {
    try {
      const normalizedRole = this.rbacService.getNormalizedRole(user);
      if (!this.rbacService.isRole(normalizedRole)) throw new ForbiddenException('Role is not authorized to view rule flow');
      const numericId = Number(ruleId);
      if (!Number.isInteger(numericId)) throw new BadRequestException('Invalid ruleId. Expected a numeric value.');
      const rule = await this.getRuleOrThrow(numericId, user.token.tokenString);
      const currentStatus = rule.status ?? '';
      const tier2 = this.rbacService.checkTier2({ role: normalizedRole, endpointKey, currentStatus });
      if (!tier2.allowed) throw new ForbiddenException(tier2.reason ?? 'Tier 2 authorization failed');
      return await this.adminServiceClient.getRuleFlow(ruleId, user.token.tokenString, filters);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching flow for rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async getRuleFlowStatus(
    ruleId: string,
    user: AuthenticatedUser,
    endpointKey: EndpointKey,
    filters?: RuleFlowFilterDto,
  ): Promise<ResponseRuleFlowStatusDto> {
    try {
      const normalizedRole = this.rbacService.getNormalizedRole(user);
      if (!this.rbacService.isRole(normalizedRole)) throw new ForbiddenException('Role is not authorized to view rule flow status');
      const numericId = Number(ruleId);
      if (!Number.isInteger(numericId)) throw new BadRequestException('Invalid ruleId. Expected a numeric value.');
      const rule = await this.getRuleOrThrow(numericId, user.token.tokenString);
      const currentStatus = rule.status ?? '';
      const tier2 = this.rbacService.checkTier2({ role: normalizedRole, endpointKey, currentStatus });
      if (!tier2.allowed) throw new ForbiddenException(tier2.reason ?? 'Tier 2 authorization failed');
      return await this.adminServiceClient.getRuleFlowStatus(ruleId, user.token.tokenString, filters);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching flow status for rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async createRuleFlow(ruleId: string, body: RequestFlow, user: AuthenticatedUser): Promise<ResponseRuleFlowDto> {
    try {
      const endpointKey: EndpointKey = 'POST /rules/api/:ruleId/flow';
      const normalizedRole = this.rbacService.getNormalizedRole(user);
      if (!this.rbacService.isRole(normalizedRole)) throw new ForbiddenException('Role is not authorized to create rule flow');
      const numericId = Number(ruleId);
      if (!Number.isInteger(numericId)) throw new BadRequestException('Invalid ruleId. Expected a numeric value.');
      const rule = await this.getRuleOrThrow(numericId, user.token.tokenString);
      const currentStatus = rule.status ?? '';
      const tier2 = this.rbacService.checkTier2({ role: normalizedRole, endpointKey, currentStatus });
      if (!tier2.allowed) throw new ForbiddenException(tier2.reason ?? 'Tier 2 authorization failed');
      return await this.adminServiceClient.createRuleFlow(ruleId, body, user.token.tokenString);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error creating flow for rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async updateRuleFlow(
    ruleId: string,
    payload: RequestSaveFlow,
    user: AuthenticatedUser,
    endpointKey: EndpointKey,
  ): Promise<ResponseUpdatedRuleFlowDto> {
    try {
      const normalizedRole = this.rbacService.getNormalizedRole(user);
      if (!this.rbacService.isRole(normalizedRole)) throw new ForbiddenException('Role is not authorized to update rule flow');
      const numericId = Number(ruleId);
      if (!Number.isInteger(numericId)) throw new BadRequestException('Invalid ruleId. Expected a numeric value.');
      const rule = await this.getRuleOrThrow(numericId, user.token.tokenString);
      const currentStatus = rule.status ?? '';
      const tier2 = this.rbacService.checkTier2({ role: normalizedRole, endpointKey, currentStatus });
      if (!tier2.allowed) throw new ForbiddenException(tier2.reason ?? 'Tier 2 authorization failed');
      return await this.adminServiceClient.updateRuleFlow(ruleId, payload, user.token.tokenString);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error updating flow for rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  getRulesStatusbyRole(user: AuthenticatedUser): string[] {
    const normalizedRole = this.rbacService.getNormalizedRole(user);
    if (!this.rbacService.isRole(normalizedRole)) return [];
    const tier2 = this.rbacService.getTier2({ role: normalizedRole, endpointKey: 'GET /rules/api/status' });
    return tier2.allowedStatuses ?? [];
  }

  async getGlobalVariables(ruleId: string, user: AuthenticatedUser, endpointKey: EndpointKey): Promise<GlobalVariableDto> {
    try {
      const normalizedRole = this.rbacService.getNormalizedRole(user);
      const numericId = Number(ruleId);
      if (!Number.isInteger(numericId)) throw new BadRequestException('Invalid ruleId. Expected a numeric value.');
      const rule = await this.getRuleOrThrow(numericId, user.token.tokenString);
      const currentStatus = rule.status ?? '';
      const tier2 = this.rbacService.checkTier2({ role: normalizedRole, endpointKey, currentStatus });
      if (!tier2.allowed) throw new ForbiddenException(tier2.reason ?? 'Tier 2 authorization failed');
      return await this.adminServiceClient.getGlobalVariables(ruleId, user.token.tokenString);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching global variables for rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async updateRuleStatus(
    ruleId: string,
    status: string,
    reason: string,
    user: AuthenticatedUser,
    endpointKey: EndpointKey,
  ): Promise<Rules> {
    const numericId = Number(ruleId);
    if (!Number.isInteger(numericId)) throw new BadRequestException('Invalid ruleId. Expected a numeric value.');

    const normalizedRole = this.rbacService.getNormalizedRole(user);
    const token = user.token.tokenString;
    const rule = await this.getRuleOrThrow(numericId, token);
    const currentStatus = rule.status ?? '';

    // Authorization checks
    const tier2 = this.rbacService.checkTier2({ role: normalizedRole, endpointKey, currentStatus });
    if (!tier2.allowed) throw new ForbiddenException(tier2.reason ?? 'Tier 2 authorization failed');

    const tier3 = this.rbacService.checkTier3({ role: normalizedRole, endpointKey, currentStatus, targetStatus: status });
    if (!tier3.allowed) throw new ForbiddenException(tier3.reason ?? 'Tier 3 authorization failed');

    // Update status
    const updatedRule = await this.adminServiceClient.updateRuleStatus(ruleId, status, reason, token);

    // Send notification if status changed
    const eventType = this.mapStatusToEventType(status);
    if (eventType) {
      try {
        await this.notificationService.sendRuleWorkflowNotification(eventType, user, updatedRule, reason);
      } catch (notificationError) {
        this.logger.warn(`Failed to send notification for rule ${ruleId}: ${(notificationError as Error).message}`);
      }
    }

    return updatedRule;
  }
}
