import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
  IsNumber,
  IsObject,
  ValidateNested,
  Matches,
  IsEnum,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  RuleConfig,
  RuleRequest,
  RuleResult,
} from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { RuleCategory, RuleFlowStatus, RuleType, RuleStatus, PublishingStatus } from 'src/utils/enums/rule.enum';

export class MetaDataDto {
  @ApiPropertyOptional({ description: 'Sync status', example: true })
  @IsOptional()
  @IsBoolean()
  sync?: boolean;

  @ApiPropertyOptional({ description: 'Deploy status', example: false })
  @IsOptional()
  @IsBoolean()
  deploy?: boolean;

  @ApiPropertyOptional({ description: 'Test status', example: false })
  @IsOptional()
  @IsBoolean()
  test?: boolean;

  @ApiPropertyOptional({ description: 'Simulation status', example: false })
  @IsOptional()
  @IsBoolean()
  simulation?: boolean;
}

export class RuleBaseDto {

  @ApiProperty({
    description: 'Rule name - ideally constructed from tenant_id->rule->rule_config_id',
    example: 'cbe-rule-061',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'ruleName must not exceed 255 characters' })
  ruleName?: string;

  @ApiProperty({
    description: 'Rule description',
    example: 'Detects transactions above threshold',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'description must not exceed 500 characters' })
  description: string;

  @ApiProperty({ description: 'Transaction type', example: 'pain.001.001.11' })
  @IsString()
  @IsNotEmpty()
  txtp: string;

  @ApiProperty({ description: 'Rule version', example: '1.0.0' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+\.\d+\.\d+$/, {
    message:
      'Version must be in semantic versioning format (major.minor.patch), e.g., 1.0.0',
  })
  version: string;

  @ApiPropertyOptional({
    description: 'Transaction type version',
    example: '11',
  })
  @IsOptional()
  @IsString()
  txtpVersion?: string;

  @ApiPropertyOptional({
    description: 'Rule status',
    example: 'STATUS_01_IN_PROGRESS',
    enum: RuleStatus,
    default: 'STATUS_01_IN_PROGRESS',
  })
  @IsOptional()
  @IsEnum(RuleStatus, {
    message: `status must be one of: ${Object.values(RuleStatus).join(', ')}`,
  })
  status?: RuleStatus;

  @ApiPropertyOptional({
    description: 'Publishing status - defaults to INACTIVE for new rules',
    example: 'INACTIVE',
    enum: PublishingStatus,
    default: 'INACTIVE',
  })
  @IsOptional()
  // @IsEnum(PublishingStatus, {
  //   message: `publishing_status must be one of: ${Object.values(PublishingStatus).join(', ')}`,
  // }) controller is only supposed to have guards. baaki sab at service
  publishing_status?: PublishingStatus;

  @ApiProperty({
    description: 'Rule type classification',
    example: 'fraud_detection',
    enum: RuleType,
  })
  @IsEnum(RuleType, {
    message: `rule_type must be one of: ${Object.values(RuleType).join(', ')}`,
  })
  rule_type: RuleType;

  @ApiPropertyOptional({
    description: 'Configuration identifier - conditional based on rule flow existence',
    example: 'CFG001',
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'rule_config_id must not exceed 10 characters' })
  rule_config_id?: string;
}

export class Rules extends RuleBaseDto {
  @ApiPropertyOptional({ description: 'Rule database ID', example: '1' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: 'Flow identifier',
    example: '123',
  })
  @IsOptional()
  @IsString()
  flow_id?: string;

  @ApiPropertyOptional({
    description: 'Rule metadata',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MetaDataDto)
  metadata?: MetaDataDto;

  @ApiPropertyOptional({
    description: 'Last update timestamp',
    example: '2024-01-16T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  updated_at?: string;

  @ApiPropertyOptional({
    description: 'Creation timestamp',
    example: '2024-01-16T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  created_at?: string;
}

export class CreateRuleDto extends RuleBaseDto {}

export class UpdateRuleDto {
  @ApiPropertyOptional({
    description: 'Rule description',
    example: 'Updated: Detects transactions above threshold',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Transaction type',
    example: 'pain.001.001.11',
  })
  @IsOptional()
  @IsString()
  txtp?: string;

  @ApiPropertyOptional({
    description: 'Rule version',
    example: '1.0.0',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+\.\d+\.\d+$/, {
    message:
      'Version must be in semantic versioning format (major.minor.patch), e.g., 1.0.0',
  })
  version?: string;

  @ApiPropertyOptional({
    description: 'Transaction type version',
    example: '11',
  })
  @IsOptional()
  @IsString()
  txtpVersion?: string;

  @ApiPropertyOptional({
    description: 'Rule status',
    example: 'STATUS_01_IN_PROGRESS',
    enum: RuleStatus,
  })
  @IsOptional()
  @IsEnum(RuleStatus, {
    message: `status must be one of: ${Object.values(RuleStatus).join(', ')}`,
  })
  status?: RuleStatus;

  @ApiPropertyOptional({
    description: 'Publishing status',
    example: 'PUBLISHED',
    enum: PublishingStatus,
  })
  @IsOptional()
  @IsEnum(PublishingStatus, {
    message: `publishing_status must be one of: ${Object.values(PublishingStatus).join(', ')}`,
  })
  publishing_status?: PublishingStatus;

  @ApiPropertyOptional({
    description: 'Rule type classification',
    example: 'fraud_detection',
    enum: RuleType,
  })
  @IsOptional()
  @IsEnum(RuleType, {
    message: `rule_type must be one of: ${Object.values(RuleType).join(', ')}`,
  })
  rule_type?: RuleType;

  @ApiPropertyOptional({
    description: 'Configuration identifier',
    example: 'CFG001',
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'rule_config_id must not exceed 10 characters' })
  rule_config_id?: string;

  @ApiPropertyOptional({
    description: 'Rule metadata',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MetaDataDto)
  metadata?: MetaDataDto;
}

export class RuleIdDto {
  @IsString()
  @IsNotEmpty()
  ruleId: string;

  @IsString()
  @IsNotEmpty()
  ruleCfg: string;

  @IsString()
  @IsNotEmpty()
  tenantId: string;
}

export class RuleConfigurationDto {
  @IsString()
  @IsNotEmpty()
  ruleId: string;

  @IsNotEmpty()
  configuration: any;
}

export class PositionDto {
  @IsNumber()
  @IsNotEmpty()
  x: number;

  @IsNumber()
  @IsNotEmpty()
  y: number;
}

export class NodeParamsDto {
  [key: string]: unknown;
}

export class FlowEdgeDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  source: string;

  @IsString()
  @IsNotEmpty()
  target: string;
}

export class FlowDto {
  @ApiProperty({ description: 'Array of flow nodes' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlowNodeDto)
  @IsNotEmpty()
  nodes: FlowNodeDto[];

  @ApiProperty({ description: 'Array of flow edges' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlowEdgeDto)
  @IsNotEmpty()
  edges: FlowEdgeDto[];
}


export class ResponseUpdatedRuleFlowDto {
  @ApiProperty({
    description: 'Unique identifier for the rule flow',
    example: 'flow-001',
  })
  @IsString()
  id: string;

  
  @ApiProperty({
    description: 'Identifier of the associated rule',
    example: '01',
  })
  @IsString()
  @IsNotEmpty()
  rule_id: string;


  @ApiProperty({ description: 'Flow structure', type: FlowDto })
  @IsObject()
  @IsNotEmpty()
  flow_json: Record<string, unknown>;

  @ApiProperty({
    description: 'Base64 encoded TypeScript file representing the flow',
    example:
      'data:application/typescript;base64,ZXhwb3J0IGNvbnN0Li4u',
  })
  @IsString()
  ts_file_base64: string;
}
export class ResponseRuleFlowDto {
  @ApiProperty({
    description: 'Unique identifier for the rule flow',
    example: 'flow-001',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Identifier of the associated rule',
    example: '01',
  })
  @IsString()
  @IsNotEmpty()
  rule_id: string;


  @ApiProperty({ description: 'Flow structure of the rule builder if no category filter applied', type: FlowDto })
  @IsObject()
  @IsOptional()
  flow_json_rule_builder?: Record<string,unknown>;

  @ApiProperty({ description: 'Flow structure of the test case if no category filter applied', type: FlowDto })
  @IsObject()
  @IsOptional()
  flow_json_test_case?: Record<string,unknown>;

  @ApiProperty({
    description: 'Base64 encoded TypeScript file representing the flow of the rule builder if no filter applied',
    example:
      'data:application/typescript;base64,ZXhwb3J0IGNvbnN0Li4u',
  })
  @IsString()
  @IsOptional()
  ts_file_base64_rule_builder?: string;

  @ApiProperty({
    description: 'Base64 encoded TypeScript file representing the flow of the test case if no filter applied',
    example:
      'data:application/typescript;base64,ZXhwb3J0IGNvbnN0Li4u',
  })
  @IsString()
  @IsOptional()
  ts_file_base64_test_case?: string;

   @ApiProperty({ description: 'Flow structure for category-filtered flow', type: FlowDto })
  @IsObject()
  @IsOptional()
  flow_json: Record<string,unknown>;

  @ApiProperty({
    description: 'Base64 encoded TypeScript file representing the flow if category filter applied',
    example:
      'data:application/typescript;base64,ZXhwb3J0IGNvbnN0Li4u',
  })
  @IsString()
  @IsOptional()
  ts_file_base64?: string;
}

export class ResponseRuleFlowStatusDto {
  @ApiProperty({
    description: 'Unique identifier for the rule flow',
    example: 'flow-001',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Identifier of the associated rule',
    example: '01',
  })
  @IsString()
  @IsNotEmpty()
  rule_id: string;

  @ApiProperty({
    description: 'rule builder status of the flow',
    example: 'initial',
  })
  @IsString()
  @IsNotEmpty()
  status_rule_builder?: string;

  @ApiProperty({
    description: 'test case generation status of the flow',
    example: 'initial',
  })
  @IsString()
  @IsNotEmpty()
  status_test_case?: string;

  @ApiProperty({
    description: 'test case generation status of the flow',
    example: 'initial',
  })
  @IsString()
  @IsNotEmpty()
  status?: string;
}

export class FlowNodeDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsObject()
  @IsOptional()
  params?: NodeParamsDto;

  @ValidateNested()
  @Type(() => PositionDto)
  @IsNotEmpty()
  position: PositionDto;

  @ValidateNested()
  @Type(() => FlowDto)
  @IsOptional()
  nestedFlow?: FlowDto;
}

export class GlobalVariableDto {
  @ApiProperty({ description: 'Rule request object configuration' })
  @IsNotEmpty()
  @IsObject()
  RuleRequest: RuleRequest;

  @ApiProperty({ description: 'Rule configuration object' })
  @IsNotEmpty()
  @IsObject()
  RuleConfig: RuleConfig;

  @ApiProperty({ description: 'Rule result object structure' })
  @IsNotEmpty()
  @IsObject()
  RuleResult: RuleResult;
}

export class RuleStatusArrayDto {
  @ApiProperty({
    description: 'Available rule statuses',
    type: [String],
    example: ['ACTIVE', 'INACTIVE', 'TESTING'],
  })
  @IsArray()
  statuses: string[];
}

export class RuleIdResponseDto {
  @ApiProperty({ description: 'Rule identifier', example: 'RULE-001' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Rule name', example: 'High Value Check' })
  @IsString()
  name: string;
}

export class RuleFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by rule status',
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by transaction type',
    example: 'pain.001.001.11',
  })
  @IsOptional()
  @IsString()
  txtp?: string;

  @ApiPropertyOptional({
    description: 'Filter by publishing status',
    example: 'PUBLISHED',
  })
  @IsOptional()
  @IsString()
  publishingStatus?: string;

  @ApiPropertyOptional({
    description: 'Filter by rule ID',
    example: 'RULE-001',
  })
  @IsOptional()
  @IsString()
  ruleId?: string;

  @ApiPropertyOptional({
    description: 'Filter by rule name',
    example: 'High Value Check',
  })
  @IsOptional()
  @IsString()
  ruleName?: string;
  @ApiPropertyOptional({
    description: 'Filter by rule type',
    example: 'FRAUD',
  })
  @IsOptional()
  @IsString()
  ruleType?: string;
}

export class UpdateRuleStatusDto {
  @ApiProperty({ description: 'New status for the rule', example: 'ACTIVE' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({
    description: 'Reason for status change',
    example: 'Updated compliance requirements',
  })
  @IsString()
  @IsOptional()
  comment?: string;
}
export class RequestSaveFlow {
  @ApiProperty({
    description: 'ts file base64',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUh...',
  })
  @IsString()
  ts_file_base64: string;

  @ApiProperty({
    description: 'Json of the flow',
    example: '{"edges": {}, "nodes": {} }',
  })
  @IsObject()
  flow_json: Record<string, unknown>;

  @ApiProperty({
    description: 'Category of the flow',
    example: RuleCategory.RULE_BUILDER,
  })
  @IsEnum(RuleCategory)
  @IsNotEmpty()
  category: RuleCategory;

  @ApiProperty({
    description: 'Status of the flow',
    example: RuleFlowStatus.INITIAL,
  })
  @IsEnum(RuleFlowStatus)
  @IsNotEmpty()
  status: RuleFlowStatus;
}

export class RequestFlow {
  @ApiProperty({
    description: 'Json of the flow',
    example: '{"edges": {}, "nodes": {} }',
  })
  @IsObject()
  flow_json_rule_builder: Record<string, unknown>;

  @ApiProperty({
    description: 'Json of the test case flow',
    example: '{"edges": {}, "nodes": {} }',
  })
  @IsObject()
  flow_json_test_case: Record<string, unknown>;


}

export class RuleFlowFilterDto {
  @ApiPropertyOptional({
    description: 'Category filter for the rule flow',
    example: RuleCategory.RULE_BUILDER,
  })
  @IsOptional()
  @IsEnum(RuleCategory)
  category?: RuleCategory;
}

export class ResponseRuleFlow {
  @ApiProperty({
    description: 'Status of the API response indicating success or failure',
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: 'Response of the rule flow retrieval operation',
    type: ResponseRuleFlowDto,
  })
  @IsObject()
  result: ResponseRuleFlowDto;
}
