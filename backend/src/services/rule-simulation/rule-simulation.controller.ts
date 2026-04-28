import { Controller, Get, UseGuards } from '@nestjs/common';
import { RuleSimulationService } from './rule-simulation.service';
import { RequireAnyClaims, TazamaClaims } from 'src/decorators/auth.decorator';
import { ApiSwagger, CommonResponses } from 'src/decorators/swagger.decorator';
import { User } from 'src/decorators/user.decorator';
import { type AuthenticatedUser } from '../auth/auth.types';
import { TazamaAuthGuard } from 'src/guards/tazama-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExcludedTypeProps } from './dto/rule-simulation.dto';

@ApiTags('RuleSimulation')
@ApiBearerAuth('JWT-auth')
@UseGuards(TazamaAuthGuard)
@Controller('rule-simulation')
export class RuleSimulationController {

    constructor(private readonly ruleSimulationService: RuleSimulationService) { }

    @Get('/api/excluded/types')
    @RequireAnyClaims(TazamaClaims.EDITOR)
    @ApiSwagger({
        summary: 'Get all types',
        description: 'Retreives active and inactive types with existence status',
        responses: CommonResponses.SUCCESS_200([ExcludedTypeProps], 'Excluded Types retrieved successfully'),
    })
    async getExcludedTypes(@User() user: AuthenticatedUser): Promise<ExcludedTypeProps[]> {
        return await this.ruleSimulationService.excludedTypes(user.token.tokenString);
    }
}
