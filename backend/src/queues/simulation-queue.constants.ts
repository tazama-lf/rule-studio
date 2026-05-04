export const SIMULATION_QUEUE = 'simulation';
export const SIMULATION_JOB = 'run-simulation';

export interface DirectSimulationMessage {
  messageId: string;
  timestamp: string;
  endpoint: string;
  data: Record<string, unknown>;
}

export interface SimulationJobPayload {
  jobId: string;
  token: string;
  /** DB-table based simulation (existing flow) */
  tableNames?: string[];
  /** DLH direct-data simulation — messages already mapped and ready to send */
  messages?: DirectSimulationMessage[];
}
