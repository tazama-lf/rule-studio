import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsJSON, IsDate } from 'class-validator';

export class ResponseNodesDto {
  @ApiProperty({
    description: 'Unique identifier for the node',
    example: 'cbe',
  })
  @IsString()
  tenant_id: string;

  @ApiProperty({
    description: 'Identifier of the user who created the node',
    example: '1b7f59dd-8754-48eb-9573-65d106951635',
  })
  @IsString()
  created_by: string;

  @ApiProperty({
    description: 'JSON representation of the node',
    example: {
      id: 'node-001',
      type: 'processor',
      name: 'Transaction Validator',
      description: 'Validates incoming transactions',
      config: { timeout: 5000, retries: 3 },
    },
  })
  @IsJSON()
  node_json: unknown;

  @ApiProperty({
    description: 'Order of the node',
    example: 1,
    required: false,
  })
  @IsOptional()
  order?: number;

  @ApiProperty({
    description: 'Timestamp when the node was created',
    example: '2024-01-01T12:00:00Z',
  })
  @IsDate()
  created_at: Date;

  @ApiProperty({
    description: 'Timestamp when the node was last updated',
    example: '2024-01-02T12:00:00Z',
  })
  @IsDate()
  updated_at: Date;
}

export class ResponseQueryNodeDto {
  @ApiProperty({
    description: 'Indicates if the query execution was successful',
    example: 'true',
  })
  @IsOptional()
  @IsString()
  success?: string;

  @ApiProperty({
    description: 'Message related to the query execution',
    example: 'Query executed successfully',
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({
    description: 'Result of the executed query',
    example: [{ id: 'node-001', type: 'processor', name: 'Transaction Validator' }],
  })
  @IsOptional()
  result?: unknown[];
}
