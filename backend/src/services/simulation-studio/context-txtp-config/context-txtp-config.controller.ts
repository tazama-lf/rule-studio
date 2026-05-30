import { Body, Controller, Get, Param, ParseIntPipe, Patch, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { RequireAnyClaims, TazamaClaims } from 'src/decorators/auth.decorator';
import { ApiSwagger, mergeResponses, CommonResponses } from 'src/decorators/swagger.decorator';
import { TazamaAuthGuard } from 'src/guards/tazama-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { Audit } from 'src/decorators/audit.decorator';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { ContextTxtpConfigService } from './context-txtp-config.service';
import { UpdateContextTxtpConfigDto, UpsertFieldStrategiesDto } from './dto/context-txtp-config.dto';
import type { ContextTxtpConfigResponseDto, FieldStrategyResponseDto, FieldStrategiesListDto } from './dto/context-txtp-config.dto';

@ApiTags('simulation-studio')
@ApiBearerAuth('JWT-auth')
@Controller('simulation-studio')
@UseGuards(TazamaAuthGuard)
export class ContextTxtpConfigController {
  constructor(private readonly contextTxtpConfigService: ContextTxtpConfigService) {}

  @Patch('suites/:suiteId/context-configs/:configId')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @Audit()
  @ApiParam({ name: 'suiteId', description: 'Simulation suite id', example: 1 })
  @ApiParam({ name: 'configId', description: 'Context TXTP config id', example: 1 })
  @ApiBody({ type: UpdateContextTxtpConfigDto })
  @ApiSwagger({
    summary: 'Update context TXTP config (Step 2)',
    description:
      'Updates message_count, faker_seed, or generator_profile on an existing context TXTP config row. Requires step 1 complete.',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(Object, 'Context config updated successfully'),
      CommonResponses.NOT_FOUND_404('Context config not found'),
    ),
  })
  async updateContextConfig(
    @Param('suiteId', ParseIntPipe) suiteId: number,
    @Param('configId', ParseIntPipe) configId: number,
    @Body() dto: UpdateContextTxtpConfigDto,
    @User() user: AuthenticatedUser,
  ): Promise<ContextTxtpConfigResponseDto> {
    return await this.contextTxtpConfigService.updateContextConfig(user.token.tokenString, suiteId, configId, dto);
  }

  @Put('suites/:suiteId/context-configs/:configId/field-strategies')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @Audit()
  @ApiParam({ name: 'suiteId', description: 'Simulation suite id', example: 1 })
  @ApiParam({ name: 'configId', description: 'Context TXTP config id', example: 1 })
  @ApiBody({ type: UpsertFieldStrategiesDto })
  @ApiSwagger({
    summary: 'Upsert field strategies (Step 2)',
    description: 'Upserts one or many field strategies for a context TXTP config row using ON CONFLICT. Requires step 1 complete.',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(Object, 'Field strategies upserted successfully'),
      CommonResponses.NOT_FOUND_404('Context config not found'),
    ),
  })
  async upsertFieldStrategies(
    @Param('suiteId', ParseIntPipe) suiteId: number,
    @Param('configId', ParseIntPipe) configId: number,
    @Body() dto: UpsertFieldStrategiesDto,
    @User() user: AuthenticatedUser,
  ): Promise<FieldStrategyResponseDto> {
    return await this.contextTxtpConfigService.upsertFieldStrategies(user.token.tokenString, suiteId, configId, dto);
  }

  @Get('suites/:suiteId/context-configs/:configId/field-strategies')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'suiteId', description: 'Simulation suite id', example: 1 })
  @ApiParam({ name: 'configId', description: 'Context TXTP config id', example: 1 })
  @ApiSwagger({
    summary: 'Get field strategies (Step 2)',
    description: 'Returns all saved field strategies for a context TXTP config row. Requires step 1 complete.',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(Object, 'Field strategies retrieved successfully'),
      CommonResponses.NOT_FOUND_404('Context config not found'),
    ),
  })
  async getFieldStrategies(
    @Param('suiteId', ParseIntPipe) suiteId: number,
    @Param('configId', ParseIntPipe) configId: number,
    @User() user: AuthenticatedUser,
  ): Promise<FieldStrategiesListDto> {
    return await this.contextTxtpConfigService.getFieldStrategies(user.token.tokenString, suiteId, configId);
  }
}
