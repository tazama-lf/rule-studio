import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty({ description: 'Unique message identifier', example: 'msg_001' })
  messageId: string;

  @ApiProperty({ description: 'Message timestamp in ISO format', example: '2024-04-14T10:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ description: 'Transaction data payload' })
  data: Record<string, unknown>;
}

export class SimulationResultDto {
  @ApiProperty({ description: 'Total number of messages in simulation', example: 3 })
  totalMessages: number;

  @ApiProperty({ description: 'Number of messages sent', example: 3 })
  sentMessages: number;

  @ApiProperty({ description: 'Number of messages delivered successfully', example: 2 })
  deliveredMessages: number;

  @ApiProperty({ description: 'Number of messages that failed', example: 1 })
  failedMessages: number;

  @ApiProperty({ description: 'Total simulation duration in milliseconds', example: 8000 })
  simulationDuration: number;

  @ApiProperty({ description: 'Delivery tracking details for each message', type: 'array' })
  deliveryTracker: MessageDeliveryStatusDto[];
}

export class MessageDeliveryStatusDto {
  @ApiProperty({ description: 'Message identifier', example: 'msg_001' })
  messageId: string;

  @ApiProperty({ description: 'Processing timestamp' })
  timestamp: Date;

  @ApiProperty({
    description: 'Delivery status',
    enum: ['pending', 'sent', 'delivered', 'failed'],
    example: 'delivered',
  })
  status: 'pending' | 'sent' | 'delivered' | 'failed';

  @ApiProperty({ description: 'Error message if failed', required: false })
  error?: string;
}

export class SimulationInfoDto {
  @ApiProperty({ description: 'Total number of messages', example: 3 })
  totalMessages: number;

  @ApiProperty({ description: 'Time span of simulation in milliseconds', example: 8000 })
  timeSpan: number;

  @ApiProperty({ description: 'Formatted time span', example: '8 seconds' })
  timeSpanFormatted: string;

  @ApiProperty({ description: 'DEMS endpoint being used' })
  endpoint: string;

  @ApiProperty({ description: 'Summary of messages', type: 'array' })
  messages: MessageSummaryDto[];
}

export class MessageSummaryDto {
  @ApiProperty({ description: 'Message identifier' })
  messageId: string;

  @ApiProperty({ description: 'Message timestamp' })
  timestamp: string;

  @ApiProperty({ description: 'Transaction ID' })
  transactionId: string;

  @ApiProperty({ description: 'Transaction amount' })
  amount: string;

  @ApiProperty({ description: 'Currency code' })
  currency: string;
}
