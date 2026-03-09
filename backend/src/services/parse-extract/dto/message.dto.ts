import { ApiProperty } from '@nestjs/swagger';

export interface TransactionalMessage {
  TxTp: string;
  TenantId?: string;
  [key: string]: unknown; // Allow for CstmrCdtTrfInitn, FIToFIPmtStsRpt, FIToFICstmrCdtTrf, etc.
}

export interface ConfigEntity {
  id: number;
  msg_fam: string;
  transaction_type: string;
  endpoint_path: string;
  version: string;
  content_type: string;
  schema: Record<string, unknown>; // JSONB
  mapping?: Record<string, unknown>; // JSONB
  tenant_id: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  status: string;
  functions?: Record<string, unknown>; // JSONB
  publishing_status?: string;
  comments?: string;
  payload?: Record<string, unknown>; // JSONB - This is what we need
}

export type NetworkMap = Record<string, unknown>;

export type DataCache = Record<string, unknown>;

export interface MetaData {
  correlationId?: string;
  timestamp?: string;
  tenantId?: string;
  transactionType?: string;
  [key: string]: unknown;
}

export interface RuleRequest {
  transaction: Record<string, unknown>; // The validated payload (will be strongly typed later)
  networkMap: NetworkMap;
  DataCache: DataCache;
  metaData?: MetaData;
}

export interface ParseExtractResponse {
  success: boolean;
  message: string;
  processedAt: string;
  configPayload?: Record<string, unknown>; // The payload from config table
  transactionType?: string;
  validationErrors?: string[]; // Array of validation error messages
  validatedPayload?: Record<string, unknown>; // The validated payload when successful
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
  configPayload?: Record<string, unknown>;

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
  validatedPayload?: Record<string, unknown>;

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

  [key: string]: unknown; // Allow for CstmrCdtTrfInitn, FIToFIPmtStsRpt, FIToFICstmrCdtTrf, etc.
}
