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
    description: 'Rule number to deploy (e.g. "901", "902")',
    example: '901',
    default: '901',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: 'ruleNum must be a numeric string' })
  ruleNum?: string;

  @ApiPropertyOptional({
    description: 'Tazama image version tag',
    example: 'rc',
    default: 'rc',
  })
  @IsOptional()
  @IsString()
  version?: string;
}
