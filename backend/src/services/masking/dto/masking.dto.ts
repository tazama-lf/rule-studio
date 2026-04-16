import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class MaskingFiltersDto {
  @ApiPropertyOptional({ description: 'Filter by status', example: 'STATUS_01_IN_PROGRESS' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by transaction type', example: 'pain.001.001.11' })
  @IsOptional()
  @IsString()
  txtp?: string;

  @ApiPropertyOptional({
    description: 'Sort order for updated_at (DESC = newest first, ASC = oldest first)',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}

export class MaskingDto {
  @ApiProperty({ description: 'Unique identifier', example: 'uuid-...' })
  id!: string;

  @ApiProperty({ description: 'Tenant identifier', example: 'DEFAULT' })
  tenant_id!: string;

  @ApiProperty({ description: 'Transaction type', example: 'pain.001.001.11' })
  txtp!: string;

  @ApiProperty({ description: 'Transaction type version', example: '11' })
  txtp_version!: string;

  @ApiProperty({ description: 'Status', example: 'STATUS_01_IN_PROGRESS' })
  status!: string;

  @ApiProperty({ description: 'Number of fields masked', example: 3 })
  fields_masked!: number;

  @ApiProperty({ description: 'Total number of fields', example: 10 })
  total_fields!: number;

  @ApiPropertyOptional({ description: 'Comments', example: 'Pending review' })
  comments?: string;

  @ApiProperty({ description: 'Created at timestamp' })
  created_at!: string;

  @ApiProperty({ description: 'Updated at timestamp' })
  updated_at!: string;
}

export class MaskingListResponseDto {
  @ApiProperty({ type: [MaskingDto] })
  masks!: MaskingDto[];

  @ApiProperty({ description: 'Total count of matching records', example: 25 })
  total!: number;
}

export class UpdateMaskDto {
  @ApiPropertyOptional({ description: 'Transaction type', example: 'pain.001.001.11' })
  @IsOptional()
  @IsString()
  txtp?: string;

  @ApiPropertyOptional({ description: 'Transaction type version', example: '11' })
  @IsOptional()
  @IsString()
  txtp_version?: string;

  @ApiPropertyOptional({ description: 'Status', example: 'STATUS_02_READY_FOR_REVIEW' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Number of fields masked', example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  fields_masked?: number;

  @ApiPropertyOptional({ description: 'Total number of fields', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  total_fields?: number;

  @ApiPropertyOptional({ description: 'Comments', example: 'Updated masking configuration' })
  @IsOptional()
  @IsString()
  comments?: string;
}
