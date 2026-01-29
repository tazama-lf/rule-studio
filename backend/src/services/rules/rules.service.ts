import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from '../admin-service-client';
import {
  ResponseRuleFlowDto,
  Rules,
  GlobalVariableDto,
  RequestSaveFlow,
  RuleFiltersDto,
  RequestFlow,
} from './dto/rules.dto';
import { BASE_RULE_ID } from '../../constants/constant';
import { AuthenticatedUser } from '../auth/auth.types';

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);

  constructor(private readonly adminServiceClient: AdminServiceClient) {}
  private async getRuleOrThrow(id: number, token: string): Promise<Rules> {
    try {
      return await this.adminServiceClient.getRulesById(id, token);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error finding rules by ID ${id}: ${err.message}`);
      throw error;
    }
  }

  async getAllRules(
    offset: number,
    limit: number,
    filters: RuleFiltersDto,
    token: string,
  ): Promise<Rules[]> {
    return await this.adminServiceClient.getAllRulesWithFilters(
      offset,
      limit,
      filters,
      token,
    );
  }

  async getRulesById(
    id: number,
    tenantId: string, // need to fix this. where else is the tenantId being extracted from??
    token: string,
  ): Promise<Rules> {
    const rules = await this.getRuleOrThrow(id, token);
    return rules;
  }

  async createRule(ruleData: Partial<Rules>, token: string): Promise<Rules> {
    try {
      const rule = await this.adminServiceClient.createRule(ruleData, token);
      let updatedRule = rule;
      if (rule.id) {
        const baseFlow = await this.adminServiceClient.getRuleFlow(
          BASE_RULE_ID,
          token,
        );
        const newRuleFlow = await this.adminServiceClient.createRuleFlow(
          rule.id,
          baseFlow.flow as unknown as Record<string, unknown>,
          token,
        );
        const flowId = newRuleFlow.flow[0].id;
        if (flowId) {
          updatedRule = await this.adminServiceClient.updateRule(
            rule.id,
            { flow_id: flowId },
            token,
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

  async getRuleIds(token: string): Promise<any[]> {
    try {
      return await this.adminServiceClient.getRuleIds(token);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error fetching rule IDs: ${err.message}`);
      throw error;
    }
  }

  async getRuleConfiguration(ruleId: string, token: string): Promise<any> {
    try {
      return await this.adminServiceClient.getRuleConfiguration(ruleId, token);
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
    token: string,
  ): Promise<Rules> {
    try {
      return await this.adminServiceClient.updateRule(
        ruleId,
        updateData,
        token,
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
    token: string,
  ): Promise<ResponseRuleFlowDto> {
    try {
      return await this.adminServiceClient.getRuleFlow(ruleId, token);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error fetching configuration for rule ${ruleId}: ${err.message}`,
      );
      throw error;
    }
  }

  async createRuleFlow(
    ruleId: string,
    body: RequestFlow,
    token: string,
  ): Promise<ResponseRuleFlowDto> {
    try {
      return await this.adminServiceClient.createRuleFlow(
        ruleId,
        body.flowData,
        token,
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
    token: string,
  ): Promise<ResponseRuleFlowDto> {
    try {
      return await this.adminServiceClient.updateRuleFlow(
        ruleId,
        payload,
        token,
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
    tenantId: string,
    token: string,
  ): Promise<GlobalVariableDto> {
    try {
      const ruleData = await this.adminServiceClient.getGlobalVariables(
        ruleId,
        tenantId,
        token,
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

  async cloneRule(ruleId: string, token: string): Promise<Rules> {
    try {
      return await this.adminServiceClient.cloneRule(ruleId, token);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error cloning rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }

  async updateRuleStatus(
    ruleId: string,
    status: string,
    reason: string,
    token: string,
  ): Promise<Rules> {
    try {
      return await this.adminServiceClient.updateRuleStatus(
        ruleId,
        status,
        reason,
        token,
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
