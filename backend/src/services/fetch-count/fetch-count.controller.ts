import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
import { TazamaClaims, RequireAnyClaims } from '../../decorators/auth.decorator';
import { User } from '../../decorators/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { FetchCountService } from './fetch-count.service';
import type { FetchFromDlhResponseDto } from '../fetch-from-dlh/dto/fetch-from-dlh.dto';

@ApiTags('Fetch Count')
@ApiBearerAuth('JWT-auth')
@Controller('fetch-count')
@UseGuards(TazamaAuthGuard)
export class FetchCountController {
  constructor(private readonly fetchCountService: FetchCountService) {}

  @Post()
  @RequireAnyClaims(TazamaClaims.DEMS)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Run simulation for all active masked transaction types',
    description: 'Resolves active masking configs, fetches DLH data for each txtp, and enqueues a simulation job.',
  })
  @ApiResponse({ status: 202, description: 'Simulation job accepted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient claims' })
  @ApiResponse({ status: 409, description: 'Duplicate transaction type in active configs' })
  async fetchCount(
    @User() user: AuthenticatedUser,
    @Body() body: { startDtTm: string; endDtTm: string },
  ): Promise<FetchFromDlhResponseDto> {
    return await this.fetchCountService.fetchCount(body.startDtTm, body.endDtTm, user.token.tokenString);
  }
}   
