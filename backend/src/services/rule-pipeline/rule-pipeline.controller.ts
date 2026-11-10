import { Controller, Get, Header, HttpCode, Param, ParseIntPipe, Post, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Audit } from '../../decorators/audit.decorator';
import { RequireAnyClaims, TazamaClaims } from '../../decorators/auth.decorator';
import { User } from '../../decorators/user.decorator';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { RulePipelineBuildsService } from './rule-pipeline-builds.service';
import type { RuleBuildView, RuleDeploymentStatus, RuleDeployResult, RulePipelineConfigView, RuleRunResult } from './rule-pipeline.types';

@ApiTags('Rule Pipeline')
@ApiBearerAuth('JWT-auth')
@Controller('rule-pipeline')
@UseGuards(TazamaAuthGuard)
export class RulePipelineController {
  constructor(private readonly builds: RulePipelineBuildsService) {}

  @Get('/config')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @ApiOperation({
    summary: 'Pipeline configuration',
    description: 'Which npm source, image registry and git server builds use (no credentials).',
  })
  config(): RulePipelineConfigView {
    return this.builds.config();
  }

  @Post('/rules/:id/builds')
  @HttpCode(202)
  @Audit()
  @RequireAnyClaims(TazamaClaims.EDITOR)
  @ApiParam({ name: 'id', description: 'Numeric rule ID', example: 50, type: 'number' })
  @ApiOperation({
    summary: 'Build and test a rule',
    description:
      'Queues a build of the current code and tests of the rule: unit tests, npm package and, as configured, an image, a registry push ' +
      'and a copy of the source in git. Poll the returned build for progress.',
  })
  @ApiResponse({ status: 202, description: 'Build queued' })
  async start(@Param('id', ParseIntPipe) id: number, @User() user: AuthenticatedUser): Promise<RuleBuildView> {
    return await this.builds.start(id, user);
  }

  @Get('/rules/:id/deployment')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @ApiParam({ name: 'id', description: 'Numeric rule ID', example: 50, type: 'number' })
  @ApiOperation({
    summary: 'Deployed rule',
    description: 'Whether the rule runs on Tazama, which version, and the latest result of each kind of run.',
  })
  async deployment(@Param('id', ParseIntPipe) id: number, @User() user: AuthenticatedUser): Promise<RuleDeploymentStatus> {
    return await this.builds.deployment(id, user);
  }

  @Post('/rules/:id/deployment')
  @HttpCode(200)
  @Audit()
  @RequireAnyClaims(TazamaClaims.EDITOR)
  @ApiParam({ name: 'id', description: 'Numeric rule ID', example: 50, type: 'number' })
  @ApiOperation({
    summary: 'Deploy the rule to Tazama',
    description: 'Runs the image of the latest passed build in the Tazama network and adds the rule to the active network map.',
  })
  async deploy(@Param('id', ParseIntPipe) id: number, @User() user: AuthenticatedUser): Promise<RuleDeployResult> {
    return await this.builds.deploy(id, user);
  }

  @Post('/rules/:id/runs/rule')
  @HttpCode(200)
  @Audit()
  @RequireAnyClaims(TazamaClaims.EDITOR)
  @ApiParam({ name: 'id', description: 'Numeric rule ID', example: 50, type: 'number' })
  @ApiOperation({
    summary: 'Run the deployed rule',
    description:
      'Sends the latest transaction Tazama evaluated for the rule, with its data cache, straight to the deployed rule and returns its result. ' +
      'Without one, a sample transaction goes through Tazama first.',
  })
  async runRule(@Param('id', ParseIntPipe) id: number, @User() user: AuthenticatedUser): Promise<RuleRunResult> {
    return await this.builds.runRule(id, user);
  }

  @Post('/rules/:id/runs/end-to-end')
  @HttpCode(200)
  @Audit()
  @RequireAnyClaims(TazamaClaims.EDITOR)
  @ApiParam({ name: 'id', description: 'Numeric rule ID', example: 50, type: 'number' })
  @ApiOperation({
    summary: 'Run a transaction end to end',
    description: 'Sends a new pacs.008 and pacs.002 through TMS and returns the full evaluation, with the result of the deployed rule.',
  })
  async runEndToEnd(@Param('id', ParseIntPipe) id: number, @User() user: AuthenticatedUser): Promise<RuleRunResult> {
    return await this.builds.runEndToEnd(id, user);
  }

  @Get('/rules/:id/builds/latest')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @ApiParam({ name: 'id', description: 'Numeric rule ID', example: 50, type: 'number' })
  @ApiOperation({
    summary: 'Latest build of a rule',
    description: '`build` is null when the rule has not been built (or its result expired).',
  })
  async latest(@Param('id', ParseIntPipe) id: number): Promise<{ build: RuleBuildView | null }> {
    return { build: (await this.builds.latest(id)) ?? null };
  }

  @Get('/builds/:buildId')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @ApiOperation({ summary: 'Build status and results' })
  async get(@Param('buildId') buildId: string): Promise<RuleBuildView> {
    return await this.builds.get(buildId);
  }

  @Get('/builds/:buildId/report')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @ApiProduces('text/html')
  @ApiOperation({ summary: 'HTML unit test report of a build' })
  async report(@Param('buildId') buildId: string): Promise<string> {
    return await this.builds.report(buildId);
  }

  @Get('/builds/:buildId/package')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @ApiProduces('application/gzip')
  @ApiOperation({ summary: 'Download the rule package (.tgz)', description: 'Its SHA-512 is in the X-Package-Integrity header.' })
  async package(@Param('buildId') buildId: string, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const pkg = await this.builds.package(buildId);
    res.setHeader('X-Package-Integrity', pkg.integrity);
    return new StreamableFile(pkg.data, {
      type: 'application/gzip',
      disposition: `attachment; filename="${pkg.file}"`,
      length: pkg.data.length,
    });
  }
}
