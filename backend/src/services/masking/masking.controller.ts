import { Controller, Post, Body, Query, ParseIntPipe, UseGuards, Put, Param, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiBody, ApiParam } from '@nestjs/swagger';
import { ISuccess } from '@tazama-lf/tcs-lib';
import { Audit } from '../../decorators/audit.decorator';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
import { RequireAnyClaims, TazamaClaims } from '../../decorators/auth.decorator';
import { ApiSwagger, CommonResponses, mergeResponses } from '../../decorators/swagger.decorator';
import { User } from '../../decorators/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { MaskingService } from './masking.service';
import type { MaskingListResponseDto } from './dto/masking.dto';
import { MaskingFiltersDto, UpdateMaskDto } from './dto/masking.dto';
import { CreateMaskDto, SuccessResponseDto } from './dto/mask.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Masking')
@ApiBearerAuth('JWT-auth')
@Controller('masking')
@UseGuards(TazamaAuthGuard)
export class MaskingController {
  constructor(private readonly maskingService: MaskingService) {}

  @Post('/api/all')
  @RequireAnyClaims(TazamaClaims.DATA_ENGINEER_EDITOR, TazamaClaims.DATA_ENGINEER_APPROVER)
  @ApiQuery({ name: 'offset', required: true, type: Number, description: 'Starting position (0-based index)' })
  @ApiQuery({ name: 'limit', required: true, type: Number, description: 'Number of records per page' })
  @ApiBody({ type: MaskingFiltersDto, required: false, description: 'Optional filters: status, txtp' })
  async getAllMask(
    @Query('offset', ParseIntPipe) offset: number,
    @Query('limit', ParseIntPipe) limit: number,
    @User() user: AuthenticatedUser,
    @Body() filters?: MaskingFiltersDto,
  ): Promise<MaskingListResponseDto> {
    return await this.maskingService.getAllMask(offset, limit, filters ?? {}, user);
  }

  @Post('/api/create')
  @Throttle({ default: { limit: 5, ttl: 30 } })
  @RequireAnyClaims(TazamaClaims.DATA_ENGINEER_EDITOR)
  @Audit()
  @ApiBody({ type: CreateMaskDto, description: 'Masking data for creation' })
  @ApiSwagger({
    summary: 'Create new masking configuration',
    description: 'Creates a new masking configuration',
    responses: mergeResponses(
      CommonResponses.CREATED_201(SuccessResponseDto, 'Masking created successfully'),
      CommonResponses.BAD_REQUEST_400('Invalid input data or masking already exists'),
    ),
  })
  async createMask(
    @Body() body: CreateMaskDto,
    @User() user: AuthenticatedUser,
  ): Promise<ISuccess> {
    return await this.maskingService.create(body, user);
  }

  @Get('/api/:id')
  @RequireAnyClaims(TazamaClaims.DATA_ENGINEER_EDITOR, TazamaClaims.DATA_ENGINEER_APPROVER)
  @ApiParam({ name: 'id', description: 'Masking configuration ID (integer)', type: Number, example: 1 })
  @ApiSwagger({
    summary: 'Get masking configuration by ID',
    description: 'Retrieves a masking configuration by its numeric ID',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(undefined, 'Masking configuration retrieved successfully'),
      CommonResponses.NOT_FOUND_404('Masking configuration not found'),
    ),
  })
  async getMaskById(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthenticatedUser,
  ): Promise<Record<string, unknown>> {
    return await this.maskingService.getMaskById(id, user);
  }

  @Put('/api/:id')
  @RequireAnyClaims(TazamaClaims.DATA_ENGINEER_EDITOR)
  @Audit()
  @ApiParam({ name: 'id', description: 'Masking configuration ID', type: Number, example: 1 })
  @ApiBody({ type: UpdateMaskDto, description: 'Partial masking data to update' })
  @ApiSwagger({
    summary: 'Update masking configuration',
    description: 'Updates an existing masking configuration by ID (only provided fields will be updated)',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(undefined, 'Masking configuration updated successfully'),
      CommonResponses.NOT_FOUND_404('Masking configuration not found'),
    ),
  })
  async updateMask(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: UpdateMaskDto,
    @User() user: AuthenticatedUser,
  ): Promise<Record<string, unknown>> {
    return await this.maskingService.updateMask(id, updateData, user);
  }
}
