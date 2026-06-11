import { ApiProperty } from '@nestjs/swagger';

export class RunResultEntryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1, nullable: true })
  trigger_id: number | null;

  @ApiProperty({ type: Object, nullable: true })
  rule_result: unknown;

  @ApiProperty({ example: '500', nullable: true })
  independent_variable: string | null;

  @ApiProperty({ example: '.02' })
  sub_rule_ref: string;
}

export class SimulationRunResultDto {
  @ApiProperty({ example: 1 })
  run_id: number;

  @ApiProperty({ example: 13 })
  generation_id: number;

  @ApiProperty({ example: 'rule01' })
  rule_name: string;

  @ApiProperty({ example: 'v1.0.1' })
  rule_version: string;

  @ApiProperty({ example: 12, nullable: true })
  trigger_count: number | null;

  @ApiProperty({ example: 'success' })
  outcome: string;

  @ApiProperty({ type: [RunResultEntryDto] })
  triggers: RunResultEntryDto[];
}

export class SuiteResultDataDto {
  @ApiProperty({ example: 1 })
  suite_id: number;

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
