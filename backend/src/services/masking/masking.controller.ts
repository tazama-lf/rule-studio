import { Controller, Post, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ISuccess } from '@tazama-lf/tcs-lib';
import { Audit } from '../../decorators/audit.decorator';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
import { RequireAnyClaims, TazamaClaims } from '../../decorators/auth.decorator';
import { ApiSwagger, CommonResponses, mergeResponses } from '../../decorators/swagger.decorator';
import { User } from '../../decorators/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { MaskingService } from './masking.service';
import type { MaskingListResponseDto } from './dto/masking.dto';
import { MaskingFiltersDto } from './dto/masking.dto';
import { CreateMaskDto, SuccessResponseDto } from './dto/mask.dto';

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
}
