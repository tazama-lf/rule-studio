import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsEnum, Min, IsNumber, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
  faker_semantic_type?: string;

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
  faker_semantic_type?: string;

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
