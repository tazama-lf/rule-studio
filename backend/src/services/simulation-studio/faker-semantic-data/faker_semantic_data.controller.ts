import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TazamaAuthGuard } from 'src/guards/tazama-auth.guard';
import { FakerSemanticDataService } from './faker_semantic_data.service';
import { FakerSemanticDataListDto } from './dto/faker_semantic_data.dto';
import { ApiSwagger, CommonResponses, mergeResponses } from 'src/decorators/swagger.decorator';
import { RequireAnyClaims, TazamaClaims } from 'src/decorators/auth.decorator';
import type { AuthenticatedUser } from 'src/services/auth/auth.types';
import { User } from 'src/decorators/user.decorator';

@ApiTags('simulation-studio >  faker-symmetric-data')
@ApiBearerAuth('JWT-auth')
@Controller('faker-symmetric-data')
@UseGuards(TazamaAuthGuard)
export class FakerSemanticDataController {
  constructor(private readonly fakerSemanticDataService: FakerSemanticDataService) {}

  @Get()
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER)
  @ApiBearerAuth('JWT-auth')
  @ApiSwagger({
    summary: 'Generate Faker symmetric data',
    description: 'Generates symmetric data using Faker for testing purposes',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(FakerSemanticDataListDto, 'Faker symmetric data generated successfully'),
      CommonResponses.NOT_FOUND_404('Faker symmetric data not found'),
    ),
  })
  async generateFakerSymmetricData(@User() user: AuthenticatedUser): Promise<FakerSemanticDataListDto> {
    const data = await this.fakerSemanticDataService.generateFakerSymmetricData(user.token.tokenString);
    return data;
  }
}
