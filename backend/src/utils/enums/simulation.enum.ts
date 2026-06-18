export enum SimulationLogCategory {
  READ_ONLY = 'read_only',
  END_TO_END = 'end_to_end',
}

export enum SimulationSuiteType {
  SINGLE_RULE = 'SINGLE_RULE',
  INTEGRATION_TESTING = 'INTEGRATION_TESTING',
}

export enum SimulationSuiteStatus {
  DRAFT = 'DRAFT',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
