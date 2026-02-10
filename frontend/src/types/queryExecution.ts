export interface QueryExecutionRequest {
  query: string;
  dbName?: string;
}

export interface QueryExecutionResponse {
  success: boolean;
  message: string;
  result: Record<string, unknown>[];
  executionTime?: number;
}

export interface QueryExecutionError {
  message: string;
  code?: string;
  details?: string;
}

export const isQueryExecutionError = (error: unknown): error is { data: QueryExecutionError } => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof (error as { data: unknown }).data === 'object' &&
    (error as { data: unknown }).data !== null &&
    'message' in (error as { data: Record<string, unknown> }).data
  );
};

export const extractErrorMessage = (error: unknown, fallback = 'An unexpected error occurred'): string => {
  if (isQueryExecutionError(error)) {
    return error.data.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return fallback;
};
