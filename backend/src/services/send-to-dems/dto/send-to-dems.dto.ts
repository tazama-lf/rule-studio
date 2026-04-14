import { ApiProperty } from '@nestjs/swagger';

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
