import { Controller, Post, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
import { TazamaClaims, RequireAnyClaims } from '../../decorators/auth.decorator';
import { User } from '../../decorators/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { SendToDemsService, SimulationResult } from './send-to-dems.service';
import { SimulationResultDto, StartSimulationDto } from './dto/send-to-dems.dto';

@ApiTags('DEMS Simulation')
@ApiBearerAuth('JWT-auth')
@Controller('send-to-dems')
@UseGuards(TazamaAuthGuard)
export class SendToDemsController {
  constructor(private readonly sendToDemsService: SendToDemsService) {}

  @Post('simulate')
  @RequireAnyClaims(TazamaClaims.DEMS)
  @ApiOperation({
    summary: 'Start the full simulation',
    description: 'Sends all messages to DEMS Dev endpoint one by one with proper time intervals',
  })
  @ApiResponse({
    status: 200,
    description: 'Simulation completed successfully - all messages delivered',
    type: SimulationResultDto,
  })
  @ApiResponse({
    status: 207,
    description: 'Simulation completed with some failures - partial success',
    type: SimulationResultDto,
  })
  @ApiResponse({ status: 500, description: 'Simulation failed completely' })
  async startSimulation(@User() user: AuthenticatedUser, @Body() body: StartSimulationDto): Promise<SimulationResult> {
    try {
      const result = await this.sendToDemsService.startSimulation(user.token.tokenString, body.tableNames);

      if (result.failedMessages > 0) {
        if (result.deliveredMessages === 0) {
          throw new HttpException(
            {
              message: `Simulation failed completely: all ${result.totalMessages} message(s) failed to be delivered`,
              result,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        throw new HttpException(
          {
            message: `Simulation completed with ${result.failedMessages} failed message(s) out of ${result.totalMessages}`,
            result,
          },
          HttpStatus.MULTI_STATUS,
        );
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.MULTI_STATUS) {
        throw error;
      }

      throw new HttpException(
        `Simulation failed completely: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

