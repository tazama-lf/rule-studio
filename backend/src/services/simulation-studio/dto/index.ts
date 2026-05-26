import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsObject, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SimulationSuiteType, SimulationSuiteStatus } from 'src/utils/enums/simulation.enum';

export class SimulationSuitesDto {
  @ApiProperty({ description: 'Primary key', example: '101' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Tenant identifier', example: 'tenant_001' })
  @IsString()
  tenant_id: string;

  @ApiProperty({ description: 'Suite name', example: 'High Value Txns - Q3' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Suite description', example: 'Quarterly high value transfer suite', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Simulation type', enum: SimulationSuiteType, example: SimulationSuiteType.SINGLE_RULE })
  @IsEnum(SimulationSuiteType)
  simulation_type: SimulationSuiteType;

  @ApiProperty({ description: 'Suite status', enum: SimulationSuiteStatus, example: SimulationSuiteStatus.DRAFT })
  @IsEnum(SimulationSuiteStatus)
  status: SimulationSuiteStatus;

  @ApiProperty({ description: 'Rule repository identifier', required: false, example: 'repo-a' })
  @IsOptional()
  @IsString()
  rule_repo?: string;

  @ApiProperty({ description: 'Associated rule name', required: false, example: 'Rule 001' })
  @IsOptional()
  @IsString()
  rule_name?: string;

  @ApiProperty({ description: 'Associated rule version', required: false, example: 'v1.3.0' })
  @IsOptional()
  @IsString()
  rule_version?: string;

  @ApiProperty({ description: 'Primary transaction type (TXTP)', required: false, example: 'pacs.008' })
  @IsOptional()
  @IsString()
  primary_txtp?: string;

  @ApiProperty({ description: 'Primary transaction type version', required: false, example: '001.08' })
  @IsOptional()
  @IsString()
  primary_txtp_version?: string;

  @ApiProperty({ description: 'Source suite id when cloned', required: false, example: 88 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  clone_source_suite_id?: number;

  @ApiProperty({ description: 'Iteration count', example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  iteration_count: number;

  @ApiProperty({ description: 'Run count', example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  run_count: number;

  @ApiProperty({ description: 'Timestamp of last run', required: false, example: '2026-05-25T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  last_run_at?: string;

  @ApiProperty({ description: 'Wizard progress payload', example: {} })
  @IsObject()
  wizard_progress: Record<string, unknown>;

  @ApiProperty({ description: 'Additional metadata payload', example: {} })
  @IsObject()
  metadata: Record<string, unknown>;

  @ApiProperty({ description: 'Creator user id/name', example: 'john.doe' })
  @IsString()
  created_by: string;

  @ApiProperty({ description: 'Creator email', required: false, example: 'john.doe@acme.com' })
  @IsOptional()
  @IsString()
  created_by_email?: string;
}

export class SimulationSuitesListDto {
  @ApiProperty({ type: [SimulationSuitesDto] })
  suites: SimulationSuitesDto[];

  @ApiProperty({ description: 'Total number of matching suites', example: 25 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  total: number;

  @ApiProperty({ description: 'Limit used for current query', required: false, example: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  limit?: number;

  @ApiProperty({ description: 'Offset used for current query', required: false, example: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

export class RequestSimulationSuitesDto {
  @ApiProperty({ description: 'Suite name', example: 'Velocity Edge Cases' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Suite description', required: false, example: 'Edge scenario set for velocity checks' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Simulation type', enum: SimulationSuiteType, required: false, default: SimulationSuiteType.SINGLE_RULE })
  @IsOptional()
  @IsEnum(SimulationSuiteType)
  simulation_type?: SimulationSuiteType;

  @ApiProperty({ description: 'Initial status', enum: SimulationSuiteStatus, required: false, default: SimulationSuiteStatus.DRAFT })
  @IsOptional()
  @IsEnum(SimulationSuiteStatus)
  status?: SimulationSuiteStatus;

  @ApiProperty({ description: 'Rule repository identifier', required: false, example: 'repo-b' })
  @IsOptional()
  @IsString()
  rule_repo?: string;

  @ApiProperty({ description: 'Associated rule name', required: false, example: 'Rule 002' })
  @IsOptional()
  @IsString()
  rule_name?: string;

  @ApiProperty({ description: 'Associated rule alias from UI payload', required: false, example: 'Rule 002' })
  @IsOptional()
  @IsString()
  associated_rule?: string;

  @ApiProperty({ description: 'Associated rule version', required: false, example: 'v2.1.0' })
  @IsOptional()
  @IsString()
  rule_version?: string;

  @ApiProperty({ description: 'Primary transaction type (TXTP)', required: false, example: 'pacs.002' })
  @IsOptional()
  @IsString()
  primary_txtp?: string;

  @ApiProperty({ description: 'TXTP alias from UI payload', required: false, example: 'pacs.002' })
  @IsOptional()
  @IsString()
  txtp?: string;

  @ApiProperty({ description: 'Primary transaction type version', required: false, example: '001.03' })
  @IsOptional()
  @IsString()
  primary_txtp_version?: string;

  @ApiProperty({ description: 'TXTP version alias from UI payload', required: false, example: '001.03' })
  @IsOptional()
  @IsString()
  txtp_version?: string;

  @ApiProperty({ description: 'Generic version alias from UI payload', required: false, example: '001.03' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({ description: 'Clone source suite ID', required: false, example: 101 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  clone_source_suite_id?: number;

  @ApiProperty({ description: 'Wizard progress payload', required: false, example: {} })
  @IsOptional()
  @IsObject()
  wizard_progress?: Record<string, unknown>;

  @ApiProperty({ description: 'Additional metadata payload', required: false, example: {} })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class PatchSimulationSuitesDto {
  @ApiProperty({ description: 'Suite name', required: false, example: 'High Value Txns - Q4' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Suite description', required: false, example: 'Updated suite description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Simulation type', enum: SimulationSuiteType, required: false })
  @IsOptional()
  @IsEnum(SimulationSuiteType)
  simulation_type?: SimulationSuiteType;

  @ApiProperty({ description: 'Suite status', enum: SimulationSuiteStatus, required: false })
  @IsOptional()
  @IsEnum(SimulationSuiteStatus)
  status?: SimulationSuiteStatus;

  @ApiProperty({ description: 'Rule repository identifier', required: false })
  @IsOptional()
  @IsString()
  rule_repo?: string;

  @ApiProperty({ description: 'Associated rule name', required: false })
  @IsOptional()
  @IsString()
  rule_name?: string;

  @ApiProperty({ description: 'Associated rule alias from UI payload', required: false })
  @IsOptional()
  @IsString()
  associated_rule?: string;

  @ApiProperty({ description: 'Associated rule version', required: false })
  @IsOptional()
  @IsString()
  rule_version?: string;

  @ApiProperty({ description: 'Primary transaction type (TXTP)', required: false })
  @IsOptional()
  @IsString()
  primary_txtp?: string;

  @ApiProperty({ description: 'TXTP alias from UI payload', required: false })
  @IsOptional()
  @IsString()
  txtp?: string;

  @ApiProperty({ description: 'Primary transaction type version', required: false })
  @IsOptional()
  @IsString()
  primary_txtp_version?: string;

  @ApiProperty({ description: 'TXTP version alias from UI payload', required: false })
  @IsOptional()
  @IsString()
  txtp_version?: string;

  @ApiProperty({ description: 'Generic version alias from UI payload', required: false })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({ description: 'Clone source suite ID', required: false })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  clone_source_suite_id?: number;

  @ApiProperty({ description: 'Iteration count', required: false, example: 4 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  iteration_count?: number;

  @ApiProperty({ description: 'Run count', required: false, example: 3 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  run_count?: number;

  @ApiProperty({ description: 'Timestamp of last run', required: false, example: '2026-05-25T10:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  last_run_at?: string;

  @ApiProperty({ description: 'Wizard progress payload', required: false, example: {} })
  @IsOptional()
  @IsObject()
  wizard_progress?: Record<string, unknown>;

  @ApiProperty({ description: 'Additional metadata payload', required: false, example: {} })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class SimulationSuitesQueryDto {
  @ApiProperty({ description: 'Search by suite name (case-insensitive contains)', required: false, example: 'velocity' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Filter by status', required: false, enum: SimulationSuiteStatus, example: SimulationSuiteStatus.DRAFT })
  @IsOptional()
  @IsEnum(SimulationSuiteStatus)
  status?: SimulationSuiteStatus;

  @ApiProperty({ description: 'Filter by associated rule name', required: false, example: 'Rule 002' })
  @IsOptional()
  @IsString()
  rule_name?: string;

  @ApiProperty({ description: 'Filter by transaction type (TXTP)', required: false, example: 'pacs.008' })
  @IsOptional()
  @IsString()
  txtp?: string;

  @ApiProperty({ description: 'Filter by updated date from (inclusive)', required: false, example: '2026-05-01' })
  @IsOptional()
  @IsString()
  updated_from?: string;

  @ApiProperty({ description: 'Filter by updated date to (inclusive)', required: false, example: '2026-05-31' })
  @IsOptional()
  @IsString()
  updated_to?: string;

  @ApiProperty({ description: 'Offset (0-based)', required: false, example: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiProperty({ description: 'Limit', required: false, example: 20 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
