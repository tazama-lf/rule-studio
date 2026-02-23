import { Controller, Post, Body, Param, UseGuards, ParseIntPipe, Get, Query, Put, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { ApiSwagger, CommonResponses, mergeResponses } from '../../decorators/swagger.decorator';
import { TazamaAuthGuard } from '../../guards/tazama-auth.guard';
// import { StatusValidationGuard } from '../../guards/status-validation.guard';
import { User } from '../../decorators/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { TazamaClaims, RequireAnyClaims } from '../../decorators/auth.decorator';
import { Audit } from '../../decorators/audit.decorator';
import { RulesService } from './rules.service';
import {
  Rules,
  ResponseRuleFlowDto,
  GlobalVariableDto,
  RuleIdResponseDto,
  RuleFiltersDto,
  UpdateRuleDto,
  UpdateRuleStatusDto,
  RequestSaveFlow,
  CreateRuleDto,
  RequestFlow,
  RuleFlowFilterDto,
  ResponseRuleFlow,
  ResponseUpdatedRuleFlowDto,
  ResponseRuleFlowStatusDto,
} from './dto/rules.dto';

@ApiTags('Rules')
@ApiBearerAuth('JWT-auth')
@Controller('rules')
@UseGuards(TazamaAuthGuard)
export class RulesController {
  private readonly logger = new Logger(RulesController.name);

  constructor(private readonly rulesService: RulesService) {}

  // get available rule statuses
  @Get('/api/status')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @ApiSwagger({
    summary: 'Get available rule statuses',
    description: 'Retrieves available rule statuses based on user role and permissions',
    responses: CommonResponses.SUCCESS_200([String], 'Rule statuses retrieved successfully'),
  })
  getRulesStatus(@User() user: AuthenticatedUser): string[] {
    const allowedStatuses = this.rulesService.getRulesStatusbyRole(user);
    return allowedStatuses;
  }

  // get all rules with pagination and filters
  @Post('/api/all')
  // @UseGuards(StatusValidationGuard)
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @ApiQuery({
    name: 'offset',
    required: true,
    type: Number,
    description: 'Starting position (0-based index)',
  })
  @ApiQuery({
    name: 'limit',
    required: true,
    type: Number,
    description: 'Number of records per page',
  })
  @ApiBody({
    type: RuleFiltersDto,
    required: false,
    description: 'Optional filters for rule search',
  })
  @ApiSwagger({
    summary: 'Get all rules (paginated)',
    description: 'Retrieves paginated list of rules with optional filters for status, transaction type, etc.',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200([Rules], 'Rules retrieved successfully'),
      CommonResponses.BAD_REQUEST_400('Invalid pagination parameters'),
    ),
  })
  async getAllRules(
    @Query('offset', ParseIntPipe) offset: number,
    @Query('limit', ParseIntPipe) limit: number,
    @User() user: AuthenticatedUser,
    @Body() filters?: RuleFiltersDto,
  ): Promise<Rules[]> {
    const updatedFilters = filters ?? {};

    if (!updatedFilters.status || updatedFilters.status === '') {
      const allowedStatuses = this.rulesService.getRulesStatusbyRole(user);
      if (allowedStatuses.length > 0) {
        updatedFilters.status = allowedStatuses.join(',');
      }
    }

    return await this.rulesService.getAllRules(offset, limit, updatedFilters, user.token.tokenString);
  }

  // get rule IDs
  @Get('/api/ids')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @ApiSwagger({
    summary: 'Get rule IDs',
    description: 'Retrieves all available rule IDs for the authenticated user',
    responses: CommonResponses.SUCCESS_200([RuleIdResponseDto], 'Rule IDs retrieved successfully'),
  })
  async getRuleIds(@User() user: AuthenticatedUser): Promise<RuleIdResponseDto[]> {
    return await this.rulesService.getRuleIds(user.token.tokenString);
  }

  // create a new rule
  @Post('/api/create')
  @RequireAnyClaims(TazamaClaims.EDITOR)
  @Audit() // Audit rule creation actions
  @ApiBody({
    type: Rules,
    description: 'Rule data for creation',
  })
  @ApiSwagger({
    summary: 'Create new rule',
    description: 'Creates a new transaction rule for fraud detection, AML, or compliance monitoring',
    responses: mergeResponses(
      CommonResponses.CREATED_201(Rules, 'Rule created successfully'),
      CommonResponses.BAD_REQUEST_400('Invalid input data or rule already exists'),
    ),
  })
  async createRule(@Body() ruleData: CreateRuleDto, @User() user: AuthenticatedUser): Promise<Rules> {
    const ruleDataWithUser = {
      ruleName: ruleData.ruleName,
      description: ruleData.description,
      txtp: ruleData.txtp,
      version: ruleData.version,
      txtpVersion: ruleData.txtpVersion,
      status: ruleData.status,
      publishing_status: ruleData.publishing_status,
      rule_type: ruleData.rule_type,
      rule_config_id: ruleData.rule_config_id,
      userID: user.userId,
    };
    return await this.rulesService.createRule(ruleDataWithUser, user.token.tokenString, user.tenantId);
  }

  // get rule configuration by rule ID
  @Get('/api/configuration/:ruleId')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @ApiParam({
    name: 'ruleId',
    description: 'Rule identifier',
    example: 'high-value-transfer-001',
  })
  @ApiSwagger({
    summary: 'Get rule configuration',
    description: 'Retrieves configuration details for a specific rule by rule ID',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(undefined, 'Rule configuration retrieved successfully'),
      CommonResponses.NOT_FOUND_404('Rule configuration not found'),
    ),
  })
  async getRuleConfiguration(@Param('ruleId') ruleId: string, @User() user: AuthenticatedUser): Promise<any> {
    return await this.rulesService.getRuleConfiguration(ruleId, user.token.tokenString);
  }

  // update an existing rule
  @Put('/api/:ruleId')
  @RequireAnyClaims(TazamaClaims.EDITOR)
  @Audit() // Audit rule modification actions
  @ApiParam({
    name: 'ruleId',
    description: 'Rule identifier to update',
    example: 'high-value-transfer-001',
  })
  @ApiBody({
    type: UpdateRuleDto,
    description: 'Partial rule data for update',
  })
  @ApiSwagger({
    summary: 'Update existing rule',
    description: 'Updates an existing rule with partial data (only provided fields will be updated)',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(Rules, 'Rule updated successfully'),
      CommonResponses.NOT_FOUND_404('Rule not found'),
    ),
  })
  async updateRule(@Param('ruleId') ruleId: string, @Body() updateData: UpdateRuleDto, @User() user: AuthenticatedUser): Promise<Rules> {
    return await this.rulesService.updateRule(ruleId, updateData, user.token.tokenString);
  }

  // get rule by ID
  @Get('/api/:id')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @ApiParam({
    name: 'id',
    description: 'Numeric rule ID (integer)',
    example: 1,
    type: 'number',
  })
  @ApiSwagger({
    summary: 'Get rule by numeric ID',
    description: 'Retrieves a specific rule by its numeric database ID',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(Rules, 'Rule retrieved successfully'),
      CommonResponses.BAD_REQUEST_400('Invalid ID format (must be numeric)'),
      CommonResponses.NOT_FOUND_404('Rule not found'),
    ),
  })
  async getRulesById(@Param('id', ParseIntPipe) id: number, @User() user: AuthenticatedUser): Promise<Rules> {
    return await this.rulesService.getRulesById(id, user.tenantId, user.token.tokenString);
  }

  // get active network map
  @Get('/api/network-map/active')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @ApiSwagger({
    summary: 'Get active network map',
    description: 'Retrieves the active network map configuration showing rule relationships and processing flow',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(undefined, 'Active network map retrieved successfully'),
      CommonResponses.NOT_FOUND_404('No active network map found'),
    ),
  })
  async getActiveNetworkMap(@User() user: AuthenticatedUser): Promise<any> {
    this.logger.log(`Controller: Fetching active network map for user: ${user.userId}`);
    return await this.rulesService.getActiveNetworkMap(user.token.tokenString);
  }

  // create rule flow configuration
  @Post('/api/:ruleId/flow')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @Audit() // Audit rule flow creation
  @ApiParam({ name: 'ruleId', description: 'Rule identifier', example: '001' })
  @ApiBody({
    type: RequestFlow,
    description: 'Flow configuration with nodes and edges',
  })
  @ApiSwagger({
    summary: 'Create rule flow',
    description: 'Creates a new flow configuration for a specific rule with nodes and connections',
    responses: mergeResponses(
      CommonResponses.CREATED_201(ResponseRuleFlowDto, 'Rule flow created successfully'),
      CommonResponses.BAD_REQUEST_400('Invalid flow configuration'),
      CommonResponses.NOT_FOUND_404('Rule not found'),
    ),
  })
  async createRuleFlow(
    @Param('ruleId') ruleId: string,
    @Body() body: RequestFlow,
    @User() user: AuthenticatedUser,
  ): Promise<ResponseRuleFlowDto> {
    return await this.rulesService.createRuleFlow(ruleId, body, user.token.tokenString);
  }

  // get rule flow configuration
  @Get('/api/:ruleId/flow')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @ApiParam({ name: 'ruleId', description: 'Rule identifier', example: '001' })
  @ApiSwagger({
    summary: 'Get rule flow',
    description: 'Retrieves the flow configuration for a specific rule showing nodes and connections',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(ResponseRuleFlowDto, 'Rule flow retrieved successfully'),
      CommonResponses.NOT_FOUND_404('Rule flow not found'),
    ),
  })
  async getRuleFlow(
    @Param('ruleId') ruleId: string,
    @Query() query: RuleFlowFilterDto,
    @User() user: AuthenticatedUser,
  ): Promise<ResponseRuleFlow> {
    const result = await this.rulesService.getRuleFlow(ruleId, user.token.tokenString, query);
    return result;
  }

  //get rule flow status based on rule ID:
  @Get('/api/:ruleId/flow/status')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @ApiParam({ name: 'ruleId', description: 'Rule identifier', example: '001' })
  @ApiSwagger({
    summary: 'Get rule flow status',
    description: 'Retrieves the current status of the rule flow configuration (e.g., active, draft, error)',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(ResponseRuleFlowStatusDto, 'Rule flow status retrieved successfully'),
      CommonResponses.NOT_FOUND_404('Rule flow not found'),
    ),
  })
  async getRuleFlowStatus(
    @Param('ruleId') ruleId: string,
    @Query() query: RuleFlowFilterDto,
    @User() user: AuthenticatedUser,
  ): Promise<ResponseRuleFlowStatusDto> {
    const result = await this.rulesService.getRuleFlowStatus(ruleId, user.token.tokenString, query);
    return result;
  }

  // update rule flow configuration
  @Put('/api/:ruleId/flow')
  @RequireAnyClaims(TazamaClaims.EDITOR)
  @Audit() // Audit rule flow modification
  @ApiParam({ name: 'ruleId', description: 'Rule identifier', example: '001' })
  @ApiBody({
    type: RequestSaveFlow,
    description: 'Updated flow configuration',
  })
  @ApiSwagger({
    summary: 'Update rule flow',
    description: 'Updates the flow configuration for a specific rule with new nodes and connections',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(ResponseRuleFlowDto, 'Rule flow updated successfully'),
      CommonResponses.BAD_REQUEST_400('Invalid flow configuration'),
      CommonResponses.NOT_FOUND_404('Rule flow not found'),
    ),
  })
  async updateRuleFlow(
    @Param('ruleId') ruleId: string,
    @Body() payload: RequestSaveFlow,
    @User() user: AuthenticatedUser,
  ): Promise<ResponseUpdatedRuleFlowDto> {
    return await this.rulesService.updateRuleFlow(ruleId, payload, user.token.tokenString);
  }

  // get global variables for a rule
  @Get('/api/global-variables/:ruleId')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @ApiParam({
    name: 'ruleId',
    description: 'Rule identifier',
    example: 'high-value-transfer-001',
  })
  @ApiSwagger({
    summary: 'Get global variables for rule',
    description: 'Retrieves global variables available for a specific rule configuration',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(GlobalVariableDto, 'Global variables retrieved successfully'),
      CommonResponses.NOT_FOUND_404('Rule not found'),
    ),
  })
  async getGlobalVariables(@Param('ruleId') ruleId: string, @User() user: AuthenticatedUser): Promise<GlobalVariableDto> {
    return await this.rulesService.getGlobalVariables(ruleId, user.tenantId, user.token.tokenString);
  }

  // clone an existing rule
  @Post('/api/clone/:ruleId')
  @RequireAnyClaims(TazamaClaims.EDITOR)
  @Audit() // Audit rule cloning actions
  @ApiParam({
    name: 'ruleId',
    description: 'Source rule identifier to clone',
    example: 'high-value-transfer-001',
  })
  @ApiBody({
    description: 'Payload data for rule cloning',
    required: false,
  })
  @ApiSwagger({
    summary: 'Clone existing rule',
    description: 'Creates a copy of an existing rule for modification and customization',
    responses: mergeResponses(
      CommonResponses.CREATED_201(Rules, 'Rule cloned successfully'),
      CommonResponses.NOT_FOUND_404('Source rule not found'),
    ),
  })
  async cloneRule(
    @Param('ruleId') ruleId: string,
    @Body() payload: any, // add type here
    @User() user: AuthenticatedUser,
  ): Promise<Rules> {
    return await this.rulesService.cloneRule(ruleId, user.token.tokenString, payload);
  }

  // update rule status
  @Put('/api/:ruleId/status')
  @RequireAnyClaims(TazamaClaims.EDITOR, TazamaClaims.APPROVER, TazamaClaims.PUBLISHER)
  @Audit() // Audit rule status changes (critical for compliance)
  @ApiParam({
    name: 'ruleId',
    description: 'Rule identifier',
    example: 'high-value-transfer-001',
  })
  @ApiBody({
    type: UpdateRuleStatusDto,
    description: 'Status update with reason',
  })
  @ApiSwagger({
    summary: 'Update rule status',
    description: 'Updates the activation status of a specific rule with reason for change',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(Rules, 'Rule status updated successfully'),
      CommonResponses.BAD_REQUEST_400('Invalid status or missing reason'),
      CommonResponses.NOT_FOUND_404('Rule not found'),
    ),
  })
  async updateRuleStatus(
    @Param('ruleId') ruleId: string,
    @Body() body: UpdateRuleStatusDto,
    @User() user: AuthenticatedUser,
  ): Promise<Rules> {
    return await this.rulesService.updateRuleStatus(
      ruleId,
      body.status,
      body.comment ?? '',
      user.token.tokenString,
      user,
    );
  }

  // update rule metadata
  @Put('/api/:ruleId/metadata')
  @RequireAnyClaims(TazamaClaims.EDITOR)
  @ApiParam({
    name: 'ruleId',
    description: 'Rule identifier to update',
    example: '001',
  })
  @ApiBody({
    type: UpdateRuleDto,
    description: 'Partial rule data for update',
  })
  @ApiSwagger({
    summary: 'Update existing rule metadata',
    description: 'Updates an existing rule with partial metadata (only provided fields will be updated)',
    responses: mergeResponses(
      CommonResponses.SUCCESS_200(Rules, 'Rule metadata updated successfully'),
      CommonResponses.NOT_FOUND_404('Rule not found'),
    ),
  })
  async updateRuleMetadata(
    @Param('ruleId') ruleId: string,
    @Body() updateData: UpdateRuleDto,
    @User() user: AuthenticatedUser,
  ): Promise<Rules> {
    return await this.rulesService.updateRule(ruleId, updateData, user.token.tokenString);
  }
}
