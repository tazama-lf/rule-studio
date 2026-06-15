import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { RequireAnyClaims, TazamaClaims } from 'src/decorators/auth.decorator';
import { ApiSwagger, mergeResponses, CommonResponses } from 'src/decorators/swagger.decorator';
import { TazamaAuthGuard } from 'src/guards/tazama-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { Audit } from 'src/decorators/audit.decorator';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { GenerationsService } from './generations.service';
import {
  SuiteGenerationsListDto,
  SuiteGenerationResponseDto,
  GenerationSummaryResponseDto,
  SuiteGenerationDto,
} from './dto/generations.dto';
import { ContextConfigsListDto } from '../context-txtp-config/dto/context-txtp-config.dto';

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
    description: 'Returns suite name, associated rule, primary TXTP, context TXTP configs, enrichment table names, and record counts.',
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

  @Patch('generations/:generationId/wizard-progress')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @Audit()
  @ApiParam({ name: 'generationId', description: 'Generation id', example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        current_step_num: { type: 'number', example: 2, description: 'Active wizard step number' },
        completed_step_num: { type: 'number', example: 2, description: 'Highest completed step (steps 1..N marked complete)' },
      },
      required: ['current_step_num', 'completed_step_num'],
    },
  })
  @ApiSwagger({
    summary: 'Update wizard progress',
    description: 'Saves current_step_num + completedSteps=[1..completed_step_num] into generation wizard_snapshot.',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(Object, 'Wizard progress updated'),
      CommonResponses.NOT_FOUND_404('Generation not found'),
    ),
  })
  async updateWizardProgress(
    @Param('generationId', ParseIntPipe) generationId: number,
    @Body() body: { current_step_num: number; completed_step_num: number },
    @User() user: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string }> {
    return await this.generationsService.updateWizardProgress(user.token.tokenString, generationId, body);
  }

  @Get('suites/:id/generations/resume')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'id', description: 'Simulation suite id', example: 1 })
  @ApiSwagger({
    summary: 'Resume generation for a suite',
    description:
      'Resumes the most recent generation for the given simulation suite that is DRAFT (wizard not completed). Returns the generation record with the latest wizard snapshot to restore UI state.',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(SuiteGenerationDto, 'Generation retrieved successfully'),
      CommonResponses.NOT_FOUND_404('Suite not found'),
    ),
  })
  async resumeGenerationForSuite(@Param('id', ParseIntPipe) id: number, @User() user: AuthenticatedUser): Promise<SuiteGenerationDto> {
    return await this.generationsService.resumeGeneration(user.token.tokenString, id);
  }

  @Post('generations/:generationId/clone')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @Audit()
  @ApiParam({ name: 'generationId', description: 'Source generation id to clone', example: 1 })
  @ApiSwagger({
    summary: 'Clone generation',
    description:
      'Creates a new generation under the same suite, copying all context configs, field strategies, trigger configs, field overrides, and enrichment tables.',
    responses: mergeResponses(
      CommonResponses.CREATED_201(SuiteGenerationResponseDto, 'Generation cloned successfully'),
      CommonResponses.NOT_FOUND_404('Source generation not found'),
    ),
  })
  async cloneGeneration(
    @Param('generationId', ParseIntPipe) generationId: number,
    @User() user: AuthenticatedUser,
  ): Promise<SuiteGenerationResponseDto> {
    return await this.generationsService.cloneGeneration(user.token.tokenString, generationId);
  }

  @Patch('generations/:generationId/status')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @Audit()
  @ApiParam({ name: 'generationId', description: 'Generation id', example: 1 })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'COMPLETED', description: 'Generation status (DRAFT, READY, RUNNING, COMPLETED, FAILED)' },
      },
      required: ['status'],
    },
  })
  @ApiSwagger({
    summary: 'Update generation status',
    description: 'Updates the status of a generation',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(Object, 'Generation status updated'),
      CommonResponses.NOT_FOUND_404('Generation not found'),
    ),
  })
  async updateGenerationStatus(
    @Param('generationId', ParseIntPipe) generationId: number,
    @Body() body: { status: string },
    @User() user: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string }> {
    return await this.generationsService.updateGenerationStatus(user.token.tokenString, generationId, body.status);
  }
}
