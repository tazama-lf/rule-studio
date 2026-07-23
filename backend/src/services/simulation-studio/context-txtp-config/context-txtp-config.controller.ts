import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { RequireAnyClaims, TazamaClaims } from 'src/decorators/auth.decorator';
import { ApiSwagger, mergeResponses, CommonResponses } from 'src/decorators/swagger.decorator';
import { TazamaAuthGuard } from 'src/guards/tazama-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { Audit } from 'src/decorators/audit.decorator';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { ContextTxtpConfigService } from './context-txtp-config.service';
import {
  AddContextTxtpConfigDto,
  CreateContextMappingDto,
  ContextMappingResponseDto,
  ContextMappingsResponseDto,
  BulkConfigItemDto,
  ContextConfigWithStrategiesResponseDto,
  ContextConfigsWithStrategiesListDto,
  BulkUpdateContextConfigsResponseDto,
} from './dto/context-txtp-config.dto';

@ApiTags('simulation-studio')
@ApiBearerAuth('JWT-auth')
@Controller('simulation-studio')
@UseGuards(TazamaAuthGuard)
export class ContextTxtpConfigController {
  constructor(private readonly contextTxtpConfigService: ContextTxtpConfigService) {}

  @Get('generations/:generationId/context-configs')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'generationId', description: 'Suite generation id', example: 1 })
  @ApiSwagger({
    summary: 'Get all context TXTP configs with field strategies (Step 2)',
    description: 'Returns all context txtp configs and their field strategies for the given generation.',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(ContextConfigsWithStrategiesListDto, 'Context configs retrieved successfully'),
      CommonResponses.NOT_FOUND_404('Generation not found'),
    ),
  })
  async getContextConfigs(
    @Param('generationId', ParseIntPipe) generationId: number,
    @User() user: AuthenticatedUser,
  ): Promise<ContextConfigsWithStrategiesListDto> {
    return await this.contextTxtpConfigService.getContextConfigs(user.token.tokenString, generationId);
  }

  @Post('generations/:generationId/context-configs')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @Audit()
  @ApiParam({ name: 'generationId', description: 'Suite generation id', example: 1 })
  @ApiBody({ type: AddContextTxtpConfigDto })
  @ApiSwagger({
    summary: 'Add context TXTP config (Step 2 - Add TXTP button)',
    description:
      'Creates a new context TXTP config for the generation. Fetches schema and payload from tcs_config and seeds all field paths with keep_sample strategy.',
    responses: mergeResponses(
      CommonResponses.CREATED_201(ContextConfigWithStrategiesResponseDto, 'Context config created successfully'),
      CommonResponses.NOT_FOUND_404('tcs_config entry not found for given txtp+version'),
    ),
  })
  async addContextConfig(
    @Param('generationId', ParseIntPipe) generationId: number,
    @Body() dto: AddContextTxtpConfigDto,
    @User() user: AuthenticatedUser,
  ): Promise<ContextConfigWithStrategiesResponseDto> {
    return await this.contextTxtpConfigService.addContextConfig(user.token.tokenString, generationId, dto);
  }

  @Patch('generations/:generationId/context-configs')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @Audit()
  @ApiParam({ name: 'generationId', description: 'Suite generation id', example: 1 })
  @ApiBody({ type: [BulkConfigItemDto] })
  @ApiSwagger({
    summary: 'Bulk update context TXTP configs (Step 2 - Next button)',
    description:
      'Updates message_count and upserts field strategies for all provided context configs. Returns the full updated state of all configs+strategies for the generation.',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(BulkUpdateContextConfigsResponseDto, 'Context configs updated successfully'),
      CommonResponses.NOT_FOUND_404('Generation not found'),
    ),
  })
  async bulkUpdateContextConfigs(
    @Param('generationId', ParseIntPipe) generationId: number,
    @Body() items: BulkConfigItemDto[],
    @User() user: AuthenticatedUser,
  ): Promise<BulkUpdateContextConfigsResponseDto> {
    return await this.contextTxtpConfigService.bulkUpdateContextConfigs(user.token.tokenString, generationId, items);
  }

  @Delete('generations/:generationId/context-configs/:configId')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'generationId', description: 'Generation id', example: 1 })
  @ApiParam({ name: 'configId', description: 'Context txtp config id', example: 1 })
  @ApiSwagger({
    summary: 'Delete context TXTP config (Step 2 - Remove TXTP button)',
    description: 'Deletes a context txtp config and its field strategies (cascade). Used when user removes a TXTP in Step 2.',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(Object, 'Context txtp config deleted'),
      CommonResponses.NOT_FOUND_404('Config not found'),
    ),
  })
  async deleteContextTxtpConfig(
    @Param('generationId', ParseIntPipe) generationId: number,
    @Param('configId', ParseIntPipe) configId: number,
    @User() user: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string }> {
    return await this.contextTxtpConfigService.deleteContextTxtpConfig(user.token.tokenString, generationId, configId);
  }

  @Post('context-mappings')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @Audit()
  @ApiBody({ type: CreateContextMappingDto })
  @ApiSwagger({
    summary: 'Create context mapping',
    description: 'Creates a mapping row for primary_txtp_id and related_txtp_id.',
    responses: mergeResponses(CommonResponses.CREATED_201(ContextMappingResponseDto, 'Context mapping created successfully')),
  })
  async createContextMapping(@Body() body: CreateContextMappingDto, @User() user: AuthenticatedUser): Promise<ContextMappingResponseDto> {
    return await this.contextTxtpConfigService.createContextMapping(user.token.tokenString, body);
  }

  @Get('context-mappings/:primaryTxtpId/:relatedTxtpId')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'primaryTxtpId', description: 'Primary txtp config id', example: 123 })
  @ApiParam({ name: 'relatedTxtpId', description: 'Related txtp config id', example: 456 })
  @ApiSwagger({
    summary: 'Get context mappings by ids',
    description: 'Returns all mapping rows for a primary/related tx id pair.',
    responses: mergeResponses(CommonResponses.SUCCESS_200(ContextMappingsResponseDto, 'Context mappings retrieved successfully')),
  })
  async getContextMappings(
    @Param('primaryTxtpId', ParseIntPipe) primaryTxtpId: number,
    @Param('relatedTxtpId', ParseIntPipe) relatedTxtpId: number,
    @User() user: AuthenticatedUser,
  ): Promise<ContextMappingsResponseDto> {
    return await this.contextTxtpConfigService.getContextMappings(user.token.tokenString, primaryTxtpId, relatedTxtpId);
  }

  @Delete('context-mappings/:primaryTxtpId/:relatedTxtpId')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @Audit()
  @ApiParam({ name: 'primaryTxtpId', description: 'Primary txtp config id', example: 123 })
  @ApiParam({ name: 'relatedTxtpId', description: 'Related txtp config id', example: 456 })
  @ApiSwagger({
    summary: 'Delete context mappings by ids',
    description: 'Deletes all mapping rows for a primary/related tx id pair.',
    responses: mergeResponses(CommonResponses.SUCCESS_200(Object, 'Context mappings deleted')),
  })
  async deleteContextMapping(
    @Param('primaryTxtpId', ParseIntPipe) primaryTxtpId: number,
    @Param('relatedTxtpId', ParseIntPipe) relatedTxtpId: number,
    @User() user: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string }> {
    return await this.contextTxtpConfigService.deleteContextMapping(user.token.tokenString, primaryTxtpId, relatedTxtpId);
  }
}
