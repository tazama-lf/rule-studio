import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { User } from '../../decorators/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { GenerateSampleMessagesResponseDto } from './dto/msg-sample-generation.dto';
import { MsgSampleGenerationService } from './msg-sample-generation.service';
import { RequireAnyClaims, TazamaClaims } from 'src/decorators/auth.decorator';
import { TazamaAuthGuard } from 'src/guards/tazama-auth.guard';

@Controller('msg-sample-generation')
@UseGuards(TazamaAuthGuard)
export class MsgSampleGenerationController {
  constructor(private readonly msgSampleGenerationService: MsgSampleGenerationService) {}

  @Get('transformation/:generationId')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  async applyTransformation(
    @Param('generationId', ParseIntPipe) generationId: number,
    @User() user: AuthenticatedUser,
  ): Promise<{ dbScript: string; functionResultScript: string }> {
    const response = await this.msgSampleGenerationService.getSampleMessages(generationId, user.token.tokenString);
    const { dbScript, functionResultScript } = await this.msgSampleGenerationService.generateDbScript(response, user.token.tokenString);
    return { dbScript, functionResultScript };
  }

  @Get(':generationId')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  async getSampleMessages(
    @Param('generationId', ParseIntPipe) generationId: number,
    @User() user: AuthenticatedUser,
  ): Promise<GenerateSampleMessagesResponseDto> {
    return await this.msgSampleGenerationService.getSampleMessages(generationId, user.token.tokenString);
  }
}
