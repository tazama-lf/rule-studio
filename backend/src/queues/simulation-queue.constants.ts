export const SIMULATION_QUEUE = 'simulation';
export const SIMULATION_JOB = 'run-simulation';

export interface SimulationJobPayload {
  jobId: string;
  token: string;
  tableNames: string[];
}
