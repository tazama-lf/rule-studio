import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsObject, IsEnum, IsOptional } from 'class-validator';
import { SimulationLogCategory } from 'src/utils/enums/simulation.enum';

export class SimulationLogsDto {
  @ApiProperty({
    description: 'Unique identifier for the simulation log',
    example: 'log_001',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Identifier of the associated rule',
    example: 'rule_001',
  })
  @IsString()
  @IsNotEmpty()
  rule_id: string;

  @ApiProperty({ description: 'Tenant identifier', example: 'tenant_001' })
  @IsString()
  tenant_id: string;

  @ApiProperty({
    description: 'old data for the simulation',
    example: { key: 'value' },
  })
  @IsObject()
  @IsOptional()
  old_data?: Record<string, unknown>;

  @ApiProperty({
    description: 'updated data from the simulation',
    example: { result: 'success' },
  })
  @IsObject()
  new_data: Record<string, unknown>;

  @ApiProperty({ description: 'User who created the log', example: 'user_001' })
  @IsString()
  created_by?: string;

  @ApiProperty({
    description: 'Email of the user who created the log',
    example: 'john.doe@example.com',
  })
  @IsString()
  created_by_email?: string;

  @ApiProperty({
    description: 'Timestamp when the log was created',
    example: '2024-10-01T12:00:00Z',
  })
  @IsDateString()
  created_at?: Date;

  @ApiProperty({
    description: 'Timestamp when the log was last updated',
    example: '2024-10-01T12:30:00Z',
  })
  @IsDateString()
  updated_at?: Date;

  @ApiProperty({
    description: 'Category of the flow',
    example: SimulationLogCategory.READ_ONLY,
  })
  @IsEnum(SimulationLogCategory)
  @IsNotEmpty()
  category: SimulationLogCategory;
}

export class RequestSimulationLogsDto {
  @ApiProperty({
    description: 'old data for the simulation',
    example: { key: 'value' },
  })
  @IsObject()
  @IsOptional()
  old_data?: Record<string, unknown>;

  @ApiProperty({
    description: 'updated data from the simulation',
    example: { result: 'success' },
  })
  @IsObject()
  new_data: Record<string, unknown>;

  @ApiProperty({
    description: 'description of the simulation log',
    example: 'Simulation log for rule execution',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Category of the flow',
    example: SimulationLogCategory.READ_ONLY,
  })
  @IsEnum(SimulationLogCategory)
  @IsNotEmpty()
  category: SimulationLogCategory;
}
