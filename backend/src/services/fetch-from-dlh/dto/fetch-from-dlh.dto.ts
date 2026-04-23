import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class FetchFromDlhQueryDto {
  @ApiProperty({ example: 'pacs008', description: 'Transaction type' })
  @IsString()
  txtp: string;

  @ApiProperty({ example: [], description: 'Fields to mask in the response', type: [String] })
  @IsArray()
  @IsString({ each: true })
  mask_fields: string[];

  @ApiProperty({ example: '2026-01-28T00:00:00', description: 'Start date-time filter (ISO 8601)' })
  @IsDateString()
  startDtTm: string;

  @ApiProperty({ example: '2026-01-28T23:59:59', description: 'End date-time filter (ISO 8601)' })
  @IsDateString()
  endDtTm: string;
}

export class DlhResultFiltersDto {
  @ApiProperty()
  startDtTm: string;

  @ApiProperty()
  endDtTm: string;

  @ApiProperty()
  tenantId: string;
}

export class DlhResultDto {
  @ApiProperty()
  txtp: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  code: number;

  @ApiProperty({ type: [String] })
  masked_fields: string[];

  @ApiProperty({ type: DlhResultFiltersDto })
  filters: DlhResultFiltersDto;

  @ApiProperty()
  row_count: number;

  @ApiProperty({ type: [Object] })
  data: Array<Record<string, unknown>>;
}

export class FetchFromDlhResponseDto {
  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ type: [DlhResultDto] })
  @Type(() => DlhResultDto)
  results: DlhResultDto[];
}

