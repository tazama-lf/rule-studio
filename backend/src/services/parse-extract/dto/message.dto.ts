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

export interface NetworkMap {
  // Empty for now, will be populated later
  [key: string]: any;
}

export interface DataCache {
  // Empty for now, will be populated later
  [key: string]: any;
}

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