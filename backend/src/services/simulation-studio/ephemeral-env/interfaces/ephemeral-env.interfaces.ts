export interface SpawnOptions {
  ruleNum?: string;
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
  ruleNum: string;
  version: string;
  functionName: string;
  natsSubject: string;
  natsConsumer: string;
  ports: SimulationPorts;
  startedAt: Date;
}
