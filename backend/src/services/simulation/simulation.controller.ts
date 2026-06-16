import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
import { RequireAnyClaims, TazamaClaims } from '../../decorators/auth.decorator';
import { User } from '../../decorators/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { SimulationService } from './simulation.service';
import {
  type SimulationListResponseDto,
  type CreateSimulationResponseDto,
  ExcludedTypeProps,
  type SimulationStatsDto,
  type SimulationResultsResponseDto,
} from './dto/simulation.dto';
import { CreateSimulationDto } from './dto/simulation.dto';
import { ApiSwagger, CommonResponses } from 'src/decorators/swagger.decorator';

@ApiTags('Simulation')
@ApiBearerAuth('JWT-auth')
@Controller('simulation')
@UseGuards(TazamaAuthGuard)
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Get('/api/all')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Page offset (0-based)', example: 0 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Records per page', example: 10 })
  async getAllSimulations(
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @User() user: AuthenticatedUser,
  ): Promise<SimulationListResponseDto> {
    return await this.simulationService.getAllSimulations(offset, limit, user);
  }

  @Post('/api/create')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateSimulationDto, description: 'Simulation data to create' })
  async createSimulation(@Body() body: CreateSimulationDto, @User() user: AuthenticatedUser): Promise<CreateSimulationResponseDto> {
    return await this.simulationService.createSimulation(body, user);
  }

  @Get('/api/excluded/types')
  @RequireAnyClaims(TazamaClaims.EDITOR)
  @ApiSwagger({
    summary: 'Get all types',
    description: 'Retreives active and inactive types with existence status',
    responses: CommonResponses.SUCCESS_200([ExcludedTypeProps], 'Excluded Types retrieved successfully'),
  })
  async getExcludedTypes(@User() user: AuthenticatedUser): Promise<ExcludedTypeProps> {
    return await this.simulationService.excludedTypes(user.token.tokenString);
  }

  @Get('/api/get_simulation_stats')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiQuery({ name: 'sim', required: true, type: String, description: 'Simulation table name, e.g. sim015' })
  @ApiQuery({ name: 'iteration_no', required: true, type: String, description: 'Numeric iteration number' })
  async getSimulationStats(
    @Query('sim') sim: string,
    @Query('iteration_no') iterationNo: string,
    @User() user: AuthenticatedUser,
  ): Promise<SimulationStatsDto> {
    if (!sim.trim()) throw new BadRequestException('`sim` query parameter is required.');
    if (!iterationNo.trim()) throw new BadRequestException('`iteration_no` query parameter is required.');
    if (!/^\d+$/.test(iterationNo)) throw new BadRequestException('`iteration_no` must be a numeric string.');
    return await this.simulationService.getSimulationStats(sim.trim().toLowerCase(), iterationNo.trim(), user);
  }

  @Get('/api/get_simulation_results')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiQuery({ name: 'sim', required: true, type: String, description: 'Simulation table name, e.g. sim015' })
  @ApiQuery({ name: 'iteration_no', required: true, type: String, description: 'Numeric iteration number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Records per page', example: 10 })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Page offset (0-based)', example: 0 })
  @ApiQuery({ name: 'msg_id', required: false, type: String, description: 'Filter by message ID (partial match)' })
  @ApiQuery({ name: 'msg_type', required: false, type: String, description: 'Filter by message type (partial match)' })
  @ApiQuery({ name: 'outcome', required: false, enum: ['Hit', 'No-Hit'], description: 'Filter by outcome' })
  async getSimulationResults(
    @Query('sim') sim: string,
    @Query('iteration_no') iterationNo: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('msg_id') msgId: string | undefined,
    @Query('msg_type') msgType: string | undefined,
    @Query('outcome') outcome: string | undefined,
    @User() user: AuthenticatedUser,
  ): Promise<SimulationResultsResponseDto> {
    if (!sim.trim()) throw new BadRequestException('`sim` query parameter is required.');
    if (!iterationNo.trim()) throw new BadRequestException('`iteration_no` query parameter is required.');
    if (!/^\d+$/.test(iterationNo)) throw new BadRequestException('`iteration_no` must be a numeric string.');
    if (outcome && outcome !== 'Hit' && outcome !== 'No-Hit') throw new BadRequestException('`outcome` must be "Hit" or "No-Hit".');
    return await this.simulationService.getSimulationResults(
      sim.trim().toLowerCase(),
      iterationNo.trim(),
      limit,
      offset,
      { msg_id: msgId?.trim(), msg_type: msgType?.trim(), outcome: outcome?.trim() },
      user,
    );
  }
}
