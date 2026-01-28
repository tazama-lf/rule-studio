import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ResponseRuleFlowDto,
  Rules,
  GlobalVariableDto,
  RequestSaveFlow,
  RuleFiltersDto,
} from '../services/rules/dto/rules.dto';
import { firstValueFrom } from 'rxjs';
import {
  CreateNodeDto,
  RequestQueryNodeDto,
  ResponseNodesDto,
} from './nodes/dto';
import { GetNodesQuery } from './nodes/interfaces/node.interface';
import {
  BASE_URL,
  GLOBAL_VARIABLES,
  NODES,
  RULE_FLOW,
  RULES_WITH_FILTERS,
  RULES_WITH_ID,
} from '../constants/constant';
import { ResponseQueryNodeDto } from './nodes/dto/responseNode.dto';

@Injectable()
export class AdminServiceClient {
  private readonly logger = new Logger(AdminServiceClient.name);
  private readonly adminServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.adminServiceUrl =
      process.env.ADMIN_SERVICE_URL ?? 'http://localhost:3100';
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
    body?: unknown,
  ): Promise<T> {
    const url = `${this.adminServiceUrl}${path}`;
    const headers = this.getAuthHeaders(token);

    this.logger.log(`Making ${method} request to: ${url}`);
    if (body) {
      this.logger.debug(
        `Request body: ${JSON.stringify(body).substring(0, 200)}...`,
      );
    }

    try {
      let response;
      switch (method) {
        case 'GET':
          response = await firstValueFrom(
            this.httpService.get(url, { headers }),
          );
          break;
        case 'POST':
          response = await firstValueFrom(
            this.httpService.post(url, body, { headers }),
          );
          break;
        case 'PUT':
          response = await firstValueFrom(
            this.httpService.put(url, body, { headers }),
          );
          break;
        case 'DELETE':
          response = await firstValueFrom(
            this.httpService.delete(url, { headers, data: body }),
          );
          break;
        case 'PATCH':
          response = await firstValueFrom(
            this.httpService.patch(url, body, { headers }),
          );
          break;
      }

      this.logger.log(`${method} ${path} - Success (${response.status})`);
      this.logger.debug(
        `Response data: ${JSON.stringify(response.data).substring(0, 200)}...`,
      );

      return response.data as T;
    } catch (error) {
      return this.handleError(error, `${method} ${path}`);
    }
  }

  async forwardRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<unknown> {
    const url = `${this.adminServiceUrl}${path}`;
    this.logger.log(`Making ${method} request to: ${url}`);
    if (body) {
      this.logger.debug(
        `Request body: ${JSON.stringify(body).substring(0, 200)}...`,
      );
    }
    if (headers) {
      this.logger.debug(`Request headers: ${JSON.stringify(headers)}`);
    }

    try {
      let response;
      switch (method) {
        case 'GET':
          response = await firstValueFrom(
            this.httpService.get(url, { headers }),
          );
          break;
        case 'POST':
          response = await firstValueFrom(
            this.httpService.post(url, body, { headers }),
          );
          break;
        case 'PUT':
          response = await firstValueFrom(
            this.httpService.put(url, body, { headers }),
          );
          break;
        case 'DELETE':
          response = await firstValueFrom(
            this.httpService.delete(url, { headers, data: body }),
          );
          break;
        case 'PATCH':
          response = await firstValueFrom(
            this.httpService.patch(url, body, { headers }),
          );
          break;
      }

      this.logger.log(`${method} ${path} - Success (${response.status})`);
      this.logger.debug(
        `Response data: ${JSON.stringify(response.data).substring(0, 200)}...`,
      );

      return response.data;
    } catch (error) {
      const err = error as {
        response?: { status: number; data: unknown };
        request?: unknown;
        message: string;
      };
      this.logger.error(`${method} ${path} - Failed: ${err.message}`);

      if (err.response) {
        const { status, data } = err.response;
        this.logger.error(
          `Admin-service error (${status}): ${JSON.stringify(data)}`,
        );

        const message =
          data &&
            typeof data === 'object' &&
            'message' in data &&
            typeof data.message === 'string'
            ? data.message
            : typeof data === 'string'
              ? data
              : 'Request failed';

        throw new HttpException(message, status);
      } else if (err.request) {
        this.logger.error(`No response from admin-service: ${err.message}`);
        throw new HttpException(
          'Admin service is unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      } else {
        this.logger.error(`Request setup error: ${err.message}`);
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
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
      this.logger.error(
        `${operation} failed with status ${status}: ${JSON.stringify(data)}`,
      );

      const message =
        data &&
          typeof data === 'object' &&
          'message' in data &&
          typeof data.message === 'string'
          ? data.message
          : 'Admin service returned an error response';

      throw new HttpException(message, status);
    } else if (err.request) {
      this.logger.error(
        `${operation} - No response from admin-service: ${err.message}`,
      );
      throw new HttpException(
        'Admin service is unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    } else {
      this.logger.error(`${operation} - Error: ${err.message}`);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllRulesWithFilters(
    offset: number,
    limit: number,
    filters: RuleFiltersDto,
    token: string,
  ): Promise<Rules[]> {
    return await this.executeHttpRequest<Rules[]>(
      'POST',
      `${RULES_WITH_FILTERS}/${offset}/${limit}`,
      token,
      filters,
    );
  }
  async getRulesById(id: number, token: string): Promise<Rules> {
    return await this.executeHttpRequest<Rules>(
      'GET',
      `${RULES_WITH_ID}/${id}`,
      token,
    );
  }

  async getVersionsOfTransactionType(
    transactionType: string,
    token: string,
  ): Promise<string[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.adminServiceUrl}/v1/admin/config/versions/${transactionType}`,
          {
            headers: {
              Authorization: token.startsWith('Bearer ')
                ? token
                : `Bearer ${token}`,
            },
          },
        ),
      );

      if (!response.data?.versions) {
        this.logger.warn(
          `No versions found for transaction type ${transactionType} in admin-service response`,
        );
        return [];
      }

      return response.data.versions;
    } catch (error) {
      return this.handleError(error, 'getVersionsOfTransactionType');
    }
  }

  async saveRuleRequest(
    txTp: string,
    tenantId: string,
    token: string,
    ruleRequest: any,
  ): Promise<any> {
    return await this.forwardRequest(
      'POST',
      '/v1/admin/trs/saveRuleRequest',
      { txTp, tenantId, ruleRequest },
      {
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      },
    );
  }

  async createRule(ruleData: Partial<Rules>, token: string): Promise<Rules> {
    const response = await this.executeHttpRequest<{ rule: Rules }>(
      'POST',
      '/v1/admin/trs/rule',
      token,
      ruleData,
    );

    if (!response?.rule) {
      this.logger.error('Invalid response from admin-service createRule');
      throw new HttpException(
        'Invalid response from admin service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return response.rule;
  }

  async getRuleIds(token: string): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.adminServiceUrl}/v1/admin/trs/rule-ids`, {
          headers: {
            Authorization: token.startsWith('Bearer ')
              ? token
              : `Bearer ${token}`,
          },
        }),
      );

      if (!response.data?.ruleIds) {
        this.logger.warn('No rule IDs found in admin-service response');
        return [];
      }

      return response.data.ruleIds;
    } catch (error) {
      return this.handleError(error, 'getRuleIds');
    }
  }

  async getRuleConfiguration(ruleId: string, token: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.adminServiceUrl}/v1/admin/trs/rule-configuration/${ruleId}`,
          {
            headers: {
              Authorization: token.startsWith('Bearer ')
                ? token
                : `Bearer ${token}`,
            },
          },
        ),
      );

      if (!response.data?.configuration) {
        this.logger.error(`No configuration found for rule ${ruleId}`);
        throw new HttpException(
          `Configuration not found for rule ${ruleId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      return response.data;
    } catch (error) {
      return this.handleError(error, 'getRuleConfiguration');
    }
  }

  async getTransactionTypes(token: string): Promise<string[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.adminServiceUrl}/v1/admin/config/transaction-types`,
          {
            headers: {
              Authorization: token.startsWith('Bearer ')
                ? token
                : `Bearer ${token}`,
            },
          },
        ),
      );

      if (!response.data?.transactionTypes) {
        this.logger.warn(
          'No transaction types found in admin-service response',
        );
        return [];
      }

      return response.data.transactionTypes;
    } catch (error) {
      return this.handleError(error, 'getTransactionTypes');
    }
  }

  async getPayloadByTransactionType(
    transactionType: string,
    token: string,
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.adminServiceUrl}/v1/admin/config/payload/${transactionType}`,
          {
            headers: {
              Authorization: token.startsWith('Bearer ')
                ? token
                : `Bearer ${token}`,
            },
          },
        ),
      );

      if (!response.data?.payload) {
        throw new NotFoundException(
          `No payload found for transaction type: ${transactionType}`,
        );
      }

      return response.data.payload;
    } catch (error) {
      return this.handleError(error, 'getPayloadByTransactionType');
    }
  }

  async updateRule(
    ruleId: string,
    updateData: Partial<Rules>,
    token: string,
  ): Promise<Rules> {
    try {
      const response = await firstValueFrom(
        this.httpService.put(
          `${this.adminServiceUrl}/v1/admin/trs/rule/${ruleId}`,
          updateData,
          {
            headers: {
              Authorization: token.startsWith('Bearer ')
                ? token
                : `Bearer ${token}`,
            },
          },
        ),
      );

      if (!response.data?.rule) {
        this.logger.error(`No rule returned after update for ${ruleId}`);
        throw new HttpException(
          `Failed to update rule ${ruleId}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return response.data.rule;
    } catch (error) {
      return this.handleError(error, 'updateRule');
    }
  }

  async getActiveNetworkMap(token: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.adminServiceUrl}/v1/admin/network-map/active`,
          {
            headers: {
              Authorization: token.startsWith('Bearer ')
                ? token
                : `Bearer ${token}`,
            },
          },
        ),
      );

      if (!response.data?.networkMap) {
        this.logger.warn(
          'No active network map found in admin-service response',
        );
        return null;
      }

      return response.data.networkMap;
    } catch (error) {
      return this.handleError(error, 'getActiveNetworkMap');
    }
  }

  async getConfigPayloadByTxTp(
    transactionType: string,
    token: string,
  ): Promise<any> {
    try {
      this.logger.log(
        `Fetching config payload for transaction type: ${transactionType}`,
      );

      const response = await this.forwardRequest(
        'GET',
        `/v1/admin/config/payload/${encodeURIComponent(transactionType)}`,
        undefined,
        {
          Authorization: token.startsWith('Bearer ')
            ? token
            : `Bearer ${token}`,
        },
      );

      if (!response) {
        this.logger.warn(
          `No config payload found for transaction type: ${transactionType}`,
        );
        return null;
      }

      this.logger.log(
        `Successfully retrieved config payload for: ${transactionType}`,
      );
      return response;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error fetching config payload for ${transactionType}: ${err.message}`,
      );
      return this.handleError(error, 'getConfigPayloadByTxTp');
    }
  }

  async getConfigRowByTxTp(
    transactionType: string,
    token: string,
  ): Promise<any> {
    try {
      this.logger.log(
        `Fetching full config for transaction type: ${transactionType} in MMGMT`,
      );

      // go here and find out whats wrong
      const response = await this.forwardRequest(
        'GET',
        `/v1/admin/config/${encodeURIComponent(transactionType)}`,
        undefined,
        {
          Authorization: token.startsWith('Bearer ')
            ? token
            : `Bearer ${token}`,
        },
      );

      console.log('the response from get config row by tx tp is', response);

      if (!response) {
        this.logger.warn(
          `No config found for transaction type: ${transactionType}`,
        );
        return null;
      }

      this.logger.log(
        `Successfully retrieved full config for: ${transactionType}`,
      );
      return response;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error fetching schema from DB for ${transactionType}: ${err.message}`,
      );
      return this.handleError(error, 'getConfigRowByTxTp');
    }
  }

  async cloneRule(ruleId: string, token: string): Promise<Rules> {
    try {
      const response = await this.forwardRequest(
        'POST',
        `/v1/admin/trs/rule/clone/${ruleId}`,
        null,
        {
          Authorization: token.startsWith('Bearer ')
            ? token
            : `Bearer ${token}`,
        },
      );

      if (!response || typeof response !== 'object' || !('rule' in response)) {
        this.logger.error('Invalid response from admin-service cloneRule');
        throw new HttpException(
          'Invalid response from admin service',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return (response as { rule: Rules }).rule;
    } catch (error) {
      return this.handleError(error, 'cloneRule');
    }
  }

  // Nodes API
  /**
   *
   * @param token
   * @param createNodeDto list of nodes
   * @returns return a list of created nodes
   */
  async createNode(
    token: string,
    createNodeDto: CreateNodeDto[],
  ): Promise<ResponseNodesDto[]> {
    return (await this.forwardRequest(
      'POST',
      '/v1/admin/nodes/create',
      createNodeDto,
      {
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      },
    )) as ResponseNodesDto[];
  }

  /**
   *
   * @param token
   * @param query query parameters for filtering nodes (tenantId, type, category)
   * @returns return a list of nodes
   */
  async getAllNodes(
    token: string,
    query: GetNodesQuery,
  ): Promise<ResponseNodesDto[]> {
    try {

      const queryParams = new URLSearchParams();
      if (query.tenantId) {
        queryParams.append('tenantId', query.tenantId);
      }
      if (query.type) {
        queryParams.append('type', query.type);
      }
      if (query.category) {
        queryParams.append('category', query.category);
      }
      if (query.sortBy) {
        queryParams.append('sortBy', query.sortBy);
      }
      if (query.sortOrder) {
        queryParams.append('sortOrder', query.sortOrder);
      }
      const path = `/v1/admin/nodes?${queryParams.toString()}`;
      const response = await firstValueFrom(
        this.httpService.get(`${this.adminServiceUrl}${path}`, {
          headers: {
            Authorization: token.startsWith('Bearer ')
              ? token
              : `Bearer ${token}`,
          },
        }),
      );

      if (!response.data?.nodes) {
        this.logger.warn('No nodes found in admin-service response');
        return [];
      }
      return response.data.nodes;
    } catch (error) {
      return this.handleError(error, 'getAllNodes');
    }
  }

  async deleteNodeByNodeId(
    nodeId: string,
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.delete(
          `${this.adminServiceUrl}/v1/admin/nodes/${nodeId}`,
          {
            headers: {
              Authorization: token.startsWith('Bearer ')
                ? token
                : `Bearer ${token}`,
            },
          },
        ),
      );

      if (!response.data) {
        this.logger.error(`No response data after deleting node ${nodeId}`);
        throw new HttpException(
          `Failed to delete node ${nodeId}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      return response.data;
    } catch (error) {
      return this.handleError(error, 'deleteNodeByNodeId');
    }
  }

  async createRuleFlow(
    ruleId: string,
    flowData: Record<string, unknown>,
    token: string,
  ): Promise<ResponseRuleFlowDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.adminServiceUrl}/v1/admin/trs/rule-flow/${ruleId}`,
          flowData,
          {
            headers: {
              Authorization: token.startsWith('Bearer ')
                ? token
                : `Bearer ${token}`,
            },
          },
        ),
      );
      if (!response.data) {
        this.logger.error(
          `No response data after creating flow for rule ${ruleId}`,
        );
        throw new HttpException(
          `Failed to create flow for rule ${ruleId}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      return response.data;
    } catch (error) {
      return this.handleError(error, 'createRuleFlow');
    }
  }

  async getRuleFlow(
    ruleId: string,
    token: string,
  ): Promise<ResponseRuleFlowDto> {
    return await this.executeHttpRequest<ResponseRuleFlowDto>(
      'GET',
      `${RULE_FLOW}/${ruleId}`,
      token,
    );
  }

  async updateRuleFlow(
    ruleId: string,
    payload: RequestSaveFlow,
    token: string,
  ): Promise<ResponseRuleFlowDto> {
    return await this.executeHttpRequest<ResponseRuleFlowDto>(
      'PUT',
      `${RULE_FLOW}/${ruleId}`,
      token,
      payload,
    );
  }

  async getGlobalVariables(
    ruleId: string,
    tenantId: string,
    token: string,
  ): Promise<GlobalVariableDto> {
    return await this.executeHttpRequest<GlobalVariableDto>(
      'GET',
      `${GLOBAL_VARIABLES}/${ruleId}/${tenantId}`,
      token,
    );
  }

  async updateRuleStatus(
    ruleId: string,
    status: string,
    reason: string,
    token: string,
  ): Promise<Rules> {
    try {
      const response = await firstValueFrom(
        this.httpService.put(
          `${this.adminServiceUrl}/v1/admin/trs/rule/updateStatus/${ruleId}`,
          { status, reason },
          {
            headers: {
              Authorization: token.startsWith('Bearer ')
                ? token
                : `Bearer ${token}`,
            },
          },
        ),
      );

      if (!response.data?.rule) {
        this.logger.error(`No rule returned after update for ${ruleId}`);
        throw new HttpException(
          `Failed to update rule ${ruleId}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return response.data.rule;
    } catch (error) {
      return this.handleError(error, 'updateRuleStatus');
    }
  }

  async executeQueryNode(
    token: string,
    data: RequestQueryNodeDto,
  ): Promise<ResponseQueryNodeDto> {
    const response = await this.executeHttpRequest(
      'POST',
      `${NODES}/query`,
      token,
      { query: data.query, params: data.params },
    );

    return response as ResponseQueryNodeDto;
  }
}
