// SPDX-License-Identifier: Apache-2.0
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class SpawnSimulationDto {
  @ApiProperty({
    description: 'Unique name for this simulation instance',
    example: 'sim-001',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'name must be lowercase alphanumeric and hyphens only' })
  name: string;
  @ApiPropertyOptional({
    description: 'Full rule image name on Docker Hub (e.g. "rule-901", "cbe-case107")',
    example: 'rule-901',
    default: 'rule-901',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'ruleName must be lowercase alphanumeric and hyphens only' })
  ruleName?: string;

  @ApiPropertyOptional({
    description: 'Tazama image version tag',
    example: 'rc',
    default: 'rc',
  })
  @IsOptional()
  @IsString()
  version?: string;
}
