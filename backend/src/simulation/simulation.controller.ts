import { Controller, Get, Post, Body, Query, ParseIntPipe, UseGuards, DefaultValuePipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { TazamaAuthGuard } from '../guards/tazama-auth.guard';
import { RequireAnyClaims, TazamaClaims } from '../decorators/auth.decorator';
import { User } from '../decorators/user.decorator';
import type { AuthenticatedUser } from '../services/auth/auth.types';
import { SimulationService } from './simulation.service';
import type { SimulationListResponseDto, CreateSimulationResponseDto } from './dto/simulation.dto';
import { CreateSimulationDto } from './dto/simulation.dto';

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
  async createSimulation(
    @Body() body: CreateSimulationDto,
    @User() user: AuthenticatedUser,
  ): Promise<CreateSimulationResponseDto> {
    return await this.simulationService.createSimulation(body, user);
  }
}
