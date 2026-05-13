import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
import { TazamaClaims, RequireAnyClaims } from '../../decorators/auth.decorator';
import { User } from '../../decorators/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { SendToDemsService } from './send-to-dems.service';
import { StartSimulationResponseDto, StartSimulationDto } from './dto/send-to-dems.dto';

@ApiTags('DEMS Simulation')
@ApiBearerAuth('JWT-auth')
@Controller('send-to-dems')
@UseGuards(TazamaAuthGuard)
export class SendToDemsController {
  constructor(private readonly sendToDemsService: SendToDemsService) {}

  @Post('simulate')
  @RequireAnyClaims(TazamaClaims.DEMS)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Start the full simulation (async)',
    description:
      'Enqueues a background simulation job and returns a `jobId` immediately. ' +
      'Connect to the WebSocket namespace `/simulation`, emit `joinJob` with `{ jobId }` ' +
      'to subscribe to real-time progress updates (`simulationProgress` events).',
  })
  @ApiResponse({
    status: 202,
    description: 'Job accepted — use the returned `jobId` with the WebSocket `/simulation` namespace to track progress.',
    type: StartSimulationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient claims' })
  async startSimulation(@User() user: AuthenticatedUser, @Body() body: StartSimulationDto): Promise<StartSimulationResponseDto> {
    return await this.sendToDemsService.enqueueSimulation(user.token.tokenString, body.tableNames);
  }
}
