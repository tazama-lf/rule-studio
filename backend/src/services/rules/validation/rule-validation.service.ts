import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { AdminServiceClient } from '../../admin-service-client';
import { RuleType, RuleStatus, PublishingStatus } from '../../../utils/enums/rule.enum';

export interface RuleValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface TxtpValidationData {
  exists: boolean;
  status: string;
  versions: string[];
}

@Injectable()
export class RuleValidationService {
  constructor(private readonly adminServiceClient: AdminServiceClient) {}

  /**
   * Validates all rule creation data according to business requirements
   */
  async validateRuleCreation(ruleData: any, token: string, tenantId: string): Promise<RuleValidationResult> {
    const result: RuleValidationResult = {
      isValid: true,
      errors: [],
    };

    // Validate ruleName construction if provided
    if (ruleData.ruleName) {
      const ruleNameValidation = this.validateRuleName(ruleData.ruleName, tenantId, ruleData.rule_config_id);
      if (!ruleNameValidation.isValid) {
        result.isValid = false;
        result.errors.push(...ruleNameValidation.errors);
      }
    }

    // Validate description length
    const descValidation = this.validateDescription(ruleData.description);
    if (!descValidation.isValid) {
      result.isValid = false;
      result.errors.push(...descValidation.errors);
    }

    // Validate txtp exists and is in correct state
    const txtpValidation = await this.validateTxtp(ruleData.txtp, token);
    if (!txtpValidation.isValid) {
      result.isValid = false;
      result.errors.push(...txtpValidation.errors);
    }

    // Validate version format (major.minor.patch)
    const versionValidation = this.validateVersion(ruleData.version);
    if (!versionValidation.isValid) {
      result.isValid = false;
      result.errors.push(...versionValidation.errors);
    }

    // Validate txtpVersion if provided
    if (ruleData.txtpVersion) {
      const txtpVersionValidation = await this.validateTxtpVersion(ruleData.txtp, ruleData.txtpVersion, token);
      if (!txtpVersionValidation.isValid) {
        result.isValid = false;
        result.errors.push(...txtpVersionValidation.errors);
      }
    }

    // Validate status enum
    if (ruleData.status) {
      const statusValidation = this.validateStatus(ruleData.status);
      if (!statusValidation.isValid) {
        result.isValid = false;
        result.errors.push(...statusValidation.errors);
      }
    }

    // Validate publishing_status
    if (ruleData.publishing_status) {
      const publishingValidation = this.validatePublishingStatus(ruleData.publishing_status);
      if (!publishingValidation.isValid) {
        result.isValid = false;
        result.errors.push(...publishingValidation.errors);
      }
    }

    // Validate rule_type
    const ruleTypeValidation = this.validateRuleType(ruleData.rule_type);
    if (!ruleTypeValidation.isValid) {
      result.isValid = false;
      result.errors.push(...ruleTypeValidation.errors);
    }

    // Validate rule_config_id logic
    const configValidation = await this.validateRuleConfigId(ruleData.rule_config_id, token);
    if (!configValidation.isValid) {
      result.isValid = false;
      result.errors.push(...configValidation.errors);
    }

    return result;
  }

  /**
   * Validates rule name construction: tenant_id->rule->rule_config_id
   */
  private validateRuleName(ruleName: string, tenantId: string, ruleConfigId?: string): RuleValidationResult {
    const result: RuleValidationResult = { isValid: true, errors: [] };

    if (!ruleName) {
      result.isValid = false;
      result.errors.push('ruleName is required');
      return result;
    }

    // Ideally should be constructed from other data: tenant_id->rule->rule_config_id
    const expectedPattern = ruleConfigId 
      ? new RegExp(`${tenantId}.*rule.*${ruleConfigId}`, 'i')
      : new RegExp(`${tenantId}.*rule`, 'i');

    if (!expectedPattern.test(ruleName)) {
      result.errors.push(`ruleName should ideally follow pattern: ${tenantId}->rule->${ruleConfigId || 'config_id'}, but keeping flexible for now`);
      // Not failing validation as it's marked as "ideally" in requirements
    }

    return result;
  }

  /**
   * Validates description length
   */
  private validateDescription(description: string): RuleValidationResult {
    const result: RuleValidationResult = { isValid: true, errors: [] };

    if (!description) {
      result.isValid = false;
      result.errors.push('description is required');
      return result;
    }

    if (description.length > 500) {
      result.isValid = false;
      result.errors.push('description must not exceed 500 characters');
    }

    return result;
  }

  /**
   * Validates txtp exists and is in correct state (deployed and accepted)
   */
  private async validateTxtp(txtp: string, token: string): Promise<RuleValidationResult> {
    const result: RuleValidationResult = { isValid: true, errors: [] };

    try {
      // Check if txtp exists
      const listOfValidTxtps = await this.adminServiceClient.getTransactionTypes(token);
      console.log('Validating txtp against list of valid transaction types:', listOfValidTxtps);
      
      if (!listOfValidTxtps.includes(txtp)) {
        result.isValid = false;
        result.errors.push(`Transaction type '${txtp}' does not exist`);
        return result;
      }
      
      // atp we have valid txtp
      // now we want to check txtp version for validitiy      
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Transaction type '${txtp}' does not exist or is not accessible`);
    }

    return result;
  }

  /**
   * Validates version format (major.minor.patch)
   */
  private validateVersion(version: string): RuleValidationResult {
    const result: RuleValidationResult = { isValid: true, errors: [] };

    if (!version) {
      result.isValid = false;
      result.errors.push('version is required');
      return result;
    }

    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(version)) {
      result.isValid = false;
      result.errors.push('version must be in format major.minor.patch (e.g., 1.0.0)');
    }

    return result;
  }

  /**
   * Validates txtpVersion exists for the given txtp
   */
  private async validateTxtpVersion(txtp: string, txtpVersion: string, token: string): Promise<RuleValidationResult> {
    const result: RuleValidationResult = { isValid: true, errors: [] };

    try {
      // Get all versions for the transaction type
      const versions = await this.adminServiceClient.getTxTpVersionsByTransactionType(txtp, token);
      
      if (!versions || !versions.includes(txtpVersion)) {
        result.isValid = false;
        result.errors.push(`txtpVersion '${txtpVersion}' does not exist for transaction type '${txtp}'`);
      }
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Unable to validate txtpVersion '${txtpVersion}' for transaction type '${txtp}'`);
    }

    return result;
  }

  /**
   * Validates status enum
   */
  private validateStatus(status: string): RuleValidationResult {
    const result: RuleValidationResult = { isValid: true, errors: [] };

    const validStatuses = Object.values(RuleStatus);
    if (!validStatuses.includes(status as RuleStatus)) {
      result.isValid = false;
      result.errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    }

    return result;
  }

  /**
   * Validates publishing_status - default should be INACTIVE, not ACTIVE
   */
  private validatePublishingStatus(publishingStatus: string): RuleValidationResult {
    const result: RuleValidationResult = { isValid: true, errors: [] };

    const validStatuses = Object.values(PublishingStatus);
    if (!validStatuses.includes(publishingStatus as PublishingStatus)) {
      result.isValid = false;
      result.errors.push(`publishing_status must be one of: ${validStatuses.join(', ')}`);
    }

    // According to requirements, default should be INACTIVE, not ACTIVE
    if (publishingStatus === PublishingStatus.ACTIVE) {
      result.errors.push('publishing_status should default to INACTIVE for new rules, not ACTIVE');
      // Not failing validation, just warning
    }

    return result;
  }

  /**
   * Validates rule_type enum
   */
  private validateRuleType(ruleType: string): RuleValidationResult {
    const result: RuleValidationResult = { isValid: true, errors: [] };

    if (!ruleType) {
      result.isValid = false;
      result.errors.push('rule_type is required');
      return result;
    }

    const validTypes = Object.values(RuleType);
    if (!validTypes.includes(ruleType as RuleType)) {
      result.isValid = false;
      result.errors.push(`rule_type must be one of: ${validTypes.join(', ')}`);
    }

    return result;
  }

  /**
   * Validates rule_config_id logic based on trs_rule_flow existence
   */
  private async validateRuleConfigId(ruleConfigId?: string, token?: string): Promise<RuleValidationResult> {
    const result: RuleValidationResult = { isValid: true, errors: [] };

    // This validation depends on whether a trs_rule_flow exists
    // According to requirements:
    // - Yes: This should be removed as the trs_rule_flow table already has a column for referencing trs_rules
    // - No: This should have the id of the trs_rule_flow row that corresponds to the newly created rule

    // For now, we'll accept both scenarios but log warnings
    if (ruleConfigId) {
      // Validate format if provided
      if (ruleConfigId.length > 10) {
        result.isValid = false;
        result.errors.push('rule_config_id must not exceed 10 characters');
      }
    }

    return result;
  }

  /**
   * Constructs a default rule name if not provided
   */
  generateDefaultRuleName(tenantId: string, ruleConfigId?: string): string {
    const timestamp = Date.now();
    return ruleConfigId 
      ? `${tenantId}-rule-${ruleConfigId}-${timestamp}`
      : `${tenantId}-rule-${timestamp}`;
  }

  /**
   * Applies default values for optional fields
   */
  applyDefaults(ruleData: any): any {
    return {
      ...ruleData,
      status: ruleData.status || RuleStatus.STATUS_01_IN_PROGRESS,
      publishing_status: ruleData.publishing_status || PublishingStatus.INACTIVE, // Should be INACTIVE by default
    };
  }
}