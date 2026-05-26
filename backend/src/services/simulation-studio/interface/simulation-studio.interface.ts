import type { PatchSimulationSuitesDto, RequestSimulationSuitesDto, SimulationSuitesQueryDto, SimulationSuitesDto } from '../dto';

export interface ISimulationSuitesListResponse {
  suites: SimulationSuitesDto[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface ISimulationSuiteCreatePayload extends RequestSimulationSuitesDto {}

export type ISimulationSuitePatchPayload = PatchSimulationSuitesDto;

export type ISimulationSuitesQuery = SimulationSuitesQueryDto;
