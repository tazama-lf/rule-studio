import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class CreateNodeDto {
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
  @IsObject()
  @IsNotEmpty()
  node_json: Record<string, unknown>;

  @ApiProperty({
    description: 'Tenant identifier',
    example: 'cbe',
  })
  @IsString()
  @IsNotEmpty()
  tenant_id: string;

  @ApiProperty({
    description: 'Identifier of the user who created the node',
    example: '1b7f59dd-8754-48eb-9573-65d106951635',
  })
  @IsString()
  @IsNotEmpty()
  created_by: string;

  @ApiProperty({
    description: 'Order of the node',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class RequestQueryNodeDto {
  @ApiProperty({
    description: 'The query string to be executed',
    example: 'SELECT * FROM nodes WHERE type = processor',
  })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({
    description: 'The name of the database to execute the query against',
    example: 'nodes_db',
  })
  @IsString()
  @IsNotEmpty()
  dbName: string;

  @ApiProperty({
    description: 'Optional parameters for the query',
    example: ['processor'],
  })
  @IsOptional()
  @IsArray()
  params?: unknown[];
}
