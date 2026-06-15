export enum SimulationStatus {
  UP = 'UP',
  DOWN = 'DOWN',
}

export interface SpawnOptions {
  ruleName?: string;
  version?: string;
}

export interface SimulationPorts {
  pg: number;
  nats: number;
  natsMonitor: number;
  valkey: number;
  natsUtils: number;
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
