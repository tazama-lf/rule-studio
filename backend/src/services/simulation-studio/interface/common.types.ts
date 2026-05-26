export type SuiteStatus = 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ARCHIVED';
export type RunStatus = 'ENV_PROVISIONING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMED_OUT' | 'CANCELLED';
export type RunPhase =
  | 'ENV_PROVISIONING'
  | 'NETWORK_CREATE'
  | 'BASE_CONTAINERS_START'
  | 'ODS_INIT'
  | 'APP_CONTAINERS_START'
  | 'TRANSACTION_LOOP'
  | 'CLEANUP'
  | 'COMPLETED'
  | 'FAILED';
export type ResultBand = 'good' | 'neutral' | 'bad' | 'error';
export type ContextFieldStrategy = 'keep_sample' | 'static' | 'range' | 'generated' | 'null' | 'skip';
export type TriggerFieldOverride = 'static' | 'range' | 'generated' | 'remove' | 'null';
export type EnrichmentFieldStrategy = 'static' | 'range' | 'generated' | 'null' | 'copy';
