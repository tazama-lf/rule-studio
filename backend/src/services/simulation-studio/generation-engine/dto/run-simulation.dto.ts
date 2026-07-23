import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class RunSimulationDto {
  @ApiProperty({ description: 'Simulation suite ID — rule_name, rule_version and rule_config are read from the suite', example: 1 })
  @IsInt()
  @IsPositive()
  suiteId!: number;

  @ApiProperty({ description: 'Generation ID — trigger messages are fetched for this generation', example: 1 })
  @IsInt()
  @IsPositive()
  generationId!: number;
}

export interface SampleTriggerMessage {
  trigger_txtp_config_id: number;
  txtp: string;
  txtp_version: string;
  display_order: number;
  related_transaction: string | null;
  related_txtp_config_id: number | null;
  payload: Record<string, unknown>;
}

export interface SampleTriggerMessagesResponse {
  success: boolean;
  data: SampleTriggerMessage[];
}

export interface RuleResult {
  trigger_txtp_config_id: number;
  txtp: string;
  payload: Record<string, unknown>;
  result: unknown;
  error?: string;
}

export class RunSimulationResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ description: 'Rule evaluation results for each trigger message' })
  results!: RuleResult[];

  @ApiProperty({ required: false, example: true, description: 'True when the simulation exceeded the 60 s timeout' })
  timedOut?: boolean;

  @ApiProperty({ required: false, example: 'Simulation timed out after 60 s' })
  message?: string;
}
