import { ApiProperty } from '@nestjs/swagger';

export class FetchCountRequestDto {
  @ApiProperty({ example: '2026-01-28T00:00:00', description: 'Start date-time filter (ISO 8601)' })
  startDtTm!: string;

  @ApiProperty({ example: '2026-01-28T23:59:59', description: 'End date-time filter (ISO 8601)' })
  endDtTm!: string;
}

export class MaskingConfigItemDto {
  @ApiProperty({ example: 'cbe' })
  tenant_id: string;

  @ApiProperty({ example: 'amount' })
  txtp: string;

  @ApiProperty({ example: '1.1.2' })
  txtp_version: string;

  @ApiProperty({ description: 'Tokenization config (JSONB)', example: { field: 'value' }, nullable: true })
  tokenize: Record<string, unknown> | null;
}

export class FetchCountResponseDto {
  @ApiProperty({ type: () => [MaskingConfigItemDto] })
  masks: MaskingConfigItemDto[];

  @ApiProperty({ example: 5 })
  total: number;
}
