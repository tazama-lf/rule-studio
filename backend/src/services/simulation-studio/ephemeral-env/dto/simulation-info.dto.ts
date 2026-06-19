// SPDX-License-Identifier: Apache-2.0
import { ApiProperty } from '@nestjs/swagger';
import { SimulationStatus } from '../interfaces/ephemeral-env.interfaces';

class SimulationPortsDto {
  // `pg` is populated as soon as POST /postgres returns. The other ports
  // only become available after POST /:name/runtime completes — they are
  // absent while the simulation is in the POSTGRES_UP intermediate state.
  @ApiProperty({ example: 54321 })
  pg: number;

  @ApiProperty({ example: 54322, required: false })
  nats?: number;

  @ApiProperty({ example: 54323, required: false })
  natsMonitor?: number;

  @ApiProperty({ example: 54324, required: false })
  valkey?: number;

  @ApiProperty({ example: 54325, required: false })
  natsUtils?: number;
}

export class SimulationInfoDto {
  @ApiProperty({ example: 'sim-001' })
  name: string;

  @ApiProperty({ example: 'rule-901', description: 'Full rule image name on Docker Hub' })
  ruleName: string;

  @ApiProperty({ example: 'rc' })
  version: string;

  @ApiProperty({ example: 'rule-901-rel-rc' })
  functionName: string;

  @ApiProperty({ example: 'sub-rule-901@rc' })
  natsSubject: string;

  @ApiProperty({ example: 'pub-rule-901@rc' })
  natsConsumer: string;

  @ApiProperty({ type: SimulationPortsDto })
  ports: SimulationPortsDto;

  @ApiProperty({ example: '2026-06-03T12:00:00.000Z' })
  startedAt: Date;

  @ApiProperty({ enum: SimulationStatus, example: SimulationStatus.UP, description: 'Whether all containers are running' })
  status: SimulationStatus;

  @ApiProperty({
    description:
      'Convenience URL for the REST-to-NATS bridge. Absent while the simulation is in POSTGRES_UP — nats-utilities is not running yet.',
    example: 'http://localhost:54325',
    required: false,
  })
  natsUtilsUrl?: string;
}
