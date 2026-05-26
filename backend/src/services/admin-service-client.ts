import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  ResponseRuleFlowDto,
  Rules,
  GlobalVariableDto,
  RequestSaveFlow,
  RuleFiltersDto,
  RequestFlow,
  RuleFlowFilterDto,
  ResponseRuleFlow,
  ResponseUpdatedRuleFlowDto,
  ResponseRuleFlowStatusDto,
} from '../services/rules/dto/rules.dto';
import { firstValueFrom } from 'rxjs';
import { CreateNodeDto, RequestQueryNodeDto, ResponseNodesDto } from './nodes/dto';
import { GetNodesQuery } from './nodes/interfaces/node.interface';
import { FieldMapping, ISuccess } from '@tazama-lf/tcs-lib';
import {
  GLOBAL_VARIABLES,
  NODES,
  RULE_FLOW,
  RULE_IDS,
  RULE_CONFIGURATION,
  UPDATE_RULE_STATUS,
  SAVE_RULE_REQUEST,
  CONFIG_VERSIONS,
  CONFIG_TRANSACTION_TYPES,
  CONFIG_PAYLOAD,
  CONFIG,
  NETWORK_MAP_LIST,
  CREATE_NODES,
  QUERY_NODES,
  RULE,
  RULES_WITH_ID,
  BASE_URL,
  GET_SIMULATION_LOGS,
  INSERT_SIMULATION_LOGS,
  MASKING_ALL,
  MASKING_UPDATE,
  MASKING_REVIEW,
  MASKING_ACTIVE_CONFIGS,
  CREATE_MASK,
  SIMULATION_MESSAGES,
  SIMULATION_ALL,
  SIMULATION_CREATE,
  SIMULATION_STATS,
  SIMULATION_RESULTS,
  SIMULATION_SUITES,
  SIMULATION_ITEMS,
  EXCLUDED_TYPES,
  STAGE_SIMULATION_ITEMS,
  GET_ALL_EVALUATIONS,
  FETCH_COUNT_DLH,
} from '../constants/constant';
import type { MaskingFiltersDto, MaskingListResponseDto, UpdateMaskDto } from './masking/dto/masking.dto';
import type {
  SimulationListResponseDto,
  CreateSimulationDto,
  CreateSimulationResponseDto,
  SimulationStatsDto,
  SimulationResultsResponseDto,
  ExcludedTypeProps,
} from './simulation/dto/simulation.dto';
import { ResponseQueryNodeDto } from './nodes/dto/responseNode.dto';
import { RuleRequest } from '../services/parse-extract/dto/message.dto';
import { SimulationLogsDto } from './simulation-logs/dto';
import { ISimulationLog } from './simulation-logs/interface/simulation-logs.interface';
import { CreateMaskDto } from './masking/dto/mask.dto';
import { EvaluationRow } from './fetch-evaluation/dto/fetch-evaluation.dto';
import { TransactionTypeDto } from './config/dto/config.dto';
import { DlhCountDataDto, DlhCountResponse } from './fetch-from-dlh/dto/fetch-from-dlh.dto';
import { PatchSimulationSuitesDto, SimulationSuitesDto, SimulationSuitesListDto, SimulationSuitesQueryDto } from './simulation-studio/dto';
import type { ISimulationSuiteCreatePayload } from './simulation-studio/interface/simulation-studio.interface';

export interface SimulationMessage {
  messageId: string;
  timestamp: string;
  endpoint: string;
  data: Record<string, unknown>;
}

@Injectable()
export class AdminServiceClient {
  private readonly logger = new Logger(AdminServiceClient.name);
  private readonly adminServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.adminServiceUrl = BASE_URL;
    this.logger.log(`Admin Service URL configured as: ${this.adminServiceUrl}`);
  }

  private getAuthHeaders(token: string): Record<string, string> {
    return {
      Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
    };
  }

  private async executeHttpRequest<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path: string,
    token: string,
    body?: unknown, // one param for everything
    params?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`${this.adminServiceUrl}${path}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers = this.getAuthHeaders(token);

    this.logger.log(`Making ${method} request to: ${url.toString()}`);
    if (body) {
      this.logger.debug(`Request body: ${JSON.stringify(body).substring(0, 200)}...`);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: url.toString(),
          data: body,
          headers,
        }),
      );

      this.logger.log(`${method} ${path} - Success (${response.status})`);
      this.logger.debug(`Response data: ${JSON.stringify(response.data).substring(0, 200)}...`);

      return response.data as T;
    } catch (error) {
      return this.handleError(error, `${method} ${path}`);
    }
  }

  private handleError(error: unknown, operation: string): never {
    const err = error as {
      response?: { status: number; data: unknown };
      request?: unknown;
      message: string;
    };
    if (err.response) {
      const { status, data } = err.response;
      this.logger.error(`${operation} failed with status ${status}: ${JSON.stringify(data)}`);

      const message =
        data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
          ? data.message
          : 'Admin service returned an error response';

      throw new HttpException(message, status);
    } else if (err.request) {
      this.logger.error(`${operation} - No response from admin-service: ${err.message}`);
      throw new HttpException('Admin service is unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    } else {
      this.logger.error(`${operation} - Error: ${err.message}`);
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAllRulesWithFilters(offset: number, limit: number, filters: RuleFiltersDto, token: string): Promise<Rules[]> {
    return await this.executeHttpRequest<Rules[]>('POST', `${RULES_WITH_ID}/${offset}/${limit}`, token, filters);
  }

  async getRulesById(id: number, token: string): Promise<Rules> {
    return await this.executeHttpRequest<Rules>('GET', `${RULES_WITH_ID}/${id}`, token);
  }

  async getVersionsOfTransactionType(transactionType: string, token: string): Promise<string[]> {
    const response = await this.executeHttpRequest<{ versions: string[] }>('GET', `${CONFIG_VERSIONS}/${transactionType}`, token);
    return response.versions;
  }

  async saveRuleRequest(
    txTp: string,
    tenantId: string,
    token: string,
    ruleRequest: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return await this.executeHttpRequest('POST', SAVE_RULE_REQUEST, token, {
      txTp,
      tenantId,
      ruleRequest,
    });
  }

  async createRule(ruleData: Partial<Rules>, token: string, ruleRequest: RuleRequest | undefined): Promise<Rules> {
    const response = await this.executeHttpRequest<{ rule: Rules }>('POST', RULE, token, { ruleData, ruleRequest });

    return response.rule;
  }

  async getRuleIds(token: string): Promise<Array<Record<string, unknown>>> {
    const response = await this.executeHttpRequest<{
      ruleIds: Array<Record<string, unknown>>;
    }>('GET', RULE_IDS, token);
    return response.ruleIds;
  }

  async getRuleConfiguration(ruleId: string, token: string): Promise<Record<string, unknown>> {
    const response = await this.executeHttpRequest<{
      configuration: Record<string, unknown>;
    }>('GET', `${RULE_CONFIGURATION}/${ruleId}`, token);

    return response.configuration;
  }

  async getTransactionTypes(token: string): Promise<TransactionTypeDto[]> {
    const response = await this.executeHttpRequest<{
      transactionTypes: TransactionTypeDto[];
    }>('GET', CONFIG_TRANSACTION_TYPES, token);
    return response.transactionTypes;
  }
  // async findSchemaAndMapping(transaction_type: string, token: string): Promise<[string, Record<string, string>, Record<string, string>]> {
  //   const response = await this.executeHttpRequest<{
  //     schema: string;
  //     mapping: Record<string, string>;
  //     functions: Record<string, string>;
  //   }>(
  //     'GET',
  //     `${CONFIG}/${encodeURIComponent(transaction_type)}`,
  //     token,
  //   );
  //   return [response.schema, response.mapping, response.functions];
  // }

  async getPayloadByTransactionType(transactionType: string, transactionVersion: string, token: string): Promise<Record<string, unknown>> {
    const response = await this.executeHttpRequest<{ payload: Record<string, unknown> }>(
      'GET',
      `${CONFIG_PAYLOAD}/${transactionType}/${transactionVersion}`,
      token,
    );
    return response.payload;
  }

  async updateRule(ruleId: string, updateData: Partial<Rules>, token: string): Promise<Rules> {
    const response = await this.executeHttpRequest<{ rule: Rules }>('PUT', `${RULE}/${ruleId}`, token, updateData);

    return response.rule;
  }

  async getActiveNetworkMap(token: string): Promise<Record<string, unknown>> {
    const response = await this.executeHttpRequest<{
      data: Array<Record<string, unknown>>;
      meta: { total: number; limit: number; offset: number };
    }>('GET', NETWORK_MAP_LIST, token, undefined, { 'filters[active]': 'true', 'limit': '1' });

    if (response.data.length === 0) {
      throw new HttpException('No active network map found', HttpStatus.NOT_FOUND);
    }

    return response.data[0];
  }

  async getConfigPayloadByTxTp(transactionType: string, transactionVersion: string, token: string): Promise<Record<string, unknown>> {
    return await this.executeHttpRequest(
      'GET',
      `${CONFIG_PAYLOAD}/${encodeURIComponent(transactionType)}/${encodeURIComponent(transactionVersion)}`,
      token,
    );
  }

  async getConfigRowByTxTp(
    transactionType: string,
    transactionVersion: string,
    token: string,
  ): Promise<{
    config: {
      schema: Record<string, unknown>;
      mapping: FieldMapping[];
      payload: Record<string, unknown>;
    };
  }> {
    return await this.executeHttpRequest<{
      config: {
        schema: Record<string, unknown>;
        mapping: FieldMapping[];
        payload: Record<string, unknown>;
      };
    }>('GET', `${CONFIG}/${encodeURIComponent(transactionType)}/${encodeURIComponent(transactionVersion)}`, token);
  }

  async cloneRule(
    ruleId: string,
    token: string,
    payload: Record<string, unknown> & { txtp?: string; txtpVersion?: string },
  ): Promise<Rules> {
    const response = await this.executeHttpRequest<{ rule: Rules }>('POST', `/v1/admin/trs/rule/clone/${ruleId}`, token, {
      payload,
    });

    return response.rule;
  }

  // Nodes API

  async createNode(token: string, createNodeDto: CreateNodeDto[]): Promise<ResponseNodesDto[]> {
    return await this.executeHttpRequest<ResponseNodesDto[]>('POST', CREATE_NODES, token, createNodeDto);
  }

  async getAllNodes(token: string, query: GetNodesQuery): Promise<ResponseNodesDto[]> {
    const params: Record<string, string> = {};
    if (query.tenantId) params.tenantId = query.tenantId;
    if (query.type) params.type = query.type;
    if (query.category) params.category = query.category;
    if (query.sortBy) params.sortBy = query.sortBy;
    if (query.sortOrder) params.sortOrder = query.sortOrder;
    if (query.limit !== undefined) params.limit = String(query.limit);
    if (query.offset !== undefined) params.offset = String(query.offset);
    const response = await this.executeHttpRequest<{
      nodes: ResponseNodesDto[];
    }>('GET', NODES, token, undefined, params);
    return response.nodes;
  }

  async deleteNodeByNodeId(nodeId: string, token: string): Promise<{ success: boolean; message: string }> {
    return await this.executeHttpRequest<{ success: boolean; message: string }>('DELETE', `${NODES}/${nodeId}`, token);
  }

  async createRuleFlow(ruleId: string, payload: RequestFlow, token: string): Promise<ResponseRuleFlowDto> {
    const result = await this.executeHttpRequest<{
      flow: ResponseRuleFlowDto[];
    }>('POST', `${RULE_FLOW}/${ruleId}`, token, payload);
    return result.flow[0];
  }

  async getRuleFlow(ruleId: string, token: string, filters?: RuleFlowFilterDto): Promise<ResponseRuleFlow> {
    const queryParams: Record<string, string> = {};
    if (filters?.category) {
      queryParams.category = filters.category.toString();
    }
    const queryString = Object.keys(queryParams).length ? `?${new URLSearchParams(queryParams).toString()}` : '';

    return await this.executeHttpRequest<ResponseRuleFlow>('GET', `${RULE_FLOW}/${ruleId}${queryString}`, token);
  }

  async getRuleFlowStatus(ruleId: string, token: string, filters?: RuleFlowFilterDto): Promise<ResponseRuleFlowStatusDto> {
    const queryParams: Record<string, string> = {};
    if (filters?.category) {
      queryParams.category = filters.category.toString();
    }
    const queryString = Object.keys(queryParams).length ? `?${new URLSearchParams(queryParams).toString()}` : '';

    return await this.executeHttpRequest<ResponseRuleFlowStatusDto>('GET', `${RULE_FLOW}/status/${ruleId}${queryString}`, token);
  }

  async updateRuleFlow(ruleId: string, payload: RequestSaveFlow, token: string): Promise<ResponseUpdatedRuleFlowDto> {
    return await this.executeHttpRequest<ResponseUpdatedRuleFlowDto>('PUT', `${RULE_FLOW}/${ruleId}`, token, payload);
  }

  async getGlobalVariables(ruleId: string, token: string): Promise<GlobalVariableDto> {
    return await this.executeHttpRequest<GlobalVariableDto>('GET', `${GLOBAL_VARIABLES}/${ruleId}`, token);
  }

  async updateRuleStatus(ruleId: string, status: string, reason: string, token: string): Promise<Rules> {
    const response = await this.executeHttpRequest<{ rule: Rules }>('PUT', `${UPDATE_RULE_STATUS}/${ruleId}`, token, { status, reason });

    return response.rule;
  }

  async executeQueryNode(token: string, data: RequestQueryNodeDto): Promise<ResponseQueryNodeDto> {
    return await this.executeHttpRequest<ResponseQueryNodeDto>('POST', QUERY_NODES, token, {
      query: data.query,
      dbName: data.dbName,
      params: data.params,
    });
  }

  async getSimulationLogs(token: string, ruleId: string, query: { category: string }): Promise<SimulationLogsDto> {
    const queryString = Object.keys(query).length ? `?${new URLSearchParams(query).toString()}` : '';
    return await this.executeHttpRequest<SimulationLogsDto>(
      'GET',
      `${GET_SIMULATION_LOGS.replace(':ruleId', ruleId)}${queryString}`,
      token,
    );
  }

  async insertSimulationLogs(token: string, logs: ISimulationLog): Promise<SimulationLogsDto> {
    return await this.executeHttpRequest('POST', INSERT_SIMULATION_LOGS, token, logs);
  }

  async getAllMaskWithFilters(offset: number, limit: number, filters: MaskingFiltersDto, token: string): Promise<MaskingListResponseDto> {
    return await this.executeHttpRequest<MaskingListResponseDto>('POST', `${MASKING_ALL}/${offset}/${limit}`, token, filters);
  }

  async createMask(maskData: CreateMaskDto, token: string): Promise<Partial<ISuccess>> {
    const response = await this.executeHttpRequest<ISuccess>('POST', CREATE_MASK, token, { maskData });
    return response;
  }

  async updateMask(id: number, updateData: UpdateMaskDto | Record<string, unknown>, token: string): Promise<Record<string, unknown>> {
    return await this.executeHttpRequest<Record<string, unknown>>('PUT', `${MASKING_UPDATE}/${id}`, token, updateData);
  }

  async getMaskById(id: number, token: string): Promise<Record<string, unknown>> {
    const response = await this.executeHttpRequest<{ mask: Record<string, unknown> }>('GET', `${MASKING_UPDATE}/${id}`, token);
    return response.mask;
  }

  async reviewMask(
    id: number,
    action: 'approve' | 'reject',
    comments: string | undefined,
    token: string,
  ): Promise<Record<string, unknown>> {
    const response = await this.executeHttpRequest<{ mask: Record<string, unknown> }>('PATCH', `${MASKING_REVIEW}/${id}/review`, token, {
      action,
      ...(comments?.trim() ? { comments: comments.trim() } : {}),
    });
    return response.mask;
  }
  async getSimulationMessages(token: string, tableName: string): Promise<SimulationMessage[]> {
    const response = await this.executeHttpRequest<{
      messages: SimulationMessage[];
    }>('GET', SIMULATION_MESSAGES, token, undefined, { tableName });
    return response.messages;
  }

  async getAllSimulations(offset: number, limit: number, token: string): Promise<SimulationListResponseDto> {
    return await this.executeHttpRequest<SimulationListResponseDto>('GET', `${SIMULATION_ALL}/${offset}/${limit}`, token);
  }

  async createSimulation(body: CreateSimulationDto, token: string): Promise<CreateSimulationResponseDto> {
    return await this.executeHttpRequest<CreateSimulationResponseDto>('POST', SIMULATION_CREATE, token, body);
  }

  async getExcludedTypes(token: string): Promise<ExcludedTypeProps> {
    return await this.executeHttpRequest<ExcludedTypeProps>('GET', EXCLUDED_TYPES, token);
  }

  async getSimulationStats(sim: string, iterationNo: string, token: string): Promise<SimulationStatsDto> {
    return await this.executeHttpRequest<SimulationStatsDto>('GET', SIMULATION_STATS, token, undefined, { sim, iteration_no: iterationNo });
  }

  async getSimulationResults(
    sim: string,
    iterationNo: string,
    limit: number,
    offset: number,
    token: string,
    filters: { msg_id?: string; msg_type?: string; outcome?: string } = {},
  ): Promise<SimulationResultsResponseDto> {
    const params: Record<string, string> = { sim, iteration_no: iterationNo, limit: String(limit), offset: String(offset) };
    if (filters.msg_id) params.msg_id = filters.msg_id;
    if (filters.msg_type) params.msg_type = filters.msg_type;
    if (filters.outcome) params.outcome = filters.outcome;
    return await this.executeHttpRequest<SimulationResultsResponseDto>('GET', SIMULATION_RESULTS, token, undefined, params);
  }

  async stageSimulationItems(items: Array<Record<string, unknown>>, token: string): Promise<{ tableName: string | null }> {
    return await this.executeHttpRequest('POST', STAGE_SIMULATION_ITEMS, token, items);
  }
  async fetchCountFromDlh(data: DlhCountDataDto, token: string): Promise<DlhCountResponse> {
    return await this.executeHttpRequest('POST', FETCH_COUNT_DLH, token, data.data);
  }

  async fetchMaskingConfig(token: string): Promise<Record<string, unknown>> {
    return await this.executeHttpRequest('GET', '/v1/admin/trs/masking/all-fetch', token);
  }

  async fetchActiveMaskingConfigs(
    tuples: Array<{ tenant_id: string; txtp: string; txtp_version: string }>,
    token: string,
  ): Promise<Array<{ tenant_id: string; txtp: string; txtp_version: string; endpoint_path: string }>> {
    const response = await this.executeHttpRequest<{
      masks: Array<{ tenant_id: string; txtp: string; txtp_version: string; endpoint_path: string }>;
    }>('POST', MASKING_ACTIVE_CONFIGS, token, tuples);
    return response.masks;
  }
  async getAllEvaluations(token: string): Promise<{ message: string; data: EvaluationRow[] }> {
    return await this.executeHttpRequest<{ message: string; data: EvaluationRow[] }>('GET', GET_ALL_EVALUATIONS, token);
  }

  async saveEvaluationsInResultsTable(token: string, evaluations: EvaluationRow[], tableName?: string): Promise<{ message: string }> {
    return await this.executeHttpRequest<{ message: string }>('POST', '/v1/admin/trs/evaluations/save', token, { evaluations, tableName });
  }

  async truncateEvaluationData(token: string): Promise<{ message: string }> {
    return await this.executeHttpRequest<{ message: string }>('DELETE', '/v1/dlh/truncate-evaluations', token);
  }

  async saveRecordInTrsSimulation(
    simulationData: { simulationId: string | undefined; totalRecord: number; recordProcessed: number; simStatus: string; tenantId: string },
    token: string,
  ): Promise<{ message: string }> {
    return await this.executeHttpRequest<{ message: string }>('POST', '/v1/admin/trs-simulation/save', token, simulationData);
  }

  async getSimulationItems(
    token: string,
    tableName: string,
  ): Promise<
    Array<{
      payload: Record<string, unknown>;
      endpointPath: string | null;
      credttm: string | null;
      tenantId: string | null;
      msgid: string | null;
    }>
  > {
    const response = await this.executeHttpRequest<{
      items: Array<{
        payload: Record<string, unknown>;
        endpointPath: string | null;
        credttm: string | null;
        tenantId: string | null;
        msgid: string | null;
      }>;
    }>('GET', SIMULATION_ITEMS, token, undefined, { tableName });
    return response.items;
  }

  // Endpoints for Simulation Studio

  async getSimulationSuites(token: string, query: SimulationSuitesQueryDto = {}): Promise<SimulationSuitesListDto> {
    const params: Record<string, string> = {};
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.rule_name) params.rule_name = query.rule_name;
    if (query.txtp) params.txtp = query.txtp;
    if (query.updated_from) params.updated_from = query.updated_from;
    if (query.updated_to) params.updated_to = query.updated_to;
    if (query.offset !== undefined) params.offset = String(query.offset);
    if (query.limit !== undefined) params.limit = String(query.limit);

    return await this.executeHttpRequest<SimulationSuitesListDto>('GET', SIMULATION_SUITES, token, undefined, params);
  }

  async getSimulationSuiteById(token: string, id: number): Promise<SimulationSuitesDto> {
    return await this.executeHttpRequest<SimulationSuitesDto>('GET', `${SIMULATION_SUITES}/${id}`, token);
  }

  async createSimulationSuite(token: string, suite: ISimulationSuiteCreatePayload): Promise<SimulationSuitesDto> {
    return await this.executeHttpRequest<SimulationSuitesDto>('POST', SIMULATION_SUITES, token, suite);
  }

  async patchSimulationSuite(token: string, id: number, payload: PatchSimulationSuitesDto): Promise<SimulationSuitesDto> {
    return await this.executeHttpRequest<SimulationSuitesDto>('PATCH', `${SIMULATION_SUITES}/${id}`, token, payload);
  }
}
