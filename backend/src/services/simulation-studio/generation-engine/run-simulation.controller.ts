import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { RequireAnyClaims, TazamaClaims } from 'src/decorators/auth.decorator';
import { ApiSwagger, mergeResponses, CommonResponses } from 'src/decorators/swagger.decorator';
import { TazamaAuthGuard } from 'src/guards/tazama-auth.guard';
import { User } from 'src/decorators/user.decorator';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { RunSimulationService } from './run-simulation.service';
import { RunSimulationDto, RunSimulationResponseDto } from './dto/run-simulation.dto';
import { GenerationsService } from '../generations/generations.service';

@ApiTags('simulation-studio')
@ApiBearerAuth('JWT-auth')
@Controller('simulation-studio')
@UseGuards(TazamaAuthGuard)
export class RunSimulationController {
  constructor(
    private readonly runSimulationService: RunSimulationService,
    private readonly generationsService: GenerationsService,
  ) {}

  @Post('run-simulation')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiBody({ type: RunSimulationDto })
  @ApiSwagger({
    summary: 'Run rule simulation',
    description:
      'Fetches rule_name, rule_version and rule_config from the suite, fetches trigger messages for the generation, ' +
      'spawns an ephemeral environment, applies the rule config to postgres, ' +
      'sends all trigger payloads through the rule processor, and returns the evaluation results.',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(RunSimulationResponseDto, 'Simulation completed successfully'),
      CommonResponses.NOT_FOUND_404('Suite or generation not found'),
    ),
  })
  async runSimulation(
    @Body() body: RunSimulationDto,
    @User() user: AuthenticatedUser,
  ): Promise<RunSimulationResponseDto> {
    return await this.runSimulationService.runSimulation(user.token.tokenString, body);
  }

  @Post('rerun-simulation')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiBody({ type: RunSimulationDto })
  @ApiSwagger({
    summary: 'Rerun generation with new id',
    description: 'Reruns a generation and replicates suite context, triggers, enrichment tables and field strategies in the admin DB.',
    responses: mergeResponses(CommonResponses.CREATED_201(RunSimulationResponseDto, 'Generation rerun successfully')),
  })
  async rerunGeneration(@Body() body: RunSimulationDto, @User() user: AuthenticatedUser): Promise<RunSimulationResponseDto> {
    const cloned = await this.generationsService.cloneGeneration(user.token.tokenString, body.generationId);
    return await this.runSimulationService.runSimulation(user.token.tokenString, {
      suiteId: body.suiteId,
      generationId: cloned.data.id,
    });
  }
}
