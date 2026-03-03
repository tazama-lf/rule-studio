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
import { FieldMapping } from 'node_modules/@tazama-lf/tcs-lib/dist/src/interfaces/schema.interfaces';
import { EventType } from 'src/utils/enums/events.enum';
import { NotificationService } from '../notification/notification.service';
import { RuleCategory } from '../../utils/enums/rule.enum';
import { EndpointKey, RbacService } from '../../utils/rbac/rbacHelper';

type CloneRulePayload = Record<string, unknown> & { txtp?: string; txtpVersion?: string };

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);
  private readonly rbacService = new RbacService();
  constructor(
    private readonly adminServiceClient: AdminServiceClient,
    private readonly parseExtractService: ParseExtractService,
    private readonly notificationService: NotificationService,
  ) { }

  private isRuleEnvelope(value: unknown): value is { rules: Rules } {
    return (
      typeof value === 'object' && value !== null && 'rules' in value &&
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
      this.logger.error(`Error finding rules by ID ${id}: ${err.message}`);
      throw error;
    }
  }

  private getNormalizedRole(user: AuthenticatedUser): string {
    return user.actorRole?.toLowerCase() ?? '';
  }

  async getAllRules(offset: number, limit: number, filters: RuleFiltersDto, user: AuthenticatedUser): Promise<Rules[]> {
    const updatedFilters = { ...filters };
    const normalizedRole = this.getNormalizedRole(user);

    if (!this.rbacService.isRole(normalizedRole)) {
      delete updatedFilters.status;
      return this.adminServiceClient.getAllRulesWithFilters(offset, limit, updatedFilters, user.token.tokenString);
    }

    const tier2 = this.rbacService.getTier2({
      role: normalizedRole,
      endpointKey: 'POST /rules/api/all' as EndpointKey,
    });

    const allowedStatuses = tier2?.allowedStatuses ?? [];
    if (allowedStatuses.length > 0) {
      updatedFilters.status = allowedStatuses.join(',');
    } else {
      delete updatedFilters.status;
    }

    return this.adminServiceClient.getAllRulesWithFilters(offset, limit, updatedFilters, user.token.tokenString);
  }

  async getRuleById(
    id: number,
    user: AuthenticatedUser,
  ): Promise<Rules> {
    const normalizedRole = this.getNormalizedRole(user);
    if (!this.rbacService.isRole(normalizedRole)) {
      throw new ForbiddenException('Role is not authorized to access this rule');
    }
    const token = user.token.tokenString;

    const rule = await this.getRuleOrThrow(id, token);

    const currentStatus = rule.status ?? '';

    const tier2 = this.rbacService.checkTier2({
      role: normalizedRole,
      endpointKey: 'GET /rules/api/:ruleId',
      currentStatus,
    });

    if (!tier2.allowed) {
      throw new ForbiddenException(tier2.reason ?? 'Not authorized to access this rule');
    }

    return rule;
  }

  async createRule(ruleData: Partial<Rules>, user: AuthenticatedUser): Promise<Rules> {
    try {
      const endpointKey = 'POST /rules/api/create' as EndpointKey;
      const normalizedRole = this.getNormalizedRole(user);

      if (!this.rbacService.isRole(normalizedRole)) {
        throw new ForbiddenException('Role is not authorized to create rules');
      }

      const tier2 = this.rbacService.getTier2({
        role: normalizedRole,
        endpointKey,
      });

      if (!tier2.allowed) {
        throw new ForbiddenException(
          tier2.reason ?? 'Not authorized to create rules',
        );
      }
      
      const transactionType = ruleData.txtp ?? '';
      const transactionVersion = ruleData.txtpVersion ?? '';
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
        throw new Error('Failed to generate rule request from payload');
      }

      const rule = await this.adminServiceClient.createRule(ruleData, user.token.tokenString, parseResult.ruleRequest);
      if (rule.id) {
        const baseRuleFlow = await this.getRuleFlow(BASE_RULE_ID, user.token.tokenString);
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
      const normalizedRole = this.getNormalizedRole(user);

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
      
      return await this.adminServiceClient.cloneRule(ruleId, user.token.tokenString, payload);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error cloning rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async getRuleIds(user: AuthenticatedUser): Promise<Array<Record<string, unknown>>> {
    try {
      const normalizedRole = this.getNormalizedRole(user);
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

  async getRuleConfiguration(ruleId: string, user: AuthenticatedUser, endpointKey: EndpointKey): Promise<Record<string, unknown>> {
    try {
      const normalizedRole = this.getNormalizedRole(user);

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
      this.logger.error(`Error fetching configuration for rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async updateRule(
    ruleId: string,
    updateData: Partial<Rules>,
    user: AuthenticatedUser,
    endpointKey: EndpointKey,
  ): Promise<Rules> {
    try {
      const normalizedRole = this.getNormalizedRole(user);

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

  async getActiveNetworkMap(token: string): Promise<Record<string, unknown>> {
    try {
      return await this.adminServiceClient.getActiveNetworkMap(token);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching active network map: ${err.message}`);
      throw error;
    }
  }

  async getRuleFlow(ruleId: string, user: AuthenticatedUser, endpointKey: EndpointKey, filters?: RuleFlowFilterDto,
  ): Promise<ResponseRuleFlow> {
    try {
      const normalizedRole = this.getNormalizedRole(user);

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
      this.logger.error(`Error fetching flow for rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async getRuleFlowStatus(ruleId: string, user: AuthenticatedUser, endpointKey: EndpointKey, filters?: RuleFlowFilterDto): Promise<ResponseRuleFlowStatusDto> {
    try {
      const normalizedRole = this.getNormalizedRole(user);

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
      this.logger.error(`Error fetching flow status for rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async createRuleFlow(ruleId: string, body: RequestFlow, user: AuthenticatedUser): Promise<ResponseRuleFlowDto> {
    try {
      const endpointKey: EndpointKey = 'POST /rules/api/:ruleId/flow';
      const normalizedRole = this.getNormalizedRole(user);

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

      return await this.adminServiceClient.createRuleFlow(
        ruleId,
        body,
        user.token.tokenString,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error creating flow for rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async updateRuleFlow(ruleId: string, payload: RequestSaveFlow, user: AuthenticatedUser, endpointKey: EndpointKey): Promise<ResponseUpdatedRuleFlowDto> {
    try {
      const normalizedRole = this.getNormalizedRole(user);

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
    const normalizedRole = this.getNormalizedRole(user);

    if (!this.rbacService.isRole(normalizedRole)) {
      return [];
    }

    const tier2 = this.rbacService.getTier2({
      role: normalizedRole,
      endpointKey: 'GET /rules/api/status' as EndpointKey,
    });

    return tier2.allowedStatuses ?? [];
  }

  async getGlobalVariables(ruleId: string, user: AuthenticatedUser, endpointKey: EndpointKey): Promise<GlobalVariableDto> {
    try {
      const normalizedRole = this.getNormalizedRole(user);

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
      this.logger.error(`Error fetching global variables for rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async updateRuleStatus(ruleId: string, status: string, reason: string, user: AuthenticatedUser, endpointKey: EndpointKey): Promise<Rules> {
    const token = user.token.tokenString || '';
    const mapStatusToEventType = (status: string): EventType | null => {
      const normalizedStatus = status.toUpperCase();

      switch (normalizedStatus) {
        case 'STATUS_03_UNDER_REVIEW':
          return EventType.EditorSubmit;

        case 'STATUS_04_APPROVED':
          return EventType.ApproverApprove;

        case 'STATUS_05_REJECTED':
          return EventType.ApproverReject;

        case 'STATUS_08_DEPLOYED':
          return EventType.PublisherDeploy;

        case 'ACTIVE':
          return EventType.PublisherActivate;

        case 'INACTIVE':
          return EventType.PublisherDeactivate;

        default:
          return null;
      }
    };

    try {
      const normalizedRole = this.getNormalizedRole(user);

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
      
      const existingRule = await this.getRuleOrThrow(Number(ruleId), token);
      const previousStatus = (existingRule as any)?.rules?.status ?? existingRule.status;

      if (previousStatus === status) {
        this.logger.debug(`Rule ${ruleId} already in status '${status}'. Skipping notification.`);

        return await this.adminServiceClient.updateRuleStatus(ruleId, status, reason, token,);
      }

      const updatedRule = await this.adminServiceClient.updateRuleStatus(ruleId, status, reason, token,);

      const ruleData = await this.getRuleOrThrow(Number(ruleId), token);
      this.logger.log(`Rule Data ${JSON.stringify(ruleData)}`);

      const eventType = mapStatusToEventType(status);

      if (eventType) {
        try {
          const apiRule = (ruleData as any)?.rules ?? ruleData;

          const mappedRule: Rules = {
            id: apiRule.id?.toString(),
            ruleName: apiRule.rule_name,
            description: apiRule.description,
            txtp: apiRule.txtp,
            txtpVersion: apiRule.txtp_version,
            version: apiRule.version,
            status: apiRule.status,
            publishing_status: apiRule.publishing_status,
            rule_type: apiRule.rule_type,
            rule_config_id: apiRule.rule_config_id,
            metadata: apiRule.metadata,
            created_at: apiRule.created_at,
            updated_at: apiRule.updated_at,
          };

          await this.notificationService.sendRuleWorkflowNotification(eventType, user, mappedRule, token, reason,
          );

          this.logger.log(`Notification sent for rule ${ruleId} status change to '${status}'`);
        } catch (notificationError) {
          const notifErr = notificationError as Error;
          this.logger.warn(`Failed to send notification for rule ${ruleId} status change: ${notifErr.message}`);
        }
      } else {
        this.logger.debug(`No notification event mapped for status '${status}' on rule ${ruleId}`);
      }

      return updatedRule;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error updating status for rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }
}
