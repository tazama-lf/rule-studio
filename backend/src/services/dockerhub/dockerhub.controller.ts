import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
import { RequireAnyClaims, TazamaClaims } from '../../decorators/auth.decorator';
import { ApiSwagger, CommonResponses } from '../../decorators/swagger.decorator';
import { User } from '../../decorators/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DockerHubService } from './dockerhub.service';
import { DockerHubRepositoriesResponseDto, DockerHubTagsResponseDto } from './dto/dockerhub.dto';

@ApiTags('DockerHub')
@ApiBearerAuth('JWT-auth')
@Controller('dockerhub')
@UseGuards(TazamaAuthGuard)
export class DockerHubController {
  constructor(private readonly dockerHubService: DockerHubService) { }

  @Get('/api/rules')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @ApiSwagger({
    summary: 'Get all published rules from Docker Hub',
    description:
      'Retrieves all repositories (rules) published to the Docker Hub namespace configured for the calling tenant. ' +
      'The tenant is identified from the `tenantId` claim in the Bearer JWT.',
    responses: CommonResponses.SUCCESS_200(DockerHubRepositoriesResponseDto, 'Published rules retrieved successfully'),
  })
  async getPublishedRules(@User() user: AuthenticatedUser): Promise<DockerHubRepositoriesResponseDto> {
    return await this.dockerHubService.getPublishedRules(user.tenantId);
  }

  @Get('/api/tags')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @ApiQuery({ name: 'rule', required: true, type: String, description: 'Rule (repository) name to fetch tags for', example: 'case105' })
  @ApiSwagger({
    summary: 'Get all tags for a published rule',
    description:
      'Retrieves all Docker Hub tags for the specified rule repository within the calling tenant\'s namespace. ' +
      'The tenant is identified from the `tenantId` claim in the Bearer JWT.',
    responses: CommonResponses.SUCCESS_200(DockerHubTagsResponseDto, 'Tags retrieved successfully'),
  })
  async getTagsForRule(
    @Query('rule') rule: string,
    @User() user: AuthenticatedUser,
  ): Promise<DockerHubTagsResponseDto> {
    if (!rule.trim()) {
      throw new BadRequestException('`rule` query parameter is required.');
    }
    return await this.dockerHubService.getTagsForRule(user.tenantId, rule.trim());
  }
}

