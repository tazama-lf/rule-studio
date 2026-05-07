import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSimulationDto {
  @ApiProperty({ description: 'Unique simulation identifier', example: 'sim-abc-001' })
  @IsString()
  @IsNotEmpty()
  simulation_id!: string;

  @ApiPropertyOptional({ description: 'Total records to process', example: 100 })
  @IsOptional()
  @IsNumber()
  total_record?: number;

  @ApiPropertyOptional({ description: 'Records already processed', example: 0 })
  @IsOptional()
  @IsNumber()
  record_processed?: number;

  @ApiPropertyOptional({ description: 'Initial simulation status', example: 'RUNNING', default: 'RUNNING' })
  @IsOptional()
  @IsString()
  sim_status?: string;

  @ApiPropertyOptional({ description: 'Total number of iterations', example: 1 })
  @IsOptional()
  @IsNumber()
  total_iterations?: number;
}

export class CreateSimulationResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Simulation sim-abc-001 created successfully' })
  message!: string;

  @ApiProperty({ description: 'simulation_id of the created record', example: 'sim-abc-001' })
  simulation_id!: string;
}

export class SimulationDto {
  @ApiProperty({ description: 'Simulation identifier (primary key)', example: 'sim-abc-001' })
  simulation_id!: string;

  @ApiProperty({ description: 'Total records to process', example: 100 })
  total_record!: number;

  @ApiProperty({ description: 'Records processed so far', example: 42 })
  record_processed!: number;

  @ApiProperty({ description: 'Simulation status', example: 'RUNNING' })
  sim_status!: string;

  @ApiProperty({ description: 'Total number of iterations', example: 1 })
  total_iterations!: number;

  @ApiProperty({ description: 'Created at timestamp' })
  created_at!: string;

  @ApiProperty({ description: 'Updated at timestamp' })
  updated_at!: string;
}

export class SimulationListResponseDto {
  @ApiProperty({ type: [SimulationDto] })
  simulations!: SimulationDto[];

  @ApiProperty({ description: 'Total count of records', example: 25 })
  total!: number;

  @ApiProperty({ description: 'Page limit', example: 10 })
  limit!: number;

  @ApiProperty({ description: 'Page offset', example: 0 })
  offset!: number;

  @ApiProperty({ description: 'Total pages', example: 3 })
  pages!: number;
}

export class ExcludedTypeProps {
  @IsOptional()
  @IsString()
  masking_id?: null | string;

  @IsString()
  @IsNotEmpty()
  txtp?: string;

  @IsString()
  @IsNotEmpty()
  txtp_version?: string;

  @IsString()
  @IsNotEmpty()
  record_status?: string;
}

export class SimulationStatsDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ description: 'Total rows in the sim table', example: 1247 })
  total_no_of_records!: number;

  @ApiProperty({ description: 'Rows in the results table for the given iteration and tenant', example: 1200 })
  records_evaluated!: number;

  @ApiProperty({ description: 'Count of rows where report.status != NALT', example: 45 })
  alerts_generated!: number;

  @ApiProperty({ description: 'Count of rows where report.status = NALT', example: 1155 })
  alerts_not_generated!: number;

  @ApiProperty({ description: 'Run date & time from first record credttm (YYYY-MM-DD HH:mm)', example: '2025-03-10 14:30', nullable: true })
  run_date_time!: string | null;

  @ApiProperty({ description: 'Duration between first and last credttm in the sim table', example: '2m 15s', nullable: true })
  replay_duration!: string | null;
}

export class SimulationResultRowDto {
  @ApiProperty({ description: 'Message ID', example: 'msg001' })
  msg_id!: string;

  @ApiProperty({ description: 'Message type (TxTp)', example: 'pacs.008' })
  msg_type!: string;

  @ApiProperty({ description: 'Hit or No-Hit', example: 'Hit' })
  outcome!: string;

  @ApiProperty({ description: 'Timestamp from sim table credttm column', example: '2026-01-28T18:47:16.868+03:00', nullable: true })
  time!: string | null;

  @ApiProperty({ description: 'Triggered rules extracted from typology ruleResults' })
  triggered_rules!: unknown[];

  @ApiProperty({ description: 'Triggered typologies from evaluation tadpResult.typologyResult' })
  triggered_typologies!: unknown[];
}

export class SimulationResultsResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: [SimulationResultRowDto] })
  data!: SimulationResultRowDto[];

  @ApiProperty({ description: 'Total count of records', example: 100 })
  total!: number;

  @ApiProperty({ description: 'Page limit', example: 10 })
  limit!: number;

  @ApiProperty({ description: 'Page offset', example: 0 })
  offset!: number;
}
