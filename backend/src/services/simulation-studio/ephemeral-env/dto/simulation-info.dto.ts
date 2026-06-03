// SPDX-License-Identifier: Apache-2.0
import { ApiProperty } from '@nestjs/swagger';

class SimulationPortsDto {
  @ApiProperty({ example: 54321 })
  pg: number;

  @ApiProperty({ example: 54322 })
  nats: number;

  @ApiProperty({ example: 54323 })
  natsMonitor: number;

  @ApiProperty({ example: 54324 })
  valkey: number;

  @ApiProperty({ example: 54325 })
  natsUtils: number;
}

export class SimulationInfoDto {
  @ApiProperty({ example: 'sim-001' })
  name: string;

  @ApiProperty({ example: '901' })
  ruleNum: string;

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

  @ApiProperty({
    description: 'Convenience URL for the REST-to-NATS bridge',
    example: 'http://localhost:54325',
  })
  natsUtilsUrl: string;
}
