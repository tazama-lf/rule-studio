import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RequireAnyClaims, TazamaClaims } from 'src/decorators/auth.decorator';
import { ApiSwagger, mergeResponses, CommonResponses } from 'src/decorators/swagger.decorator';
import { TazamaAuthGuard } from 'src/guards/tazama-auth.guard';
import { User } from 'src/decorators/user.decorator';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { GenerationsService } from './generations.service';
import {
  SuiteGenerationsListDto,
  SuiteGenerationResponseDto,
  ContextConfigsListDto,
  GenerationSummaryResponseDto,
} from './dto/generations.dto';

@ApiTags('simulation-studio')
@ApiBearerAuth('JWT-auth')
@Controller('simulation-studio')
@UseGuards(TazamaAuthGuard)
export class GenerationsController {
  constructor(private readonly generationsService: GenerationsService) {}

  @Get('suites/:id/generations')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'id', description: 'Simulation suite id', example: 1 })
  @ApiSwagger({
    summary: 'Get all generations for a suite',
    description: 'Returns all generation records for the given simulation suite',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(Object, 'Generations retrieved successfully'),
      CommonResponses.NOT_FOUND_404('Suite not found'),
    ),
  })
  async getGenerationsForSuite(@Param('id', ParseIntPipe) id: number, @User() user: AuthenticatedUser): Promise<SuiteGenerationsListDto> {
    return await this.generationsService.getGenerationsForSuite(user.token.tokenString, id);
  }

  @Get('suites/:id/generations/latest')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'id', description: 'Simulation suite id', example: 1 })
  @ApiSwagger({
    summary: 'Get latest generation for a suite',
    description: 'Returns the most recent generation record for the given simulation suite',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(Object, 'Latest generation retrieved successfully'),
      CommonResponses.NOT_FOUND_404('Suite or generation not found'),
    ),
  })
  async getLatestGenerationForSuite(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUser,
  ): Promise<SuiteGenerationResponseDto> {
    return await this.generationsService.getLatestGenerationForSuite(user.token.tokenString, id);
  }

  @Get('generations/:generationId/context-configs')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'generationId', description: 'Generation id', example: 1 })
  @ApiSwagger({
    summary: 'Get context txtp configs for a generation',
    description: 'Returns all context TXTP config rows seeded for the given generation',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(Object, 'Context configs retrieved successfully'),
      CommonResponses.NOT_FOUND_404('Generation not found'),
    ),
  })
  async getContextConfigsForGeneration(
    @Param('generationId', ParseIntPipe) generationId: number,
    @User() user: AuthenticatedUser,
  ): Promise<ContextConfigsListDto> {
    return await this.generationsService.getContextConfigsForGeneration(user.token.tokenString, generationId);
  }

  @Get('generations/:generationId/summary')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'generationId', description: 'Generation id', example: 1 })
  @ApiSwagger({
    summary: 'Get generation summary (Step 5 - Preview & Save)',
    description:
      'Returns suite name, associated rule, primary TXTP, context TXTP configs, enrichment table names, and record counts for the generation.',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(GenerationSummaryResponseDto, 'Generation summary retrieved successfully'),
      CommonResponses.NOT_FOUND_404('Generation not found'),
    ),
  })
  async getGenerationSummary(
    @Param('generationId', ParseIntPipe) generationId: number,
    @User() user: AuthenticatedUser,
  ): Promise<GenerationSummaryResponseDto> {
    return await this.generationsService.getGenerationSummary(user.token.tokenString, generationId);
  }
}
