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

type CloneRulePayload = Record<string, unknown> & { txtp?: string; txtpVersion?: string };

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
      this.logger.log('Fetched config schema for transaction type ' + transactionType + '\n' + JSON.stringify(schemaResult));
      const mappingResult = result.config.mapping as FieldMapping[];
      this.logger.log('Fetched config mappings for transaction type ' + transactionType + '\n' + JSON.stringify(mappingResult));
      const payloadResult = result.config.payload;
      this.logger.log('Fetched config payload for transaction type ' + transactionType + '\n' + JSON.stringify(payloadResult));
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

      this.logger.debug('Prepared ruleRequest for transaction type ' + transactionType + '\n' + JSON.stringify(parseResult.ruleRequest));
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
      // console.log('Fetching active network map via RulesService');
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
      // console.log(error);
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

  async updateRuleStatus(ruleId: string, status: string, reason: string, token: string): Promise<Rules> {
    try {
      return await this.adminServiceClient.updateRuleStatus(ruleId, status, reason, token);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error updating status for rule ${ruleId}: ${err.message}`);
      throw error;
    }
  }
}
