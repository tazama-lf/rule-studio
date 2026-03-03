import { Injectable, Logger } from '@nestjs/common';
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

type CloneRulePayload = Record<string, unknown> & { txtp?: string; txtpVersion?: string };

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);

  constructor(
    private readonly adminServiceClient: AdminServiceClient,
    private readonly parseExtractService: ParseExtractService,
    private readonly notificationService: NotificationService,
  ) { }
  private async getRuleOrThrow(id: number, token: string): Promise<Rules> {
    try {
      return await this.adminServiceClient.getRulesById(id, token);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error finding rules by ID ${id}: ${err.message}`);
      throw error;
    }
  }

  async getAllRules(offset: number, limit: number, filters: RuleFiltersDto, token: string): Promise<Rules[]> {
    // Set default sort order to DESC (newest first) if not provided
    const updatedFilters = {
      ...filters,
      sortOrder: filters.sortOrder || 'DESC' as 'DESC',
    };

    return await this.adminServiceClient.getAllRulesWithFilters(offset, limit, updatedFilters, token);
  }

  async getRulesById(
    id: number,
    tenantId: string, // need to fix this. where else is the tenantId being extracted from??
    token: string,
  ): Promise<Rules> {
    const rules = await this.getRuleOrThrow(id, token);
    return rules;
  }

  async createRule(ruleData: Partial<Rules>, user: AuthenticatedUser): Promise<Rules> {
    try {
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
      return await this.adminServiceClient.cloneRule(ruleId, user.token.tokenString, payload);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error cloning rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async getRuleIds(token: string): Promise<Array<Record<string, unknown>>> {
    try {
      return await this.adminServiceClient.getRuleIds(token);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching rule IDs: ${err.message}`);
      throw error;
    }
  }

  async getRuleConfiguration(ruleId: string, token: string): Promise<Record<string, unknown>> {
    try {
      return await this.adminServiceClient.getRuleConfiguration(ruleId, token);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching configuration for rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async updateRule(ruleId: string, updateData: Partial<Rules>, token: string): Promise<Rules> {
    try {
      return await this.adminServiceClient.updateRule(ruleId, updateData, token);
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

  async getRuleFlow(ruleId: string, token: string, filters?: RuleFlowFilterDto): Promise<ResponseRuleFlow> {
    try {
      const ruleFlow = await this.adminServiceClient.getRuleFlow(ruleId, token, filters);
      return ruleFlow;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching flow for rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async getRuleFlowStatus(ruleId: string, token: string, filters?: RuleFlowFilterDto): Promise<ResponseRuleFlowStatusDto> {
    try {
      const status = await this.adminServiceClient.getRuleFlowStatus(ruleId, token, filters);
      return status;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching flow status for rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async createRuleFlow(ruleId: string, body: RequestFlow, token: string): Promise<ResponseRuleFlowDto> {
    try {
      return await this.adminServiceClient.createRuleFlow(ruleId, body, token);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error creating flow for rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async updateRuleFlow(ruleId: string, payload: RequestSaveFlow, token: string): Promise<ResponseUpdatedRuleFlowDto> {
    try {
      return await this.adminServiceClient.updateRuleFlow(ruleId, payload, token);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error updating flow for rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  getRulesStatusbyRole(user: AuthenticatedUser): string[] {
    return user.allowedStatuses ?? [];
  }

  async getGlobalVariables(ruleId: string, tenantId: string, token: string): Promise<GlobalVariableDto> {
    try {
      const ruleData = await this.adminServiceClient.getGlobalVariables(ruleId, tenantId, token);
      return ruleData;
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
  ): Promise<Rules> {

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
