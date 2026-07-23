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
    summary: 'Spawn a full simulation environment in one call',
    description:
      'Starts an isolated set of containers (PostgreSQL, NATS, Valkey, rule-processor, nats-utilities) ' +
      'for a single rule. Thin wrapper over POST /postgres + POST /:name/runtime — use this when you do not ' +
      'need a seeding gap between Postgres and the runtime stack. SQL migrations are fetched from GitHub; ' +
      'all wiring is done via the testcontainers API — no docker-compose or env files are used. Returns ' +
      'immediately with port info once all containers are healthy.',
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

  @Post('postgres')
  @HttpCode(HttpStatus.CREATED)
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiSwagger({
    summary: 'Phase 1 — create the network and bring Postgres up alone',
    description:
      'Creates the per-simulation Docker network and starts the PostgreSQL container with all migrations applied. ' +
      'Returns once Postgres is healthy, leaving room for callers to seed config artifacts and reference data ' +
      'before the runtime stack joins. Follow up with POST /:name/runtime. The simulation is registered with ' +
      'status POSTGRES_UP and only ports.pg is populated.',
    responses: mergeResponses(
      CommonResponses.CREATED_201(SimulationInfoDto, 'Postgres up; simulation in POSTGRES_UP state'),
      CommonResponses.BAD_REQUEST_400('Name already in use or invalid options'),
    ),
  })
  async spawnPostgres(@Body() body: SpawnSimulationDto): Promise<SimulationInfoDto> {
    const info = await this.ephemeralEnvService.spawnPostgres(body.name, {
      ruleName: body.ruleName,
      version: body.version,
    });
    return this.toDto(info);
  }

  @Post(':name/runtime')
  @HttpCode(HttpStatus.CREATED)
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'name', description: 'Simulation name (must already exist in POSTGRES_UP state)', example: 'sim-001' })
  @ApiSwagger({
    summary: 'Phase 2 — spawn the runtime stack into an existing simulation',
    description:
      'Brings NATS, Valkey, the rule processor and nats-utilities up into the network created by POST /postgres. ' +
      'Promotes the simulation from POSTGRES_UP to UP and fills in the remaining ports. Returns 400 if the ' +
      'simulation is not in POSTGRES_UP, 404 if it does not exist.',
    responses: mergeResponses(
      CommonResponses.CREATED_201(SimulationInfoDto, 'Runtime up; simulation fully ready'),
      CommonResponses.BAD_REQUEST_400('Simulation not in POSTGRES_UP state'),
      CommonResponses.NOT_FOUND_404('Simulation not found'),
    ),
  })
  async spawnRuntime(@Param('name') name: string): Promise<SimulationInfoDto> {
    const info = await this.ephemeralEnvService.spawnRuntime(name);
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
    // Enumerate fields explicitly — no spread — so we don't leak any internal-only
    // properties through the API as SimulationInfo gains them over time.
    const dto: SimulationInfoDto = {
      name: info.name,
      ruleName: info.ruleName,
      version: info.version,
      functionName: info.functionName,
      natsSubject: info.natsSubject,
      natsConsumer: info.natsConsumer,
      ports: info.ports,
      startedAt: info.startedAt,
      status: info.status,
    };
    // natsUtilsUrl is only meaningful once the nats-utilities container is up.
    // Partial-state (POSTGRES_UP) entries omit it rather than emitting
    // "http://localhost:undefined".
    if (info.ports.natsUtils !== undefined) {
      dto.natsUtilsUrl = `http://localhost:${info.ports.natsUtils}`;
    }
    return dto;
  }
}
