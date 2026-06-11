import { ApiProperty } from '@nestjs/swagger';

export class TriggerConfigDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 10 })
  generation_id: number;

  @ApiProperty({ example: 'pacs.002.001.12' })
  txtp: string;

  @ApiProperty({ example: '001.12' })
  txtp_version: string;

  @ApiProperty({ example: 1 })
  display_order: number;

  @ApiProperty({ example: 100 })
  message_count: number;

  @ApiProperty({ example: false })
  link_to_context_pairs: boolean;

  @ApiProperty({ type: Object })
  payload_template_json: Record<string, unknown>;

  @ApiProperty({ example: 500, nullable: true })
  expected_independent_variable: number | null;

  @ApiProperty({ example: 'good', nullable: true })
  expected_result_band: string | null;

  @ApiProperty({ example: null, nullable: true })
  notes: string | null;

  @ApiProperty({ example: null, nullable: true })
  faker_seed: number | null;

  @ApiProperty({ type: Object })
  generator_profile: Record<string, unknown>;

  @ApiProperty({ example: null, nullable: true })
  related_txtp_config_id: number | null;

  @ApiProperty({ example: null, nullable: true })
  related_transaction: string | null;
}

export class RunResultEntryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'SUCCESS', nullable: true })
  outcome: string | null;

  @ApiProperty({ example: '500', nullable: true })
  independent_variable: string | null;

  @ApiProperty({ example: '.x02' })
  sub_rule_ref: string;

  @ApiProperty({ type: Object, nullable: true })
  rule_result: unknown;

  @ApiProperty({ type: TriggerConfigDto, nullable: true })
  trigger: TriggerConfigDto | null;
}

export class SimulationRunResultDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'PASS' })
  outcome: string;

  @ApiProperty({ example: 'v10' })
  rule_version: string;

  @ApiProperty({ example: 'rule021' })
  rule_name: string;

  @ApiProperty({ type: [RunResultEntryDto] })
  triggers: RunResultEntryDto[];
}

export class SuiteResultDataDto {
  @ApiProperty({ example: 3 })
  suite_id: number;

  @ApiProperty({ example: 5 })
  total_runs: number;

  @ApiProperty({ type: [SimulationRunResultDto] })
  results: SimulationRunResultDto[];
}

export class SuiteResultResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Suite result retrieved successfully' })
  message: string;

  @ApiProperty({ type: SuiteResultDataDto })
  data: SuiteResultDataDto;
}
