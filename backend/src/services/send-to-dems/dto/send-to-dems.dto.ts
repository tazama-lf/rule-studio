import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty, ArrayMinSize } from 'class-validator';

export class StartSimulationResponseDto {
  @ApiProperty({ description: 'Unique job identifier for tracking progress via WebSocket', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  jobId: string;
}

export class SimulationLogDto {
  @ApiProperty({ description: 'ISO timestamp of the log entry', example: '2026-04-21T16:26:40.000Z' })
  timestamp: string;

  @ApiProperty({ description: 'Log level driving frontend colour', enum: ['info', 'success', 'warning', 'error'], example: 'info' })
  level: 'info' | 'success' | 'warning' | 'error';

  @ApiProperty({ description: 'Human-readable log message', example: 'Initializing simulation environment...' })
  message: string;
}

export class ProgressUpdateDto {
  @ApiProperty({ description: 'Job identifier' })
  jobId: string;

  @ApiProperty({ description: 'Progress percentage (0–100)', example: 55 })
  progress: number;

  @ApiProperty({ description: 'Number of messages processed so far', example: 110 })
  processed: number;

  @ApiProperty({ description: 'Total number of messages in the job', example: 200 })
  total: number;

  @ApiProperty({ description: 'Current job status', enum: ['running', 'completed', 'failed'], example: 'running' })
  status: 'running' | 'completed' | 'failed';

  @ApiProperty({ description: 'Log entry emitted alongside this progress update', required: false, type: () => SimulationLogDto })
  log?: SimulationLogDto;
}

export class StartSimulationDto {
  @ApiProperty({
    description: 'One or more simulation table names to load messages from',
    example: ['sim001'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  tableNames: string[];
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
