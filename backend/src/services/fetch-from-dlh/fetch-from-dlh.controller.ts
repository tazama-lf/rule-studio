import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { TazamaAuthGuard } from 'src/guards/tazama-auth.guard';
import { RequireAnyClaims, TazamaClaims } from 'src/decorators/auth.decorator';
import { ApiSwagger, CommonResponses, mergeResponses } from 'src/decorators/swagger.decorator';
import { User } from 'src/decorators/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { FetchFromDlhService } from './fetch-from-dlh.service';
import { DlhCountDto, DlhCountResponse, FetchFromDlhQueryDto, FetchFromDlhResponseDto } from './dto/fetch-from-dlh.dto';
import { getTenantId } from 'src/utils/helpers';

@ApiTags('fetch-from-dlh')
@ApiBearerAuth('JWT-auth')
@Controller('fetch-from-dlh')
@UseGuards(TazamaAuthGuard)
export class FetchFromDlhController {
  constructor(private readonly fetchFromDlhService: FetchFromDlhService) { }

  @Post()
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @ApiBody({ type: [FetchFromDlhQueryDto], description: 'Array of DLH query parameters per transaction type' })
  @ApiSwagger({
    summary: 'Fetch data from DLH',
    description: 'Retrieves data from the Data Lake Hub for the given transaction type filters',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(FetchFromDlhResponseDto, 'Data fetched from DLH successfully'),
      CommonResponses.NOT_FOUND_404('Data not found'),
    ),
  })
  async fetchFromDlh(
    @Body() queries: FetchFromDlhQueryDto[],
    @User() user: AuthenticatedUser,
  ): Promise<FetchFromDlhResponseDto> {
    // const tenantId = getTenantId(user);
    const tenantId = 'DEFAULT'
    return await this.fetchFromDlhService.fetchFromDlh(queries, tenantId, user.token.tokenString);
  }

  @Post('/api/count')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @ApiBody({ type: DlhCountDto, description: 'Date with start time and end time' })
  @ApiSwagger({
    summary: 'Fetch count from DLH',
    description: 'Retrieves count from the Data Lake Hub for the given date and time',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(DlhCountResponse, 'Data fetched from DLH successfully'),
      CommonResponses.NOT_FOUND_404('Data not found'),
    ),
  })
  async fetchCountFromDlh(
    @Body() body: DlhCountDto,
    @User() user: AuthenticatedUser,
  ): Promise<DlhCountResponse> {
    return await this.fetchFromDlhService.getCount(body, user);
  }
}

