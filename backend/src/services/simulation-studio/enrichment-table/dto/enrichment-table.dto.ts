import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

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

  @ApiProperty({ required: true, example: { name: 'feeba', country: 'Pak' }, description: 'Sample payload template JSON' })
  @IsObject()
  payload_template_json: Record<string, unknown>;

  @ApiProperty({ required: true, example: { properties: [{ name: 'feeba', type: 'string' }] }, description: 'Schema template JSON' })
  @IsObject()
  schema_template_json: Record<string, unknown>;
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

  @ApiProperty({ example: 'keep_sample', enum: ['keep_sample', 'static', 'range', 'skip', 'random'] })
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

export class EnrichmentTableDto {
  @ApiProperty({ example: 1 })
  enrichment_table_id: number;

  @ApiProperty({ example: 'account_enrichment' })
  table_name: string;

  @ApiProperty({ example: 1 })
  table_order: number;

  @ApiProperty({ example: 13 })
  row_count: number;

  @ApiProperty({ required: true, example: { name: 'feeba', country: 'Pak' } })
  payload_template_json: Record<string, unknown>;

  @ApiProperty({ required: true, example: { properties: [{ name: 'feeba', type: 'string' }] } })
  schema_template_json: Record<string, unknown>;
}

export class EnrichmentTablesListDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [EnrichmentTableDto] })
  data: EnrichmentTableDto[];
}

export class EnrichmentTableResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: EnrichmentTableDto })
  data: EnrichmentTableDto;
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
}

export class BulkUpdateEnrichmentTablesResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [EnrichmentTableDto] })
  data: EnrichmentTableDto[];
}

export class DeleteEnrichmentTableResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ example: 'Enrichment table deleted' })
  message: string;
}
