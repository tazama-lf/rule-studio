import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiBody, ApiParam } from "@nestjs/swagger";
import { RequireAnyClaims, TazamaClaims } from "src/decorators/auth.decorator";
import { ApiSwagger, mergeResponses, CommonResponses } from "src/decorators/swagger.decorator";
import { TazamaAuthGuard } from "src/guards/tazama-auth.guard";
import { UpdateRuleDto, Rules } from "../rules/dto/rules.dto";
import { SimulationLogsService } from "./simulation-logs.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { User } from "src/decorators/user.decorator";
import { RequestSimulationLogsDto, SimulationLogsDto } from "./dto";
import { Audit } from "src/decorators/audit.decorator";

@ApiTags('simulation-logs')
@ApiBearerAuth('JWT-auth')
@Controller('simulation-logs')
@UseGuards(TazamaAuthGuard)
export class SimulationLogsController {
  constructor(private readonly simulationLogsService: SimulationLogsService) {}

    @Get(':ruleId')
    @RequireAnyClaims(
        TazamaClaims.EDITOR,
        TazamaClaims.APPROVER,
        TazamaClaims.PUBLISHER,
    )
    @Audit() // Audit access to simulation logs (important for compliance and monitoring)
    @ApiParam({
        name: 'ruleId',
        description: 'Rule identifier to retrieve simulation logs for',
        example: '001',
    })
    @ApiSwagger({
        summary: 'get simulation logs for a rule',
        description: 'Retrieves simulation logs associated with a specific rule',
        responses: mergeResponses(
            CommonResponses.SUCCESS_200(SimulationLogsDto, 'Simulation logs retrieved successfully'),
            CommonResponses.NOT_FOUND_404('Rule not found'),
        ),
    })
    async getSimulationLogs(@Param('ruleId') ruleId: string, @User() user: AuthenticatedUser, @Query() query: { category: string }): Promise<SimulationLogsDto> {
        return await this.simulationLogsService.getSimulationLogs(user.token.tokenString, ruleId, query);

    }

    @Post('insert/:ruleId')
    @RequireAnyClaims(
        TazamaClaims.EDITOR,
        TazamaClaims.APPROVER,
        TazamaClaims.PUBLISHER,
    )
    @Audit() // Audit insertion of simulation logs (important for compliance and monitoring)
    @ApiBody({
        type: RequestSimulationLogsDto,
        description: 'Simulation logs to be inserted',
    })
    @ApiParam({
        name: 'ruleId',
        description: 'Rule identifier to associate the simulation logs with',
        example: '001',
    })
    @ApiSwagger({
        summary: 'Insert simulation logs',
        description: 'Inserts new simulation logs into the system',
        responses: mergeResponses(
            CommonResponses.CREATED_201(SimulationLogsDto, 'Simulation logs inserted successfully')
        ),
    })
    async insertSimulationLogs(@Param('ruleId') ruleId: string, @Body() logs: RequestSimulationLogsDto, @User() user: AuthenticatedUser): Promise<SimulationLogsDto> {
        return await this.simulationLogsService.insertSimulationLogs(user.token.tokenString, ruleId, logs);
    }
}
