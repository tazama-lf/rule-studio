import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RequireAnyClaims, TazamaClaims } from 'src/decorators/auth.decorator';
import { ApiSwagger, mergeResponses, CommonResponses } from 'src/decorators/swagger.decorator';
import { TazamaAuthGuard } from 'src/guards/tazama-auth.guard';
import { SimulationStudioService } from './simulation-studio.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { User } from 'src/decorators/user.decorator';
import { Audit } from 'src/decorators/audit.decorator';
import {
  GenerateContextQueryDto,
  GenerateContextResponseDto,
  PatchSimulationSuitesDto,
  RegistryReposResponseDto,
  RegistryTagsResponseDto,
  RequestSimulationSuitesDto,
  RunSuiteResponseDto,
  RunSuiteStatusResponseDto,
  SimulationSuiteResponseDto,
  SimulationSuitesDto,
  SimulationSuitesListDto,
  SimulationSuitesQueryDto,
  TxtpSampleResponseDto,
  TxtpSchemaResponseDto,
  TxtpTypeDto,
  UpdateDraftSuiteDto,
} from './dto';

@ApiTags('simulation-studio')
@ApiBearerAuth('JWT-auth')
@Controller(['simulation-studio', 'api/v1/simulation-studio'])
@UseGuards(TazamaAuthGuard)
export class SimulationStudioController {
  constructor(private readonly simulationStudioService: SimulationStudioService) {}

  @Get('suites')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by suite name (contains, case-insensitive)' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by suite status' })
  @ApiQuery({ name: 'rule_name', required: false, type: String, description: 'Filter by associated rule name' })
  @ApiQuery({ name: 'rule', required: false, type: String, description: 'Alias for rule_name' })
  @ApiQuery({ name: 'txtp', required: false, type: String, description: 'Filter by transaction type (TXTP)' })
  @ApiQuery({ name: 'updated_from', required: false, type: String, description: 'Filter by updated date from (inclusive)' })
  @ApiQuery({ name: 'updated_to', required: false, type: String, description: 'Filter by updated date to (inclusive)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Page offset (0-based)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-based). Used when offset is omitted.' })
  @ApiSwagger({
    summary: 'Get simulation suites',
    description: 'Retrieves simulation suites with optional filters for suite name, status, and rule',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(SimulationSuitesListDto, 'Simulation suites retrieved successfully'),
      CommonResponses.NOT_FOUND_404('Simulation suites not found'),
    ),
  })
  async getSimulationSuites(@User() user: AuthenticatedUser, @Query() query: SimulationSuitesQueryDto): Promise<SimulationSuitesListDto> {
    return await this.simulationStudioService.getSimulationSuites(user.token.tokenString, query);
  }

  @Get('suites/:id')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'id', description: 'Simulation suite id', example: 1 })
  @ApiSwagger({
    summary: 'Get simulation suite by id',
    description: 'Retrieves a simulation suite by its numeric identifier',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(SimulationSuiteResponseDto, 'Simulation suite retrieved successfully'),
      CommonResponses.NOT_FOUND_404('Simulation suite not found'),
    ),
  })
  async getSimulationSuiteById(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUser,
  ): Promise<SimulationSuiteResponseDto> {
    return await this.simulationStudioService.getSimulationSuiteById(user.token.tokenString, id);
  }

  @Post('suites')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @Audit()
  @ApiBody({
    type: RequestSimulationSuitesDto,
    description: 'Simulation suite payload to create',
  })
  @ApiSwagger({
    summary: 'Create simulation suite',
    description: 'Creates a new simulation suite',
    responses: mergeResponses(CommonResponses.CREATED_201(SimulationSuitesDto, 'Simulation suite created successfully')),
  })
  async createSimulationSuites(@Body() suites: RequestSimulationSuitesDto, @User() user: AuthenticatedUser): Promise<SimulationSuitesDto> {
    return await this.simulationStudioService.createSimulationSuites(user.token.tokenString, suites);
  }

  @Patch('suites/:id')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @Audit()
  @ApiParam({ name: 'id', description: 'Simulation suite id', example: 1 })
  @ApiBody({
    type: PatchSimulationSuitesDto,
    description: 'Partial simulation suite payload to update',
  })
  @ApiSwagger({
    summary: 'Patch simulation suite',
    description: 'Updates selected fields of an existing simulation suite',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(SimulationSuiteResponseDto, 'Simulation suite updated successfully'),
      CommonResponses.NOT_FOUND_404('Simulation suite not found'),
    ),
  })
  async patchSimulationSuite(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: PatchSimulationSuitesDto,
    @User() user: AuthenticatedUser,
  ): Promise<SimulationSuiteResponseDto> {
    return await this.simulationStudioService.patchSimulationSuite(user.token.tokenString, id, payload);
  }

  @Put('suites/:id/draft')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @Audit()
  @ApiParam({ name: 'id', description: 'Simulation suite id', example: 1 })
  @ApiBody({
    type: UpdateDraftSuiteDto,
    description: 'Wizard draft payload containing the current screen and data snapshot',
  })
  @ApiSwagger({
    summary: 'Save draft screen data',
    description: 'Compatibility endpoint for draft persistence. Internally maps to existing PATCH suite persistence flow.',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(SimulationSuiteResponseDto, 'Simulation suite draft saved successfully'),
      CommonResponses.NOT_FOUND_404('Simulation suite not found'),
    ),
  })
  async putSimulationSuiteDraft(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateDraftSuiteDto,
    @User() user: AuthenticatedUser,
  ): Promise<SimulationSuiteResponseDto> {
    return await this.simulationStudioService.putSimulationSuiteDraft(user.token.tokenString, id, payload);
  }

  @Get('registry/repos')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiSwagger({
    summary: 'Get registry repositories',
    description: 'Lists published rule repositories from Docker Hub for the current tenant',
    responses: mergeResponses(CommonResponses.SUCCESS_200(RegistryReposResponseDto, 'Registry repositories retrieved successfully')),
  })
  async getRegistryRepos(@User() user: AuthenticatedUser): Promise<RegistryReposResponseDto> {
    return await this.simulationStudioService.getRegistryRepos(user.tenantId);
  }

  @Get('registry/repos/:repo/tags')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'repo', description: 'Repository name', example: 'rule-high-value' })
  @ApiSwagger({
    summary: 'Get repository tags',
    description: 'Lists available tags for a tenant repository from Docker Hub',
    responses: mergeResponses(CommonResponses.SUCCESS_200(RegistryTagsResponseDto, 'Registry tags retrieved successfully')),
  })
  async getRegistryRepoTags(@Param('repo') repo: string, @User() user: AuthenticatedUser): Promise<RegistryTagsResponseDto> {
    return await this.simulationStudioService.getRegistryRepoTags(user.tenantId, repo);
  }

  @Get('txtp-types')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiSwagger({
    summary: 'Get transaction types',
    description: 'Returns transaction types and versions for simulation studio wizard pickers',
    responses: mergeResponses(CommonResponses.SUCCESS_200(TxtpTypeDto, 'Transaction types retrieved successfully')),
  })
  async getTxtpTypes(@User() user: AuthenticatedUser): Promise<TxtpTypeDto[]> {
    return await this.simulationStudioService.getTxtpTypes(user.token.tokenString);
  }

  @Get('txtp-types/:txtp/:version/schema')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'txtp', description: 'Transaction type', example: 'pacs.008' })
  @ApiParam({ name: 'version', description: 'Transaction type version', example: '001.08' })
  @ApiSwagger({
    summary: 'Get transaction type schema',
    description: 'Returns schema for a transaction type/version pair',
    responses: mergeResponses(CommonResponses.SUCCESS_200(TxtpSchemaResponseDto, 'Transaction schema retrieved successfully')),
  })
  async getTxtpSchema(
    @Param('txtp') txtp: string,
    @Param('version') version: string,
    @User() user: AuthenticatedUser,
  ): Promise<TxtpSchemaResponseDto> {
    return await this.simulationStudioService.getTxtpSchema(user.token.tokenString, txtp, version);
  }

  @Get('txtp-types/:txtp/:version/sample')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'txtp', description: 'Transaction type', example: 'pacs.008' })
  @ApiParam({ name: 'version', description: 'Transaction type version', example: '001.08' })
  @ApiSwagger({
    summary: 'Get transaction type sample payload',
    description: 'Returns sample payload for a transaction type/version pair',
    responses: mergeResponses(CommonResponses.SUCCESS_200(TxtpSampleResponseDto, 'Transaction sample payload retrieved successfully')),
  })
  async getTxtpSample(
    @Param('txtp') txtp: string,
    @Param('version') version: string,
    @User() user: AuthenticatedUser,
  ): Promise<TxtpSampleResponseDto> {
    return await this.simulationStudioService.getTxtpSample(user.token.tokenString, txtp, version);
  }

  @Post('suites/:id/generate/context')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'id', description: 'Simulation suite id', example: 1 })
  @ApiQuery({ name: 'count', required: false, type: Number, description: 'Number of context rows to generate' })
  @ApiSwagger({
    summary: 'Generate simulation context',
    description: 'Generates context payload rows for the given suite',
    responses: mergeResponses(CommonResponses.SUCCESS_200(GenerateContextResponseDto, 'Simulation context generated successfully')),
  })
  async generateSimulationContext(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: GenerateContextQueryDto,
    @User() user: AuthenticatedUser,
  ): Promise<GenerateContextResponseDto> {
    return await this.simulationStudioService.generateSimulationContext(user.token.tokenString, id, query);
  }

  @Post('suites/:id/run')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'id', description: 'Simulation suite id', example: 1 })
  @ApiSwagger({
    summary: 'Start simulation run',
    description: 'Starts a simulation run for the suite and returns run bootstrap state',
    responses: mergeResponses(CommonResponses.SUCCESS_200(RunSuiteResponseDto, 'Simulation run started successfully')),
  })
  async runSimulationSuite(@Param('id', ParseIntPipe) id: number, @User() user: AuthenticatedUser): Promise<RunSuiteResponseDto> {
    return await this.simulationStudioService.runSimulationSuite(user.token.tokenString, id);
  }

  @Get('suites/:id/runs/:runId/status')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'id', description: 'Simulation suite id', example: 1 })
  @ApiParam({ name: 'runId', description: 'Simulation run id', example: 'run-1-1717198021000' })
  @ApiSwagger({
    summary: 'Get simulation run status',
    description: 'Returns run status/phase and optional partial results payload',
    responses: mergeResponses(CommonResponses.SUCCESS_200(RunSuiteStatusResponseDto, 'Simulation run status retrieved successfully')),
  })
  async getSimulationRunStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('runId') runId: string,
    @User() user: AuthenticatedUser,
  ): Promise<RunSuiteStatusResponseDto> {
    return await this.simulationStudioService.getSimulationRunStatus(user.token.tokenString, id, runId);
  }
}
