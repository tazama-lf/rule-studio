/** Response from POST /v2/users/login */
export interface DhLoginResponse {
  token: string;
}

/** A single Docker Hub repository entry */
export interface DhRepository {
  name: string;
  namespace: string;
  repository_type: string;
  pull_count: number;
  last_updated: string;
}

/** Paginated list-repositories response from Docker Hub v2 API */
export interface DhRepositoriesPage {
  count: number;
  next: string | null;
  results: DhRepository[];
}

/** A single Docker Hub tag entry */
export interface DhTagResult {
  name: string;
  last_updated: string;
  digest: string;
}

/** Paginated list-tags response from Docker Hub v2 API */
export interface DhTagsPage {
  count: number;
  next: string | null;
  results: DhTagResult[];
}
