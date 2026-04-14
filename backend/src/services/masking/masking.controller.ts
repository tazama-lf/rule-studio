import { Controller, Post, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
import { RequireAnyClaims, TazamaClaims } from '../../decorators/auth.decorator';
import { User } from '../../decorators/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { MaskingService } from './masking.service';
import type { MaskingListResponseDto } from './dto/masking.dto';
import { MaskingFiltersDto } from './dto/masking.dto';

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
}
