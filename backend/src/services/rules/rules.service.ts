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
} from './dto/rules.dto';
import { ParseExtractService } from '../parse-extract/parse-extract.service';
import { TransactionalMessage } from '../parse-extract/dto/message.dto';
import { BASE_RULE_ID } from '../../constants/constant';
import { AuthenticatedUser } from '../auth/auth.types';
import { RuleCategory } from 'src/utils/enums/rule.enum';

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);

  constructor(
    private readonly adminServiceClient: AdminServiceClient,
    private readonly parseExtractService: ParseExtractService,
  ) {}
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

  async createRule(
    ruleData: Partial<Rules> & { transactionalMessage?: TransactionalMessage },
    token: string,
  ): Promise<Rules> {
    try {
      // If transactional message is provided, process it to enrich rule data
      if (ruleData.transactionalMessage) {
        this.logger.log(
          `Processing transactional message for rule creation: ${ruleData.transactionalMessage.TxTp}`,
        );

        const parseResult = await this.parseExtractService.processForRuleCreation(
          ruleData.transactionalMessage,
          token,
        );

        if (!parseResult.success) {
          this.logger.error(
            `Failed to process transactional message: ${parseResult.message}`,
          );
          throw new Error(
            `Transaction processing failed: ${parseResult.message}`,
          );
        }

        // Enrich rule data with processed transaction information
        const processedData = {
          processedTransaction: parseResult.ruleRequest?.transaction,
          dataCache: parseResult.ruleRequest?.DataCache,
          networkMap: parseResult.ruleRequest?.networkMap,
          validatedPayload: parseResult.validatedPayload,
          correlationId: parseResult.correlationId,
        };

        // Store processed data in rule description or notes
        ruleData.description = `${ruleData.description || ''} [Processed Transaction Data Available - Correlation ID: ${parseResult.correlationId}]`.trim();

        this.logger.log(
          `Successfully processed transaction data for rule creation [${parseResult.correlationId}]`,
        );
      }

      // Remove transactionalMessage from ruleData before sending to admin service
      const { transactionalMessage, ...cleanRuleData } = ruleData;

      const rule = await this.adminServiceClient.createRule(cleanRuleData, token);
      let updatedRule = rule;
      if (rule.id) {
        const baseRuleFlow = await this.getRuleFlow(
          BASE_RULE_ID,
          token,
        );
        const newRuleFlow = await this.adminServiceClient.createRuleFlow(
          rule.id,
          {
            flow_json_rule_builder: baseRuleFlow.result.flow_json_rule_builder ? baseRuleFlow.result.flow_json_rule_builder : {},
            flow_json_test_case: baseRuleFlow.result.flow_json_test_case ? baseRuleFlow.result.flow_json_test_case : {},
          },
          token,
        );
        if (newRuleFlow) {
          updatedRule = await this.adminServiceClient.updateRule(
            rule.id,
            { flow_id: newRuleFlow.id },
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
      // console.log('Fetching active network map via RulesService');
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
    filters?: RuleFlowFilterDto,
  ): Promise<ResponseRuleFlow>
   {
    try {
      const ruleFlow = await this.adminServiceClient.getRuleFlow(ruleId, token, filters);
      return ruleFlow;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error fetching flow for rule ${ruleId}: ${err.message}`,
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
        body,
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
  ): Promise<ResponseUpdatedRuleFlowDto> {
    try {
      return await this.adminServiceClient.updateRuleFlow(
        ruleId,
        payload,
        token,
      );
    } catch (error) {
      const err = error as Error;
      // console.log(error);
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

  async cloneRule(ruleId: string, token: string, payload: any): Promise<Rules> {
    try {
      return await this.adminServiceClient.cloneRule(ruleId, token, payload);
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
