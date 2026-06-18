export enum SimulationStatus {
  POSTGRES_UP = 'POSTGRES_UP',
  UP = 'UP',
  DOWN = 'DOWN',
}

export interface SpawnOptions {
  ruleName?: string;
  version?: string;
}

// `pg`/`pgHost` are populated as soon as spawnPostgres returns. The other
// ports/hosts only become available after spawnRuntime completes — they are
// undefined while the simulation is in the POSTGRES_UP intermediate state.
export interface SimulationPorts {
  pg: number;
  pgHost: string;
  nats?: number;
  natsHost?: string;
  natsMonitor?: number;
  valkey?: number;
  natsUtils?: number;
  natsUtilsHost?: string;
}

export interface SimulationInfo {
  name: string;
  ruleName: string;
  version: string;
  functionName: string;
  natsSubject: string;
  natsConsumer: string;
  ports: SimulationPorts;
  startedAt: Date;
  status: SimulationStatus;
}
