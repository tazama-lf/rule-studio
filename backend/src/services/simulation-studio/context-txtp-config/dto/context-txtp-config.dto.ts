import { ApiProperty } from '@nestjs/swagger';
import type { ContextFieldStrategy } from '../../interface/common.types';
import { IsString, IsInt, IsOptional, IsEnum, Min, IsNumber, IsObject, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

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
  faker_semantic_type?: string;

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
  faker_semantic_type?: string;

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
