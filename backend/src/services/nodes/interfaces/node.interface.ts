export interface GetNodesQuery {
  tenantId?: string;
  type?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
