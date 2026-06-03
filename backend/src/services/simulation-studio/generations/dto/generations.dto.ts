import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsEnum, Min, IsNumber, IsObject, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import type { ContextFieldStrategy } from '../../interface/common.types';

export type SuiteGenerationStatus = 'DRAFT' | 'READY' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export class SuiteGenerationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 42 })
  suite_id: number;

  @ApiProperty({ example: 1 })
  generation_number: number;

  @ApiProperty({ example: 'DRAFT' })
  status: SuiteGenerationStatus;

  @ApiProperty({ example: 'SINGLE_RULE' })
  simulation_type: string;

  @ApiProperty({ required: false })
  rule_repo?: string;

  @ApiProperty({ required: false })
  rule_version?: string;

  @ApiProperty({ example: {} })
  wizard_snapshot: Record<string, unknown>;

  @ApiProperty({ example: {} })
  generation_metadata: Record<string, unknown>;

  @ApiProperty()
  created_by: string;

  @ApiProperty({ required: false })
  created_by_email?: string;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;
}

export class SuiteGenerationsListDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [SuiteGenerationDto] })
  data: SuiteGenerationDto[];
}

export class SuiteGenerationResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: SuiteGenerationDto })
  data: SuiteGenerationDto;
}

// ── Context TXTP Config DTOs ─────────────────────────────────────────────────

export class SuiteContextTxtpConfigDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  generation_id: number;

  @ApiProperty({ example: 'pacs.008' })
  txtp: string;

  @ApiProperty({ example: '001.08' })
  txtp_version: string;

  @ApiProperty({ example: 1 })
  display_order: number;

  @ApiProperty({ example: 1 })
  message_count: number;

  @ApiProperty({ required: false })
  faker_seed?: number;

  @ApiProperty({ example: {} })
  schema_snapshot: Record<string, unknown>;

  @ApiProperty({ required: false, example: {} })
  sample_payload_snapshot?: Record<string, unknown>;

  @ApiProperty({ required: false, example: {} })
  generator_profile?: Record<string, unknown>;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;
}

export class ContextConfigsListDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [SuiteContextTxtpConfigDto] })
  data: SuiteContextTxtpConfigDto[];
}

export class AddContextTxtpConfigDto {
  @ApiProperty({ example: 'pacs.008', description: 'Transaction type' })
  @IsString()
  txtp: string;

  @ApiProperty({ example: '001.08', description: 'Transaction type version' })
  @IsString()
  txtp_version: string;

  @ApiProperty({ required: false, example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  message_count?: number;
}

export class AddContextTxtpConfigResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: SuiteContextTxtpConfigDto })
  data: SuiteContextTxtpConfigDto;
}

export class UpdateContextTxtpConfigDto {
  @ApiProperty({ required: false, example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  message_count?: number;

  @ApiProperty({ required: false, example: 42 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  faker_seed?: number;

  @ApiProperty({ required: false, example: {} })
  @IsOptional()
  @IsObject()
  generator_profile?: Record<string, unknown>;
}

export class ContextTxtpConfigResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: SuiteContextTxtpConfigDto })
  data: SuiteContextTxtpConfigDto;
}

// ── Field Strategy DTOs ───────────────────────────────────────────────────────

export class ContextFieldStrategyDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  context_txtp_config_id: number;

  @ApiProperty({ example: 'CdtTrfTxInf.IntrBkSttlmAmt.value' })
  field_path: string;

  @ApiProperty({ example: 'static' })
  strategy_code: ContextFieldStrategy;

  @ApiProperty({ required: false })
  static_value?: unknown;

  @ApiProperty({ required: false, example: 100 })
  range_min?: number;

  @ApiProperty({ required: false, example: 9999 })
  range_max?: number;

  @ApiProperty({ required: false, example: 'iso20022.amount' })
  generator_type?: string;

  @ApiProperty({ required: false, example: {} })
  generator_options?: Record<string, unknown>;

  @ApiProperty({ required: false, example: true })
  is_required_override?: boolean;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;
}

export class ContextTxtpConfigWithStrategiesDto {
  @ApiProperty({ example: 1, description: 'Context TXTP config id' })
  context_txtp_config_id: number;

  @ApiProperty({ example: 'pacs.008' })
  txtp: string;

  @ApiProperty({ example: '001.08' })
  txtp_version: string;

  @ApiProperty({ example: 100 })
  message_count: number;

  @ApiProperty({ example: 1 })
  display_order: number;

  @ApiProperty({ example: {} })
  schema_snapshot: Record<string, unknown>;

  @ApiProperty({ required: false, example: {} })
  sample_payload_snapshot?: Record<string, unknown>;

  @ApiProperty({ type: [ContextFieldStrategyDto] })
  field_strategies: ContextFieldStrategyDto[];
}

export class ContextConfigsWithStrategiesListDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [ContextTxtpConfigWithStrategiesDto] })
  data: ContextTxtpConfigWithStrategiesDto[];
}

export class ContextConfigWithStrategiesResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: ContextTxtpConfigWithStrategiesDto })
  data: ContextTxtpConfigWithStrategiesDto;
}

export class UpsertFieldStrategyDto {
  @ApiProperty({ example: 'CdtTrfTxInf.IntrBkSttlmAmt.value' })
  @IsString()
  field_path: string;

  @ApiProperty({ example: 'static', enum: ['keep_sample', 'static', 'range', 'generated', 'null', 'skip'] })
  @IsEnum(['keep_sample', 'static', 'range', 'generated', 'null', 'skip'])
  strategy_code: ContextFieldStrategy;

  @ApiProperty({ required: false })
  @IsOptional()
  static_value?: unknown;

  @ApiProperty({ required: false, example: 100 })
  @IsOptional()
  @IsNumber()
  range_min?: number;

  @ApiProperty({ required: false, example: 9999 })
  @IsOptional()
  @IsNumber()
  range_max?: number;

  @ApiProperty({ required: false, example: 'iso20022.bic' })
  @IsOptional()
  @IsString()
  generator_type?: string;

  @ApiProperty({ required: false, example: {} })
  @IsOptional()
  @IsObject()
  generator_options?: Record<string, unknown>;

  @ApiProperty({ required: false })
  @IsOptional()
  is_required_override?: boolean;
}

export class UpsertFieldStrategiesDto {
  @ApiProperty({ type: [UpsertFieldStrategyDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpsertFieldStrategyDto)
  strategies: UpsertFieldStrategyDto[];
}

export class FieldStrategiesListDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [ContextFieldStrategyDto] })
  data: ContextFieldStrategyDto[];
}

export class FieldStrategyResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [ContextFieldStrategyDto] })
  data: ContextFieldStrategyDto[];
}

export class BulkConfigItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  context_txtp_config_id: number;

  @ApiProperty({ required: false, example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  message_count?: number;

  @ApiProperty({ required: false, example: 42 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  faker_seed?: number;

  @ApiProperty({ required: false, example: {} })
  @IsOptional()
  @IsObject()
  generator_profile?: Record<string, unknown>;

  @ApiProperty({ required: false, type: [UpsertFieldStrategyDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertFieldStrategyDto)
  field_strategies?: UpsertFieldStrategyDto[];
}

export class BulkUpdateContextConfigsResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [ContextTxtpConfigWithStrategiesDto] })
  data: ContextTxtpConfigWithStrategiesDto[];
}

// ── Trigger TXTP Config DTOs ──────────────────────────────────────────────────

export class AddTriggerTxtpConfigDto {
  @ApiProperty({ example: 'pacs.008', description: 'Transaction type (same as primary TXTP)' })
  @IsString()
  txtp: string;

  @ApiProperty({ example: '001.08', description: 'Transaction type version' })
  @IsString()
  txtp_version: string;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  message_count?: number;
}

export class TriggerFieldOverrideDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  trigger_txtp_config_id: number;

  @ApiProperty({ example: 'CdtTrfTxInf.IntrBkSttlmAmt.value' })
  field_path: string;

  @ApiProperty({ example: 'static', enum: ['static', 'range', 'generated', 'remove', 'null'] })
  override_type: string;

  @ApiProperty({ required: false })
  static_value?: unknown;

  @ApiProperty({ required: false, example: 100 })
  range_min?: number;

  @ApiProperty({ required: false, example: 9999 })
  range_max?: number;

  @ApiProperty({ required: false, example: 'iso20022.bic' })
  generator_type?: string;

  @ApiProperty({ required: false, example: {} })
  generator_options?: Record<string, unknown>;

  @ApiProperty()
  created_at: string;
}

export class UpsertTriggerFieldOverrideDto {
  @ApiProperty({ example: 'CdtTrfTxInf.IntrBkSttlmAmt.value' })
  @IsString()
  field_path: string;

  @ApiProperty({ example: 'static', enum: ['static', 'range', 'generated', 'remove', 'null'] })
  @IsEnum(['static', 'range', 'generated', 'remove', 'null'])
  override_type: string;

  @ApiProperty({ required: false })
  @IsOptional()
  static_value?: unknown;

  @ApiProperty({ required: false, example: 100 })
  @IsOptional()
  @IsNumber()
  range_min?: number;

  @ApiProperty({ required: false, example: 9999 })
  @IsOptional()
  @IsNumber()
  range_max?: number;

  @ApiProperty({ required: false, example: 'iso20022.bic' })
  @IsOptional()
  @IsString()
  generator_type?: string;

  @ApiProperty({ required: false, example: {} })
  @IsOptional()
  @IsObject()
  generator_options?: Record<string, unknown>;
}

export class TriggerTxtpConfigWithOverridesDto {
  @ApiProperty({ example: 1 })
  trigger_txtp_config_id: number;

  @ApiProperty({ example: 'pacs.008' })
  txtp: string;

  @ApiProperty({ example: '001.08' })
  txtp_version: string;

  @ApiProperty({ example: 1 })
  message_count: number;

  @ApiProperty({ example: 1 })
  display_order: number;

  @ApiProperty({ example: {} })
  payload_template_json: Record<string, unknown>;

  @ApiProperty({ example: false })
  link_to_context_pairs: boolean;

  @ApiProperty({ required: false, example: 'good', enum: ['good', 'neutral', 'bad', 'error'] })
  expected_result_band?: string;

  @ApiProperty({ required: false, example: 'optional notes' })
  notes?: string;

  @ApiProperty({ type: [TriggerFieldOverrideDto] })
  field_overrides: TriggerFieldOverrideDto[];
}

export class TriggerConfigsListDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [TriggerTxtpConfigWithOverridesDto] })
  data: TriggerTxtpConfigWithOverridesDto[];
}

export class TriggerConfigWithOverridesResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: TriggerTxtpConfigWithOverridesDto })
  data: TriggerTxtpConfigWithOverridesDto;
}

export class BulkTriggerConfigItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  trigger_txtp_config_id: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  message_count?: number;

  @ApiProperty({ required: false, example: false })
  @IsOptional()
  link_to_context_pairs?: boolean;

  @ApiProperty({ required: false, example: {} })
  @IsOptional()
  @IsObject()
  payload_template_json?: Record<string, unknown>;

  @ApiProperty({ required: false, example: 'good', enum: ['good', 'neutral', 'bad', 'error'] })
  @IsOptional()
  @IsString()
  expected_result_band?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, example: 42 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  faker_seed?: number;

  @ApiProperty({ required: false, example: {} })
  @IsOptional()
  @IsObject()
  generator_profile?: Record<string, unknown>;

  @ApiProperty({ required: false, type: [UpsertTriggerFieldOverrideDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertTriggerFieldOverrideDto)
  field_overrides?: UpsertTriggerFieldOverrideDto[];
}

export class BulkUpdateTriggerConfigsResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [TriggerTxtpConfigWithOverridesDto] })
  data: TriggerTxtpConfigWithOverridesDto[];
}

// ── Enrichment Tables DTOs ────────────────────────────────────────────────────

export class CreateEnrichmentTableDto {
  @ApiProperty({ example: 'account_enrichment', description: 'Target DB table name' })
  @IsString()
  table_name: string;

  @ApiProperty({ example: 13, description: 'Number of rows to generate' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  row_count: number;

  @ApiProperty({ required: false, example: { name: 'feeba', country: 'Pak' }, description: 'Sample payload template JSON' })
  @IsOptional()
  @IsObject()
  payload_template_json?: Record<string, unknown>;

  @ApiProperty({ required: false, example: {}, description: 'Schema template JSON' })
  @IsOptional()
  @IsObject()
  schema_template_json?: Record<string, unknown>;
}

export class EnrichmentFieldStrategyDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  enrichment_table_id: number;

  @ApiProperty({ example: 'name' })
  column_name: string;

  @ApiProperty({ required: false, example: 'VARCHAR(128)' })
  column_type?: string;

  @ApiProperty({ example: 'null', enum: ['static', 'range', 'generated', 'null', 'copy'] })
  strategy_code: string;

  @ApiProperty({ required: false })
  static_value?: unknown;

  @ApiProperty({ required: false })
  range_min?: number;

  @ApiProperty({ required: false })
  range_max?: number;

  @ApiProperty({ required: false })
  generator_type?: string;

  @ApiProperty({ required: false, example: {} })
  generator_options?: Record<string, unknown>;

  @ApiProperty()
  created_at: string;
}

export class UpsertEnrichmentFieldStrategyDto {
  @ApiProperty({ example: 'name' })
  @IsString()
  column_name: string;

  @ApiProperty({ required: false, example: 'VARCHAR(128)' })
  @IsOptional()
  @IsString()
  column_type?: string;

  @ApiProperty({ example: 'null', enum: ['static', 'range', 'generated', 'null', 'copy'] })
  @IsEnum(['static', 'range', 'generated', 'null', 'copy'])
  strategy_code: string;

  @ApiProperty({ required: false })
  @IsOptional()
  static_value?: unknown;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  range_min?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  range_max?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  generator_type?: string;

  @ApiProperty({ required: false, example: {} })
  @IsOptional()
  @IsObject()
  generator_options?: Record<string, unknown>;
}

export class EnrichmentTableWithStrategiesDto {
  @ApiProperty({ example: 1 })
  enrichment_table_id: number;

  @ApiProperty({ example: 'account_enrichment' })
  table_name: string;

  @ApiProperty({ example: 1 })
  table_order: number;

  @ApiProperty({ example: 13 })
  row_count: number;

  @ApiProperty({ required: false, example: { name: 'feeba', country: 'Pak' } })
  payload_template_json?: Record<string, unknown>;

  @ApiProperty({ required: false, example: {} })
  schema_template_json?: Record<string, unknown>;

  @ApiProperty({ type: [EnrichmentFieldStrategyDto] })
  field_strategies: EnrichmentFieldStrategyDto[];
}

export class EnrichmentTablesListDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [EnrichmentTableWithStrategiesDto] })
  data: EnrichmentTableWithStrategiesDto[];
}

export class EnrichmentTableResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: EnrichmentTableWithStrategiesDto })
  data: EnrichmentTableWithStrategiesDto;
}

export class BulkEnrichmentUpdateItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  enrichment_table_id: number;

  @ApiProperty({ required: false, example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  row_count?: number;

  @ApiProperty({ required: false, example: { name: 'updated' } })
  @IsOptional()
  @IsObject()
  payload_template_json?: Record<string, unknown>;

  @ApiProperty({ required: false, example: {} })
  @IsOptional()
  @IsObject()
  schema_template_json?: Record<string, unknown>;

  @ApiProperty({ required: false, example: {} })
  @IsOptional()
  @IsObject()
  faker_profile?: Record<string, unknown>;

  @ApiProperty({ required: false, type: [UpsertEnrichmentFieldStrategyDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertEnrichmentFieldStrategyDto)
  field_strategies?: UpsertEnrichmentFieldStrategyDto[];
}

export class BulkUpdateEnrichmentTablesResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [EnrichmentTableWithStrategiesDto] })
  data: EnrichmentTableWithStrategiesDto[];
}

export class DeleteEnrichmentTableResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ example: 'Enrichment table deleted' })
  message: string;
}
