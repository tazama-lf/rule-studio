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
}

export class CreateSimulationResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Simulation with id 1 created successfully' })
  message!: string;

  @ApiProperty({ description: 'ID of the created record', example: 1 })
  id!: number;
}

export class SimulationDto {
  @ApiProperty({ description: 'Record ID', example: 1 })
  id!: number;

  @ApiProperty({ description: 'Simulation identifier', example: 'sim-abc-001' })
  simulation_id!: string;

  @ApiProperty({ description: 'Total records to process', example: 100 })
  total_record!: number;

  @ApiProperty({ description: 'Records processed so far', example: 42 })
  record_processed!: number;

  @ApiProperty({ description: 'Simulation status', example: 'RUNNING' })
  sim_status!: string;

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
