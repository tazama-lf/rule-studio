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
import { FieldMapping } from '@tazama-lf/tcs-lib';
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
  ACTIVE_NETWORK_MAP,
  CREATE_NODES,
  QUERY_NODES,
  RULE,
  RULES_WITH_ID,
  BASE_URL,
  GET_SIMULATION_LOGS,
  INSERT_SIMULATION_LOGS,
} from '../constants/constant';
import { ResponseQueryNodeDto } from './nodes/dto/responseNode.dto';
import { RuleRequest } from '../services/parse-extract/dto/message.dto';
import { SimulationLogsDto } from './simulation-logs/dto';
import { ISimulationLog } from './simulation-logs/interface/simulation-logs.interface';

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

  async getTransactionTypes(token: string): Promise<string[]> {
    const response = await this.executeHttpRequest<{
      transactionTypes: string[];
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

  async getPayloadByTransactionType(transactionType: string, token: string): Promise<Record<string, unknown>> {
    const response = await this.executeHttpRequest<{ payload: Record<string, unknown> }>(
      'GET',
      `${CONFIG_PAYLOAD}/${transactionType}`,
      token,
    );
    return response.payload;
  }

  async updateRule(ruleId: string, updateData: Partial<Rules>, token: string): Promise<Rules> {
    const response = await this.executeHttpRequest<{ rule: Rules }>('PUT', `${RULE}/${ruleId}`, token, updateData);

    return response.rule;
  }

  async getActiveNetworkMap(token: string): Promise<any> {
    const response = await this.executeHttpRequest<{
      networkMap: any;
    }>('GET', ACTIVE_NETWORK_MAP, token);
    return response.networkMap;
  }

  async getConfigPayloadByTxTp(transactionType: string, transactionVersion: string, token: string): Promise<any> {
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
    return await this.executeHttpRequest<ResponseRuleFlow>(
      'GET',
      `${RULE_FLOW}/${ruleId}${filters && Object.keys(filters).length ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : ''}`,
      token,
    );
  }

  async getRuleFlowStatus(ruleId: string, token: string, filters?: RuleFlowFilterDto): Promise<ResponseRuleFlowStatusDto> {
    return await this.executeHttpRequest<ResponseRuleFlowStatusDto>(
      'GET',
      `${RULE_FLOW}/status/${ruleId}${filters && Object.keys(filters).length ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : ''}`,
      token,
    );
  }

  async updateRuleFlow(ruleId: string, payload: RequestSaveFlow, token: string): Promise<ResponseUpdatedRuleFlowDto> {
    return await this.executeHttpRequest<ResponseUpdatedRuleFlowDto>('PUT', `${RULE_FLOW}/${ruleId}`, token, payload);
  }

  async getGlobalVariables(ruleId: string, tenantId: string, token: string): Promise<GlobalVariableDto> {
    return await this.executeHttpRequest<GlobalVariableDto>('GET', `${GLOBAL_VARIABLES}/${ruleId}/${tenantId}`, token);
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
    const queryString = Object.keys(query).length ? `?${new URLSearchParams(query as Record<string, string>).toString()}` : '';
    return await this.executeHttpRequest<SimulationLogsDto>(
      'GET',
      `${GET_SIMULATION_LOGS.replace(':ruleId', ruleId)}${queryString}`,
      token,
    );
  }

  async insertSimulationLogs(token: string, logs: ISimulationLog): Promise<SimulationLogsDto> {
    return await this.executeHttpRequest('POST', INSERT_SIMULATION_LOGS, token, logs);
  }
}
