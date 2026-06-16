import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { RequireAnyClaims, TazamaClaims } from 'src/decorators/auth.decorator';
import { ApiSwagger, mergeResponses, CommonResponses } from 'src/decorators/swagger.decorator';
import { TazamaAuthGuard } from 'src/guards/tazama-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { Audit } from 'src/decorators/audit.decorator';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { TriggerTxtpConfigService } from './trigger-txtp-config.service';
import {
  AddTriggerTxtpConfigDto,
  BulkTriggerConfigItemDto,
  TriggerConfigsListDto,
  TriggerConfigWithOverridesResponseDto,
  BulkUpdateTriggerConfigsResponseDto,
} from './dto/trigger-txtp-config.dto';

@ApiTags('simulation-studio')
@ApiBearerAuth('JWT-auth')
@Controller('simulation-studio')
@UseGuards(TazamaAuthGuard)
export class TriggerTxtpConfigController {
  constructor(private readonly triggerTxtpConfigService: TriggerTxtpConfigService) {}

  @Get('generations/:generationId/trigger-configs')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'generationId', description: 'Suite generation id', example: 1 })
  @ApiSwagger({
    summary: 'Get all trigger TXTP configs with field overrides (Step 3)',
    description: 'Returns all trigger txtp configs and their field overrides for the given generation.',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(TriggerConfigsListDto, 'Trigger configs retrieved successfully'),
      CommonResponses.NOT_FOUND_404('Generation not found'),
    ),
  })
  async getTriggerConfigs(
    @Param('generationId', ParseIntPipe) generationId: number,
    @User() user: AuthenticatedUser,
  ): Promise<TriggerConfigsListDto> {
    return await this.triggerTxtpConfigService.getTriggerConfigs(user.token.tokenString, generationId);
  }

  @Post('generations/:generationId/trigger-configs')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @Audit()
  @ApiParam({ name: 'generationId', description: 'Suite generation id', example: 1 })
  @ApiBody({ type: AddTriggerTxtpConfigDto })
  @ApiSwagger({
    summary: 'Add trigger TXTP config (Step 3 - Add TXTP button)',
    description:
      'Creates a new trigger txtp config. txtp+version should match the primary TXTP (locked in UI). Uses sample payload from tcs_config as payload_template_json. Default message_count = 1.',
    responses: mergeResponses(
      CommonResponses.CREATED_201(TriggerConfigWithOverridesResponseDto, 'Trigger config created successfully'),
      CommonResponses.NOT_FOUND_404('tcs_config entry not found for given txtp+version'),
    ),
  })
  async addTriggerConfig(
    @Param('generationId', ParseIntPipe) generationId: number,
    @Body() dto: AddTriggerTxtpConfigDto,
    @User() user: AuthenticatedUser,
  ): Promise<TriggerConfigWithOverridesResponseDto> {
    return await this.triggerTxtpConfigService.addTriggerConfig(user.token.tokenString, generationId, dto);
  }

  @Patch('generations/:generationId/trigger-configs')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @Audit()
  @ApiParam({ name: 'generationId', description: 'Suite generation id', example: 1 })
  @ApiBody({ type: [BulkTriggerConfigItemDto] })
  @ApiSwagger({
    summary: 'Bulk update trigger TXTP configs (Step 3 - Next button)',
    description:
      'Updates message_count, payload_template_json and upserts field_overrides for all provided trigger configs. Returns full updated state for the generation.',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(BulkUpdateTriggerConfigsResponseDto, 'Trigger configs updated successfully'),
      CommonResponses.NOT_FOUND_404('Generation not found'),
    ),
  })
  async bulkUpdateTriggerConfigs(
    @Param('generationId', ParseIntPipe) generationId: number,
    @Body() items: BulkTriggerConfigItemDto[],
    @User() user: AuthenticatedUser,
  ): Promise<BulkUpdateTriggerConfigsResponseDto> {
    return await this.triggerTxtpConfigService.bulkUpdateTriggerConfigs(user.token.tokenString, generationId, items);
  }

  @Delete('generations/:generationId/trigger-configs/:configId')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'generationId', description: 'Generation id', example: 1 })
  @ApiParam({ name: 'configId', description: 'Trigger txtp config id', example: 1 })
  @ApiSwagger({
    summary: 'Delete trigger TXTP config (Step 3 - Remove TXTP button)',
    description: 'Deletes a trigger txtp config and its field overrides (cascade). Used when user removes a trigger TXTP in Step 3.',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(Object, 'Trigger txtp config deleted'),
      CommonResponses.NOT_FOUND_404('Config not found'),
    ),
  })
  async deleteTriggerTxtpConfig(
    @Param('generationId', ParseIntPipe) generationId: number,
    @Param('configId', ParseIntPipe) configId: number,
    @User() user: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string }> {
    return await this.triggerTxtpConfigService.deleteTriggerTxtpConfig(user.token.tokenString, generationId, configId);
  }
}
