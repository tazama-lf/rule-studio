import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RequireAnyClaims, TazamaClaims } from 'src/decorators/auth.decorator';
import { ApiSwagger, mergeResponses, CommonResponses } from 'src/decorators/swagger.decorator';
import { TazamaAuthGuard } from 'src/guards/tazama-auth.guard';
import { SimulationStudioService } from './simulation-studio.service';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { User } from 'src/decorators/user.decorator';
import { Audit } from 'src/decorators/audit.decorator';
import {
  PatchSimulationSuitesDto,
  RequestSimulationSuitesDto,
  SimulationSuiteResponseDto,
  SimulationSuitesDto,
  SimulationSuitesListDto,
  SimulationSuitesQueryDto,
} from './dto';

@ApiTags('simulation-studio')
@ApiBearerAuth('JWT-auth')
@Controller('simulation-studio')
@UseGuards(TazamaAuthGuard)
export class SimulationStudioController {
  constructor(private readonly simulationStudioService: SimulationStudioService) {}

  @Get('suites')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by suite name (contains, case-insensitive)' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by suite status' })
  @ApiQuery({ name: 'rule_name', required: false, type: String, description: 'Filter by associated rule name' })
  @ApiQuery({ name: 'txtp', required: false, type: String, description: 'Filter by transaction type (TXTP)' })
  @ApiQuery({ name: 'updated_from', required: false, type: String, description: 'Filter by updated date from (inclusive)' })
  @ApiQuery({ name: 'updated_to', required: false, type: String, description: 'Filter by updated date to (inclusive)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Page offset (0-based)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size' })
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

  @Post('suites/:id/clone')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @Audit()
  @ApiParam({ name: 'id', description: 'Source suite id to clone', example: 1 })
  @ApiSwagger({
    summary: 'Clone simulation suite',
    description:
      'Creates a new suite (Copy) and clones the latest generation with all its context configs, field strategies, trigger configs, field overrides, and enrichment tables.',
    responses: mergeResponses(
      CommonResponses.CREATED_201(SimulationSuitesDto, 'Suite cloned successfully'),
      CommonResponses.NOT_FOUND_404('Source suite not found'),
    ),
  })
  async cloneSuite(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUser,
  ): Promise<{ success: boolean; data: SimulationSuitesDto & { generation_id: number | null } }> {
    return await this.simulationStudioService.cloneSuite(user.token.tokenString, id);
  }
}
