import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsObject, IsEnum, IsOptional, IsInt, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SimulationSuiteType, SimulationSuiteStatus } from 'src/utils/enums/simulation.enum';

const SUITE_NAME_MAX_LENGTH = 120;
const SUITE_DESCRIPTION_MAX_LENGTH = 500;

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
  @ApiProperty({ description: 'Request status flag', example: true })
  success: boolean;

  @ApiProperty({ description: 'Response message', example: 'Simulation suites retrieved successfully' })
  message: string;

  @ApiProperty({ type: [SimulationSuitesDto] })
  suites: SimulationSuitesDto[];

  @ApiProperty({ description: 'Total number of matching suites', example: 25 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  total?: number;
}

export class SimulationSuiteResponseDto {
  @ApiProperty({ description: 'Request status flag', example: true })
  success: boolean;

  @ApiProperty({ description: 'Response message', example: 'Simulation suite updated successfully' })
  message: string;

  @ApiProperty({ type: SimulationSuitesDto })
  suite: SimulationSuitesDto;
}

export class RequestSimulationSuitesDto {
  @ApiProperty({ description: 'Suite name', example: 'Velocity Edge Cases' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(SUITE_NAME_MAX_LENGTH)
  name: string;

  @ApiProperty({ description: 'Suite description', required: false, example: 'Edge scenario set for velocity checks' })
  @IsOptional()
  @IsString()
  @MaxLength(SUITE_DESCRIPTION_MAX_LENGTH)
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
  @MaxLength(SUITE_NAME_MAX_LENGTH)
  name?: string;

  @ApiProperty({ description: 'Suite description', required: false, example: 'Updated suite description' })
  @IsOptional()
  @IsString()
  @MaxLength(SUITE_DESCRIPTION_MAX_LENGTH)
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

export class UpdateDraftSuiteDto {
  @ApiProperty({ description: 'Wizard screen number to persist', example: 2, minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  screen: number;

  @ApiProperty({ description: 'Wizard screen draft payload', example: { txtpConfigs: [] } })
  @IsObject()
  data: Record<string, unknown>;
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

  @ApiProperty({ description: 'Rule alias for rule_name', required: false, example: 'Rule 002' })
  @IsOptional()
  @IsString()
  rule?: string;

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

  @ApiProperty({ description: 'Page number (1-based). Converted to offset when offset is not supplied', required: false, example: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;
}

export class RegistryRepoDto {
  @ApiProperty({ description: 'Repository name', example: 'rule-high-value' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Docker namespace', example: 'tazama' })
  @IsString()
  namespace: string;

  @ApiProperty({ description: 'Repository last updated timestamp', example: '2026-05-31T10:00:00.000Z' })
  @IsString()
  last_updated: string;
}

export class RegistryReposResponseDto {
  @ApiProperty({ type: [RegistryRepoDto] })
  rules: RegistryRepoDto[];

  @ApiProperty({ description: 'Total number of repositories', example: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  count: number;
}

export class RegistryTagDto {
  @ApiProperty({ description: 'Image tag', example: 'v1.2.3' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Tag digest', example: 'sha256:abc123' })
  @IsString()
  digest: string;

  @ApiProperty({ description: 'Tag last updated timestamp', example: '2026-05-31T10:00:00.000Z' })
  @IsString()
  last_updated: string;
}

export class RegistryTagsResponseDto {
  @ApiProperty({ description: 'Repository name', example: 'rule-high-value' })
  @IsString()
  rule: string;

  @ApiProperty({ type: [RegistryTagDto] })
  tags: RegistryTagDto[];

  @ApiProperty({ description: 'Total number of tags', example: 7 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  count: number;
}

export class TxtpTypeDto {
  @ApiProperty({ description: 'Transaction type', example: 'pacs.008' })
  @IsString()
  txtp: string;

  @ApiProperty({ description: 'Supported versions', type: [String], example: ['001.08', '001.09'] })
  versions: string[];
}

export class TxtpSchemaResponseDto {
  @ApiProperty({ description: 'Transaction schema object', type: Object })
  schema: Record<string, unknown>;
}

export class TxtpSampleResponseDto {
  @ApiProperty({ description: 'Sample payload object', type: Object })
  payload: Record<string, unknown>;
}

export class GenerateContextQueryDto {
  @ApiProperty({ description: 'Number of rows to generate', required: false, example: 5 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  count?: number;
}

export class GeneratedContextRowDto {
  @ApiProperty({ description: 'Generated row index', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  row_index: number;

  @ApiProperty({ description: 'Transaction type', example: 'pacs.008' })
  @IsString()
  txtp: string;

  @ApiProperty({ description: 'Generated payload', type: Object })
  payload: Record<string, unknown>;
}

export class GenerateContextResponseDto {
  @ApiProperty({ description: 'Request status flag', example: true })
  success: boolean;

  @ApiProperty({ description: 'Response message', example: 'Simulation context generated successfully' })
  message: string;

  @ApiProperty({ type: [GeneratedContextRowDto] })
  rows: GeneratedContextRowDto[];

  @ApiProperty({ description: 'Generated row count', example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  count: number;
}

export class RunSuiteResponseDto {
  @ApiProperty({ description: 'Request status flag', example: true })
  success: boolean;

  @ApiProperty({ description: 'Response message', example: 'Simulation run started successfully' })
  message: string;

  @ApiProperty({ description: 'Run identifier', example: 'run-101-1717198021000' })
  @IsString()
  runId: string;

  @ApiProperty({ description: 'Run status', example: 'ENV_PROVISIONING' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Run phase', example: 'ENV_PROVISIONING' })
  @IsString()
  phase: string;
}

export class RunSuiteStatusResponseDto {
  @ApiProperty({ description: 'Request status flag', example: true })
  success: boolean;

  @ApiProperty({ description: 'Response message', example: 'Simulation run status retrieved successfully' })
  message: string;

  @ApiProperty({ description: 'Run identifier', example: 'run-101-1717198021000' })
  @IsString()
  runId: string;

  @ApiProperty({ description: 'Run status', example: 'RUNNING' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Run phase', example: 'TRANSACTION_LOOP' })
  @IsString()
  phase: string;

  @ApiProperty({ description: 'Optional error details', required: false, example: 'Container failed health check' })
  @IsOptional()
  @IsString()
  error_message?: string;

  @ApiProperty({ description: 'Optional partial results payload', required: false, type: [Object] })
  @IsOptional()
  partialResults?: Array<Record<string, unknown>>;
}
