import { Body, Controller, Get, Header, HttpCode, Param, ParseIntPipe, Post, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import type { Response } from 'express';
import { Audit } from '../../decorators/audit.decorator';
import { RequireAnyClaims, TazamaClaims } from '../../decorators/auth.decorator';
import { User } from '../../decorators/user.decorator';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { RulePipelineBuildsService } from './rule-pipeline-builds.service';
import type { RuleBuildView, RulePipelineConfigView } from './rule-pipeline.types';

export class StartRuleBuildDto {
  @IsOptional()
  @IsBoolean()
  simulate?: boolean;
}

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
  @ApiBody({ type: StartRuleBuildDto, required: false })
  @ApiOperation({
    summary: 'Build and test a rule',
    description:
      'Queues a build of the current code and tests of the rule: unit tests, npm package and, as configured, an image, a registry push, ' +
      'a copy of the source in git and a smoke simulation. Poll the returned build for progress.',
  })
  @ApiResponse({ status: 202, description: 'Build queued' })
  async start(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: StartRuleBuildDto,
    @User() user: AuthenticatedUser,
  ): Promise<RuleBuildView> {
    return await this.builds.start(id, user, body.simulate ?? false);
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
