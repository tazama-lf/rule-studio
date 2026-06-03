import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { RequireAnyClaims, TazamaClaims } from 'src/decorators/auth.decorator';
import { ApiSwagger, mergeResponses, CommonResponses } from 'src/decorators/swagger.decorator';
import { TazamaAuthGuard } from 'src/guards/tazama-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { Audit } from 'src/decorators/audit.decorator';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { EnrichmentTableService } from './enrichment-table.service';
import {
  CreateEnrichmentTableDto,
  BulkEnrichmentUpdateItemDto,
  EnrichmentTableResponseDto,
  EnrichmentTablesListDto,
  BulkUpdateEnrichmentTablesResponseDto,
  DeleteEnrichmentTableResponseDto,
} from './dto/enrichment-table.dto';

@ApiTags('simulation-studio')
@ApiBearerAuth('JWT-auth')
@Controller('simulation-studio')
@UseGuards(TazamaAuthGuard)
export class EnrichmentTableController {
  constructor(private readonly enrichmentTableService: EnrichmentTableService) {}

  @Get('generations/:generationId/enrichment-tables')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'generationId', description: 'Suite generation id', example: 1 })
  @ApiSwagger({
    summary: 'Get all enrichment tables with field strategies (Step 4)',
    description: 'Returns all enrichment tables and their field strategies for the given generation.',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(EnrichmentTablesListDto, 'Enrichment tables retrieved successfully'),
      CommonResponses.NOT_FOUND_404('Generation not found'),
    ),
  })
  async getEnrichmentTables(
    @Param('generationId', ParseIntPipe) generationId: number,
    @User() user: AuthenticatedUser,
  ): Promise<EnrichmentTablesListDto> {
    return await this.enrichmentTableService.getEnrichmentTables(user.token.tokenString, generationId);
  }

  @Post('generations/:generationId/enrichment-tables')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @Audit()
  @ApiParam({ name: 'generationId', description: 'Suite generation id', example: 1 })
  @ApiBody({ type: CreateEnrichmentTableDto })
  @ApiSwagger({
    summary: 'Create enrichment table (Step 4 - Save Record button)',
    description: 'Creates an enrichment table row and seeds all payload field paths with strategy_code = null.',
    responses: mergeResponses(CommonResponses.CREATED_201(EnrichmentTableResponseDto, 'Enrichment table created successfully')),
  })
  async createEnrichmentTable(
    @Param('generationId', ParseIntPipe) generationId: number,
    @Body() dto: CreateEnrichmentTableDto,
    @User() user: AuthenticatedUser,
  ): Promise<EnrichmentTableResponseDto> {
    return await this.enrichmentTableService.createEnrichmentTable(user.token.tokenString, generationId, dto);
  }

  @Patch('generations/:generationId/enrichment-tables')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @Audit()
  @ApiParam({ name: 'generationId', description: 'Suite generation id', example: 1 })
  @ApiBody({ type: [BulkEnrichmentUpdateItemDto] })
  @ApiSwagger({
    summary: 'Bulk update enrichment tables (Step 4 - Next button)',
    description: 'Updates no_of_rows, payload and upserts field_strategies for all provided enrichment tables.',
    responses: mergeResponses(CommonResponses.SUCCESS_200(BulkUpdateEnrichmentTablesResponseDto, 'Enrichment tables updated successfully')),
  })
  async bulkUpdateEnrichmentTables(
    @Param('generationId', ParseIntPipe) generationId: number,
    @Body() items: BulkEnrichmentUpdateItemDto[],
    @User() user: AuthenticatedUser,
  ): Promise<BulkUpdateEnrichmentTablesResponseDto> {
    return await this.enrichmentTableService.bulkUpdateEnrichmentTables(user.token.tokenString, generationId, items);
  }

  @Delete('generations/:generationId/enrichment-tables/:tableId')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @Audit()
  @ApiParam({ name: 'generationId', description: 'Suite generation id', example: 1 })
  @ApiParam({ name: 'tableId', description: 'Enrichment table id', example: 1 })
  @ApiSwagger({
    summary: 'Delete enrichment table (Step 4 - Remove button)',
    description: 'Deletes an enrichment table and all its field strategies (cascade).',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(DeleteEnrichmentTableResponseDto, 'Enrichment table deleted successfully'),
      CommonResponses.NOT_FOUND_404('Enrichment table not found'),
    ),
  })
  async deleteEnrichmentTable(
    @Param('generationId', ParseIntPipe) generationId: number,
    @Param('tableId', ParseIntPipe) tableId: number,
    @User() user: AuthenticatedUser,
  ): Promise<DeleteEnrichmentTableResponseDto> {
    return await this.enrichmentTableService.deleteEnrichmentTable(user.token.tokenString, generationId, tableId);
  }
}
