import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
import { TazamaClaims, RequireAnyClaims } from '../../decorators/auth.decorator';
import { User } from '../../decorators/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { FetchCountService } from './fetch-count.service';
import {  FetchCountResponseDto } from './dto/fetch-count.dto';

@ApiTags('Fetch Count')
@ApiBearerAuth('JWT-auth')
@Controller('fetch-count')
@UseGuards(TazamaAuthGuard)
export class FetchCountController {
  constructor(private readonly fetchCountService: FetchCountService) {}

  @Post()
  @RequireAnyClaims(TazamaClaims.DEMS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch count for a resource',
    description: 'Returns the count for the specified resource.',
  })
  @ApiResponse({ status: 200, description: 'Count retrieved successfully.', type: FetchCountResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient claims' })
  async fetchCount(
    @User() _user: AuthenticatedUser,
  ): Promise<FetchCountResponseDto> {
    return await this.fetchCountService.fetchCount(_user.token.tokenString);
  }
}   
