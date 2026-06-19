import { ApiProperty } from '@nestjs/swagger';

export class SampleMessageItemDto {
  @ApiProperty({ description: 'Context TXTP config ID', example: 1 })
  context_txtp_config_id!: number;

  @ApiProperty({ description: 'Transaction type pattern', example: 'pacs.008' })
  txtp!: string;

  @ApiProperty({ description: 'TXTP version', example: '001.08' })
  txtp_version!: string;

  @ApiProperty({ description: 'Display order of this context config', example: 1 })
  display_order!: number;

  @ApiProperty({ description: 'Number of messages to generate', example: 3 })
  message_count!: number;

  @ApiProperty({ description: 'Generated sample payloads', type: 'array', items: { type: 'object' } })
  payloads!: Array<Record<string, unknown>>;
}

export class GenerateSampleMessagesResponseDto {
  @ApiProperty({ description: 'Whether the operation succeeded', example: true })
  success!: boolean;

  @ApiProperty({ description: 'List of generated sample messages per context config', type: [SampleMessageItemDto] })
  data!: SampleMessageItemDto[];
}

export class EnrichmentTableRowDto {
  [key: string]: unknown;
}

export class EnrichmentTableItemDto {
  @ApiProperty({ description: 'Enrichment table ID', example: '28' })
  enrichment_table_id!: string;

  @ApiProperty({ description: 'Name of the enrichment table', example: 'table1' })
  table_name!: string;

  @ApiProperty({ description: 'Display order of the enrichment table', example: 1 })
  table_order!: number;

  @ApiProperty({ description: 'Number of rows in the enrichment table', example: 1 })
  row_count!: number;

  @ApiProperty({ description: 'Rows of enrichment data', type: 'array', items: { type: 'object' } })
  rows!: EnrichmentTableRowDto[];
}

export class GenerateEnrichmentResponseDto {
  @ApiProperty({ description: 'Whether the operation succeeded', example: true })
  success!: boolean;

  @ApiProperty({ description: 'Generated enrichment payloads', type: [EnrichmentTableItemDto] })
  data!: EnrichmentTableItemDto[];
}

//   enrichment resp {
//   success: true,
//   data: [
//     {
//       enrichment_table_id: '28',
//       table_name: 'table1',
//       table_order: 1,
//       row_count: 1,
//       rows: [Array]
//     }
//   ]
// }
