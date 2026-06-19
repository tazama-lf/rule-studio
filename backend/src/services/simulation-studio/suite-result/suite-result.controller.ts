import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TazamaAuthGuard } from 'src/guards/tazama-auth.guard';
import { RequireAnyClaims, TazamaClaims } from 'src/decorators/auth.decorator';
import { ApiSwagger, CommonResponses, mergeResponses } from 'src/decorators/swagger.decorator';
import { User } from 'src/decorators/user.decorator';
import type { AuthenticatedUser } from 'src/services/auth/auth.types';
import { SuiteResultService } from './suite-result.service';
import { SaveRunResultBodyDto, SaveRunResultResponseDto, SuiteResultResponseDto } from './dto/suite-result.dto';

@ApiTags('simulation-studio')
@ApiBearerAuth('JWT-auth')
@Controller('simulation-studio')
@UseGuards(TazamaAuthGuard)
export class SuiteResultController {
  constructor(private readonly suiteResultService: SuiteResultService) {}

  @Get('suites/:suiteId/result')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiParam({ name: 'suiteId', description: 'Simulation suite id', example: 1 })
  @ApiSwagger({
    summary: 'Get suite result',
    description: 'Retrieves simulation run results for a suite, including full trigger config for each result entry',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(SuiteResultResponseDto, 'Suite result retrieved successfully'),
      CommonResponses.NOT_FOUND_404('Suite result not found'),
    ),
  })
  async getSuiteResult(@Param('suiteId', ParseIntPipe) suiteId: number, @User() user: AuthenticatedUser): Promise<SuiteResultResponseDto> {
    return await this.suiteResultService.getSuiteResult(user.token.tokenString, suiteId);
  }

  @Post('runs/result')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiSwagger({
    summary: 'Save run result',
    description: 'Saves a simulation run result entry linked to a generation and trigger config',
    responses: mergeResponses(
      CommonResponses.SUCCESS_201(SaveRunResultResponseDto, 'Run result saved successfully'),
      CommonResponses.BAD_REQUEST_400('gen_id and rule_result are required'),
    ),
  })
  async saveRunResult(@Body() body: SaveRunResultBodyDto, @User() user: AuthenticatedUser): Promise<SaveRunResultResponseDto> {
    return await this.suiteResultService.saveRunResult(user.token.tokenString, body);
  }
}
