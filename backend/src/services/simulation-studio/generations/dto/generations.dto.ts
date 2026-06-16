import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

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

  @ApiProperty({ example: { currentStep: 1, completedSteps: [1] } })
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

// ── Generation Summary ────────────────────────────────────────────────────────

export class ContextTxtpSummaryDto {
  @ApiProperty({ example: 'pacs.008' })
  txtp: string;

  @ApiProperty({ example: '001.08' })
  txtp_version: string;

  @ApiProperty({ example: 100 })
  message_count: number;
}

export class GenerationSummaryDto {
  @ApiProperty({ example: 7 })
  generation_id: number;

  @ApiProperty({ example: 1 })
  generation_number: number;

  @ApiProperty({ example: 'DRAFT' })
  status: string;

  @ApiProperty({ example: 'Q3 Edge Cases' })
  suite_name: string;

  @ApiProperty({ required: false, example: 'Rule 001' })
  associated_rule: string | null;

  @ApiProperty({ required: false, example: 'pacs.008' })
  primary_txtp: string | null;

  @ApiProperty({ type: [ContextTxtpSummaryDto] })
  context_txtp_configs: ContextTxtpSummaryDto[];

  @ApiProperty({ type: [String], example: ['account_enrichment'] })
  enrichment_table_names: string[];

  @ApiProperty({ example: 100 })
  context_count: number;

  @ApiProperty({ example: 10 })
  trigger_count: number;

  @ApiProperty({ example: 1 })
  enrichment_table_count: number;

  @ApiProperty({ example: 4, description: 'v(N) — iteration number (new = iteration_count + 1)' })
  iteration_number: number;
}

export class GenerationSummaryResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: GenerationSummaryDto })
  data: GenerationSummaryDto;
}

export class CloneGenerationDto {
  @ApiProperty({ description: 'Source generation id to clone', example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  suite_id!: number;

  @ApiProperty({ description: 'Source generation id to clone', example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  generation_id!: number;
}
