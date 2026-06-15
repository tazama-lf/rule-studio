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

  // @ApiProperty({ description: 'Generated database script with DDL and DML', required: false })
  // dbScript?: string;
}