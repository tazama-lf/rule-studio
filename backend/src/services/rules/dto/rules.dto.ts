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
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  RuleConfig,
  RuleRequest,
  RuleResult,
} from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { RuleCategory } from 'src/utils/enums/rule.enum';

export class RuleBaseDto {

  @ApiProperty({
    description: 'Rule name',
    example: 'cbe-rule-061',
  })
  @IsString()
  @IsNotEmpty()
  ruleName: string;

  @ApiProperty({
    description: 'Rule description',
    example: 'Detects transactions above threshold',
  })
  @IsString()
  @IsNotEmpty()
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
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'TESTING'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Publishing status',
    example: 'PUBLISHED',
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'PUBLISHED'],
  })
  @IsOptional()
  @IsString()
  publishing_status?: string;

  @ApiPropertyOptional({
    description: 'Rule type classification',
    example: 'fraud_detection',
    enum: ['fraud_detection', 'aml', 'security', 'compliance'],
  })
  @IsOptional()
  @IsString()
  rule_type?: string;

  @ApiPropertyOptional({
    description: 'Configuration identifier',
    example: 'CFG001',
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
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
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'TESTING'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Publishing status',
    example: 'PUBLISHED',
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'PUBLISHED'],
  })
  @IsOptional()
  @IsString()
  publishing_status?: string;

  @ApiPropertyOptional({
    description: 'Rule type classification',
    example: 'fraud_detection',
    enum: ['fraud_detection', 'aml', 'security', 'compliance'],
  })
  @IsOptional()
  @IsString()
  rule_type?: string;

  @ApiPropertyOptional({
    description: 'Configuration identifier',
    example: 'CFG001',
  })
  @IsOptional()
  @IsString()
  rule_config_id?: string;
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
  

  @ApiProperty({ description: 'Flow structure of the rule', type: FlowDto })
  @IsObject()
  @IsNotEmpty()
  flow: Record<string, unknown>;

  @ApiProperty({
    description: 'Base64 encoded TypeScript file representing the flow',
    example:
      'data:application/typescript;base64,ZXhwb3J0IGNvbnN0Li4u',
  })
  @IsString()
  ts_file_base64: string;
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
}

export class RequestFlow {
  @ApiProperty({
    description: 'Category of the flow',
    example: RuleCategory.RULE_BUILDER,
  })
  @IsEnum(RuleCategory)
  @IsNotEmpty()
  category: RuleCategory;

  @ApiProperty({
    description: 'Json of the flow',
    example: '{"edges": {}, "nodes": {} }',
  })
  @IsObject()
  flow_json: Record<string, unknown>;
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