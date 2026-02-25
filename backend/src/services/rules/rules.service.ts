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

import { parseString, ParserOptions } from 'xml2js';

import { createSchemaAwareNumberProcessor, replaceObjectsWithArrays, returnArrayFieldsFromSchema } from '../../utils/xml2js.utils';

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
    return await this.adminServiceClient.getAllRulesWithFilters(offset, limit, filters, token);
  }

  async getRulesById(
    id: number,
    tenantId: string, // need to fix this. where else is the tenantId being extracted from??
    token: string,
  ): Promise<Rules> {
    const rules = await this.getRuleOrThrow(id, token);
    return rules;
  }

  async createRule(ruleData: Partial<Rules>, token: string, tenantId: string): Promise<any> {
    try {
      const transactionType = ruleData.txtp ?? '';

      const result = await this.adminServiceClient.getPayloadByTransactionType(transactionType, token);

      const payload = result.payload;
      let typedPayload = result;  

      if (result.type === 'xml') {
        // Convert XML to JSON
        const configResult = await this.adminServiceClient.getConfigRowByTxTp(transactionType, token);

        const configuredSchema = configResult.config.schema;

        const { stringFields, arrayFields } = returnArrayFieldsFromSchema(configuredSchema);

        const options: ParserOptions = {
          explicitArray: false, // Don't wrap single values in arrays
          ignoreAttrs: false, // Include attributes
          mergeAttrs: true, // Merge attributes with element content
          explicitRoot: true, // Don't include root wrapper
          explicitChildren: true,
          normalize: true,
          valueProcessors: [createSchemaAwareNumberProcessor(stringFields)],
        };

        // eslint-disable-next-line promise/avoid-new -- we need to wrap xml2js parseString in a promise
        const transformedPayload = await new Promise((resolve, reject) => {
          parseString(payload, options, (err, res) => {
            if (err) {
              reject(new Error(err.message));
            } else {
              resolve(res);
            }
          });
        });

        // conversion done
        typedPayload = replaceObjectsWithArrays(transformedPayload, arrayFields, stringFields);
      }

      // if it was XML, now its JSON
      const parseResult = await this.parseExtractService.processForRuleCreation(
        {TxTp: transactionType, TenantId:tenantId, ...result},
        token,
      );
      // console.log('Parse result for transactional message:', parseResult);

      // admin service client ko aagay derha hun ruleRequest
      console.log("============THIS IS HERE=================", parseResult.ruleRequest);
      const rule = await this.adminServiceClient.createRule(ruleData, token, parseResult.ruleRequest);
      if (rule.id) {
        const baseRuleFlow = await this.getRuleFlow(BASE_RULE_ID, token);
        await this.adminServiceClient.createRuleFlow(
          rule.id,
          {
            flow_json_rule_builder: baseRuleFlow.result.flow_json_rule_builder ?? {},
            flow_json_test_case: baseRuleFlow.result.flow_json_test_case ?? {},
          },
          token,
        );
      }

      return rule;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error creating rule: ${err.message}`);
      throw error;
    }
  }

  async cloneRule(ruleId: string, token: string, payload: any): Promise<Rules> {
    try {
      const transactionType = payload.txtp ?? '';

      const result = await this.adminServiceClient.getPayloadByTransactionType(transactionType, token);

      let typedPayload = result.payload as Record<string, unknown>;

      if (result.type === 'xml') {
        // Convert XML to JSON
        const configResult = await this.adminServiceClient.getConfigRowByTxTp(transactionType, token);

        const configuredSchema = configResult.config.schema;

        const { stringFields, arrayFields } = returnArrayFieldsFromSchema(configuredSchema);

        const options: ParserOptions = {
          explicitArray: false, // Don't wrap single values in arrays
          ignoreAttrs: false, // Include attributes
          mergeAttrs: true, // Merge attributes with element content
          explicitRoot: true, // Don't include root wrapper
          explicitChildren: true,
          normalize: true,
          valueProcessors: [createSchemaAwareNumberProcessor(stringFields)],
        };

        // eslint-disable-next-line promise/avoid-new -- we need to wrap xml2js parseString in a promise
        const transformedPayload = await new Promise((resolve, reject) => {
          parseString(payload, options, (err, res) => {
            if (err) {
              reject(new Error(err.message));
            } else {
              resolve(res);
            }
          });
        });

        // conversion done
        typedPayload = replaceObjectsWithArrays(transformedPayload, arrayFields, stringFields);
      }

      // if it was XML, now its JSON
      const parseResult = await this.parseExtractService.processForRuleCreation(
        { TxTp: transactionType, TenantId: 'default', ...typedPayload },
        token,
      );
      return await this.adminServiceClient.cloneRule(ruleId, token, payload, parseResult.ruleRequest);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error cloning rule ${ruleId}: ${err.message}`);
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
