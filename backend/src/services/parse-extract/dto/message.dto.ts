import { ApiProperty } from '@nestjs/swagger';

export interface TransactionalMessage {
  TxTp: string;
  TenantId?: string;
  [key: string]: any; // Allow for CstmrCdtTrfInitn, FIToFIPmtStsRpt, FIToFICstmrCdtTrf, etc.
}

export interface ConfigEntity {
  id: number;
  msg_fam: string;
  transaction_type: string;
  endpoint_path: string;
  version: string;
  content_type: string;
  schema: any; // JSONB
  mapping?: any; // JSONB
  tenant_id: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  status: string;
  functions?: any; // JSONB
  publishing_status?: string;
  comments?: string;
  payload?: any; // JSONB - This is what we need
}

export type NetworkMap = Record<string, any>;

export type DataCache = Record<string, any>;

export interface MetaData {
  correlationId?: string;
  timestamp?: string;
  tenantId?: string;
  transactionType?: string;
  [key: string]: any;
}

export interface RuleRequest {
  transaction: any; // The validated payload (will be strongly typed later)
  networkMap: NetworkMap;
  DataCache: DataCache;
  metaData?: MetaData;
}

export interface ParseExtractResponse {
  success: boolean;
  message: string;
  processedAt: string;
  configPayload?: any; // The payload from config table
  transactionType?: string;
  validationErrors?: string[]; // Array of validation error messages
  validatedPayload?: any; // The validated payload when successful
  correlationId?: string; // For tracking
  ruleRequest?: RuleRequest; // Add RuleRequest to the response
}

export class ParseExtractResponseDto {
  @ApiProperty({
    description: 'Indicates if the parsing and extraction was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Detailed message about the parsing and extraction process',
    example: 'Payload validated successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp when the processing was completed',
    example: '2024-10-01T12:34:56Z',
  })
  processedAt: string;

  @ApiProperty({
    description: 'Configuration payload used for processing',
    required: false,
  })
  configPayload?: any;

  @ApiProperty({
    description: 'Type of the transaction processed',
    required: false,
    example: 'CstmrCdtTrfInitn',
  })
  transactionType?: string;

  @ApiProperty({
    description: 'List of validation errors encountered during processing',
    required: false,
    example: ['Missing required field: Amount', 'Invalid date format in field: Date'],
  })
  validationErrors?: string[];

  @ApiProperty({
    description: 'The validated payload after successful processing',
    required: false,
  })
  validatedPayload?: any;

  @ApiProperty({
    description: 'Correlation ID for tracking the request',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  correlationId?: string;

  @ApiProperty({
    description: 'Detailed rule request information',
    required: false,
  })
  ruleRequest?: RuleRequest;
}

export class TransactionalMessageDto {
  @ApiProperty({
    description: 'Transaction type identifier',
    example: 'CstmrCdtTrfInitn',
  })
  TxTp: string;

  @ApiProperty({
    description: 'Tenant identifier',
    example: 'tenant_123',
    required: false,
  })
  TenantId?: string;

  [key: string]: any; // Allow for CstmrCdtTrfInitn, FIToFIPmtStsRpt, FIToFICstmrCdtTrf, etc.
}
