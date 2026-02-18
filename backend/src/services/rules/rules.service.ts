import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
import { RuleValidationService } from './validation/rule-validation.service';
// import * as xml2js from 'xml2js';
import { parseString, ParserOptions } from 'xml2js';

import { createSchemaAwareNumberProcessor, replaceObjectsWithArrays, returnArrayFieldsFromSchema } from '../../utils/xml2js.utils';

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);

  constructor(
    private readonly adminServiceClient: AdminServiceClient,
    private readonly parseExtractService: ParseExtractService,
    private readonly ruleValidationService: RuleValidationService,
  ) {}
  private async getRuleOrThrow(id: number, token: string): Promise<Rules> {
    try {
      return await this.adminServiceClient.getRulesById(id, token);
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
    ruleData: Partial<Rules> ,
    token: string,
    tenantId: string,
  ): Promise<any> {
    try {
      // Step 1: Validate all rule creation requirements
      console.log("reaching step 1")
      this.logger.log(`Starting rule validation for tenant: ${tenantId}`);
      console.log("Rule data received for creation:", JSON.stringify(ruleData, null, 2));
      const validationResult = await this.ruleValidationService.validateRuleCreation(
        ruleData, 
        token, 
        tenantId
      );

      if (!validationResult.isValid) {
        this.logger.error(`Rule validation failed: ${JSON.stringify(validationResult.errors)}`);
        throw new BadRequestException({
          message: 'Rule validation failed',
          errors: validationResult.errors,
        });
      }

      console.log("reaching step 2")

      // Step 2: Apply default values and generate rule name if needed
      const processedRuleData = this.ruleValidationService.applyDefaults(ruleData);
      
      if (!processedRuleData.ruleName) {
        processedRuleData.ruleName = this.ruleValidationService.generateDefaultRuleName(
          tenantId, 
          processedRuleData.rule_config_id
        );
        this.logger.log(`Generated rule name: ${processedRuleData.ruleName}`);
      }

      console.log("reaching step 3")
      // Step 3: Process transaction type payload (existing logic)
      const transactionType = processedRuleData.txtp ?? "";
      
      const result = await this.adminServiceClient.getPayloadByTransactionType(
        transactionType,
        token,
      );
      // console.log("getPayloadByTransactionType in rules.service:", JSON.stringify(result, null, 2)); 

      const payload = result.payload;
      let typedPayload = payload as Record<string, unknown>;  

      if(result.type === 'xml') {
        // Convert XML to JSON
        const result = await this.adminServiceClient.getConfigRowByTxTp(transactionType, token); 
        console.log("having fetched the payload, now getConfigRowByTxTp result:", result);

        const configuredSchema = result.config.schema;

        console.log("the configured scehma is :", JSON.stringify(configuredSchema, null, 2));

       
        const { stringFields, arrayFields } = returnArrayFieldsFromSchema(configuredSchema);

        console.log("String fields identified for number processing:", stringFields.length );
        console.log("Array fields identified for replacement:", arrayFields.length);

        const options: ParserOptions = {
          explicitArray: false, // Don't wrap single values in arrays
          ignoreAttrs: false, // Include attributes
          mergeAttrs: true, // Merge attributes with element content
          explicitRoot: true, // Don't include root wrapper
          explicitChildren: true,
          normalize: true,
          valueProcessors: [createSchemaAwareNumberProcessor(stringFields)], 
        };

        console.log("Starting XML to JSON conversion with xml2js...");

        // eslint-disable-next-line promise/avoid-new -- we need to wrap xml2js parseString in a promise
        const transformedPayload = await new Promise((resolve, reject) => {
          parseString(payload, options, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });

        console.log("XML to JSON conversion completed")

        // conversion done 
        typedPayload = replaceObjectsWithArrays(transformedPayload, arrayFields, stringFields);
        console.log("Final converted payload:", JSON.stringify(typedPayload, null, 2));
      }
      
      // if it was XML, now its JSON
      const parseResult = await this.parseExtractService.processForRuleCreation(
        {TxTp: transactionType, TenantId:tenantId, ...typedPayload},
        token,
      );
      // console.log("Parse result for transactional message:", parseResult);

      // Step 4: Create rule via admin service client
      this.logger.log(`Creating rule with validated data: ${JSON.stringify(processedRuleData)}`);
      const rule = await this.adminServiceClient.createRule(processedRuleData, token, parseResult.ruleRequest);
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

   async cloneRule(ruleId: string, user: AuthenticatedUser, payload: any): Promise<Rules> {
    try {
      const transactionType = payload.txtp ?? "";
      console.log(`Cloning rule with ID ${ruleId} for transaction type ${transactionType} and payload:`, JSON.stringify(payload, null, 2));
      
      // const result = await this.adminServiceClient.getPayloadByTransactionType(
      //   transactionType,
      //   token,
      // );
      // console.log("getPayloadByTransactionType in rules.service:", JSON.stringify(result, null, 2)); 

      // let typedPayload = result.payload as Record<string, unknown>;  

      // // 43 lines
      // if(result.type === 'xml') {
      //   // Convert XML to JSON
      //   const result = await this.adminServiceClient.getConfigRowByTxTp(transactionType, token); 
      //   console.log("having fetched the payload, now getConfigRowByTxTp result:", result);

      //   const configuredSchema = result.config.schema;

      //   console.log("the configured scehma is :", JSON.stringify(configuredSchema, null, 2));

       
      //   const { stringFields, arrayFields } = returnArrayFieldsFromSchema(configuredSchema);

      //   console.log("String fields identified for number processing:", stringFields.length );
      //   console.log("Array fields identified for replacement:", arrayFields.length);

      //   const options: ParserOptions = {
      //     explicitArray: false, // Don't wrap single values in arrays
      //     ignoreAttrs: false, // Include attributes
      //     mergeAttrs: true, // Merge attributes with element content
      //     explicitRoot: true, // Don't include root wrapper
      //     explicitChildren: true,
      //     normalize: true,
      //     valueProcessors: [createSchemaAwareNumberProcessor(stringFields)], 
      //   };

      //   console.log("Starting XML to JSON conversion with xml2js...");

      //   // eslint-disable-next-line promise/avoid-new -- we need to wrap xml2js parseString in a promise
      //   const transformedPayload = await new Promise((resolve, reject) => {
      //     parseString(payload, options, (err, result) => {
      //       if (err) {
      //         reject(err);
      //       } else {
      //         resolve(result);
      //       }
      //     });
      //   });

      //   console.log("XML to JSON conversion completed")

      //   // conversion done 
      //   typedPayload = replaceObjectsWithArrays(transformedPayload, arrayFields, stringFields);
      //   console.log("Final converted payload:", JSON.stringify(typedPayload, null, 2));
      // }
      
      // // if it was XML, now its JSON
      // const parseResult = await this.parseExtractService.processForRuleCreation(
      //   {TxTp: transactionType, TenantId:"default", ...typedPayload},
      //   token,
      // );
      // // const payloadWithoutName = { ruleName, ...payload };

      // console.log(`Cloning rule with ID ${ruleId} and payload:`, JSON.stringify(payload, null, 2));

      // fetch ruleRequest and forward it
      const ruleRequest = await this.adminServiceClient.fetchRuleRequest(
        {RuleId: ruleId, TenantId:user.tenantId},
        user.token.tokenString,
      );

      console.log(`Fetched rule request for cloning:`, JSON.stringify(ruleRequest, null, 2)); 



      return await this.adminServiceClient.cloneRule(ruleId, user.token.tokenString, payload, ruleRequest);
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

  async getRuleFlowStatus(ruleId: string, token: string, filters?: RuleFlowFilterDto): Promise<ResponseRuleFlowStatusDto> {
    try {
      const status = await this.adminServiceClient.getRuleFlowStatus(ruleId, token, filters);
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
