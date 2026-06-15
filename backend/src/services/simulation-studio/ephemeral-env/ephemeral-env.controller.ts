// SPDX-License-Identifier: Apache-2.0
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { RequireAnyClaims, TazamaClaims } from 'src/decorators/auth.decorator';
import { ApiSwagger, CommonResponses, mergeResponses } from 'src/decorators/swagger.decorator';
import { TazamaAuthGuard } from 'src/guards/tazama-auth.guard';
import { EphemeralEnvService } from './ephemeral-env.service';
import { SpawnSimulationDto } from './dto/spawn-simulation.dto';
import { SimulationInfoDto } from './dto/simulation-info.dto';

@ApiTags('ephemeral-env')
@ApiBearerAuth('JWT-auth')
@Controller('simulation-studio/ephemeral')
@UseGuards(TazamaAuthGuard)
export class EphemeralEnvController {
  constructor(private readonly ephemeralEnvService: EphemeralEnvService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiSwagger({
    summary: 'Spawn a simulation environment',
    description:
      'Starts an isolated set of containers (PostgreSQL, NATS, Valkey, rule-processor, nats-utilities) ' +
      'for a single rule. SQL migrations are fetched from GitHub; all wiring is done via the testcontainers API — ' +
      'no docker-compose or env files are used. Returns immediately with port info once all containers are healthy.',
    responses: mergeResponses(
      CommonResponses.CREATED_201(SimulationInfoDto, 'Simulation spawned and ready'),
      CommonResponses.BAD_REQUEST_400('Name already in use or invalid options'),
    ),
  })
  async spawn(@Body() body: SpawnSimulationDto): Promise<SimulationInfoDto> {
    const info = await this.ephemeralEnvService.spawn(body.name, {
      ruleName: body.ruleName,
      version: body.version,
    });
    return this.toDto(info);
  }

  @Get()
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiSwagger({
    summary: 'List running simulation environments',
    description: 'Returns all simulations currently held in memory with their port mappings.',
    responses: CommonResponses.SUCCESS_200([SimulationInfoDto], 'Active simulations'),
  })
  list(): SimulationInfoDto[] {
    return this.ephemeralEnvService.list().map((i) => this.toDto(i));
  }

  @Get(':name')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'name', description: 'Simulation name', example: 'sim-001' })
  @ApiSwagger({
    summary: 'Get a simulation environment',
    description: 'Returns port mappings and metadata for a named simulation.',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(SimulationInfoDto, 'Simulation found'),
      CommonResponses.NOT_FOUND_404('Simulation not found'),
    ),
  })
  getOne(@Param('name') name: string): SimulationInfoDto {
    const info = this.ephemeralEnvService.get(name);
    if (!info) throw new NotFoundException(`Simulation '${name}' not found`);
    return this.toDto(info);
  }

  @Delete(':name')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'name', description: 'Simulation name', example: 'sim-001' })
  @ApiSwagger({
    summary: 'Destroy a simulation environment',
    description: 'Stops all containers for the named simulation and removes the network.',
    responses: mergeResponses({ 204: { description: 'Simulation destroyed' } }, CommonResponses.NOT_FOUND_404('Simulation not found')),
  })
  async destroy(@Param('name') name: string): Promise<void> {
    if (!this.ephemeralEnvService.get(name)) throw new NotFoundException(`Simulation '${name}' not found`);
    await this.ephemeralEnvService.destroy(name);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiSwagger({
    summary: 'Destroy ALL simulation environments',
    description: 'Stops all containers and networks for every running simulation.',
    responses: { 204: { description: 'All simulations destroyed' } },
  })
  async destroyAll(): Promise<void> {
    await this.ephemeralEnvService.destroyAll();
  }

  private toDto(info: NonNullable<ReturnType<EphemeralEnvService['get']>>): SimulationInfoDto {
    return {
      ...info,
      natsUtilsUrl: `http://localhost:${info.ports.natsUtils}`,
    };
  }
}
