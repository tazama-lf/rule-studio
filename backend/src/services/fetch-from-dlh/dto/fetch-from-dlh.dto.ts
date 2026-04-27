import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class FetchFromDlhQueryDto {
  @ApiProperty({ example: 'pacs008', description: 'Transaction type' })
  @IsString()
  txtp!: string;

  @ApiProperty({ example: [], description: 'Fields to mask in the response', type: [String] })
  @IsArray()
  @IsString({ each: true })
  mask_fields!: string[];

  @ApiProperty({ example: '2026-01-28T00:00:00', description: 'Start date-time filter (ISO 8601)' })
  @IsDateString()
  startDtTm!: string;

  @ApiProperty({ example: '2026-01-28T23:59:59', description: 'End date-time filter (ISO 8601)' })
  @IsDateString()
  endDtTm!: string;
}

export class DlhResultFiltersDto {
  @ApiProperty()
  startDtTm!: string;

  @ApiProperty()
  endDtTm!: string;

  @ApiProperty()
  tenantId!: string;
}

export class DlhDataItemDto {
  @ApiProperty()
  creditor_account_id!: string;

  @ApiProperty()
  credttm_raw!: string;

  @ApiProperty()
  debtor_account_id!: string;

  @ApiProperty({ type: Object })
  document!: Record<string, unknown>;

  @ApiProperty()
  end_to_end_id!: string;

  @ApiProperty()
  message_id!: string;

  @ApiProperty()
  tenant_id!: string;

  @ApiProperty({ type: Object })
  document_json!: Record<string, unknown>;

  @ApiProperty()
  credttm_ts!: string;

  @ApiProperty()
  event_date!: string;

  @ApiProperty()
  ingested_at_ts!: string;

  @ApiProperty()
  record_hash!: string;

  @ApiProperty({ type: Object })
  _row_payload_json!: Record<string, unknown>;
}

export class DlhResultDto {
  @ApiProperty()
  txtp!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  code!: number;

  @ApiProperty({ type: [String] })
  masked_fields!: string[];

  @ApiProperty({ type: DlhResultFiltersDto })
  filters!: DlhResultFiltersDto;

  @ApiProperty()
  row_count!: number;

  @ApiProperty({ type: [DlhDataItemDto] })
  @Type(() => DlhDataItemDto)
  data!: DlhDataItemDto[];
}

export class FetchFromDlhResponseDto {
  @ApiProperty({ example: 'success' })
  status!: string;

  @ApiProperty({ type: [DlhResultDto] })
  @Type(() => DlhResultDto)
  results!: DlhResultDto[];

  @ApiProperty({ required: false, description: 'Name of the simulation table created in the DB (use with POST /send-to-dems/simulate)' })
  tableName?: string;

  @ApiProperty({ required: false, description: 'Simulation job ID — connect to WebSocket /simulation namespace with this to track progress' })
  jobId?: string;
}

