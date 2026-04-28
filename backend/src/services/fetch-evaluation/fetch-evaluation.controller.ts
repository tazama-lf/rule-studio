import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
import { TazamaClaims, RequireAnyClaims } from '../../decorators/auth.decorator';
import { User } from '../../decorators/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { FetchEvaluationService } from './fetch-evaluation.service';
import type { FetchEvaluationRequestDto, FetchEvaluationResponseDto } from './dto/fetch-evaluation.dto';

@ApiTags('Fetch Evaluation')
@ApiBearerAuth('JWT-auth')
@Controller('fetch-evaluation')
@UseGuards(TazamaAuthGuard)
export class FetchEvaluationController {
  constructor(private readonly fetchEvaluationService: FetchEvaluationService) {}

  @Post()
  @RequireAnyClaims(TazamaClaims.DEMS)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Fetch evaluation',
    description: 'Fetches evaluation data for the given date-time range.',
  })
  @ApiResponse({ status: 202, description: 'Request accepted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient claims' })
  async fetchEvaluation(
    @User() user: AuthenticatedUser,
    @Body() body: FetchEvaluationRequestDto,
  ): Promise<FetchEvaluationResponseDto> {
    return await this.fetchEvaluationService.fetchEvaluation(body.startDtTm, body.endDtTm, user.token.tokenString);
  }
}
