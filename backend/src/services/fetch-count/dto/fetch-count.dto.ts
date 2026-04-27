import { ApiProperty } from '@nestjs/swagger';

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
