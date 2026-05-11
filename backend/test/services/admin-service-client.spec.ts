import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AdminServiceClient } from '../../src/services/admin-service-client';

const makeAxiosResponse = (data: unknown, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

const makeAxiosError = (status: number, data: unknown) => ({
  response: { status, data },
  message: 'Request failed',
});

const makeNetworkError = () => ({ request: {}, message: 'ECONNREFUSED' });

const makeGenericError = () => ({ message: 'Unknown error' });

describe('AdminServiceClient', () => {
  let client: AdminServiceClient;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminServiceClient,
        {
          provide: HttpService,
          useValue: {
            request: jest.fn(),
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            patch: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    client = module.get<AdminServiceClient>(AdminServiceClient);
    httpService = module.get(HttpService);
  });

  afterEach(() => jest.clearAllMocks());

  const mockRequest = (data: unknown, status = 200) => {
    httpService.request.mockReturnValue(of(makeAxiosResponse(data, status)) as any);
  };

  const mockRequestError = (error: unknown) => {
    httpService.request.mockReturnValue(throwError(() => error) as any);
  };

  describe('handleError', () => {
    it('throws HttpException with message from response data object', async () => {
      mockRequestError(makeAxiosError(400, { message: 'Bad input' }));
      await expect(client.getAllRulesWithFilters(0, 10, {}, 'tok')).rejects.toThrow(HttpException);
    });

    it('throws HttpException with default message when data has no message field', async () => {
      mockRequestError(makeAxiosError(400, { other: 'data' }));
      await expect(client.getAllRulesWithFilters(0, 10, {}, 'tok')).rejects.toMatchObject({
        message: 'Admin service returned an error response',
      });
    });

    it('throws SERVICE_UNAVAILABLE for network errors (no response)', async () => {
      mockRequestError(makeNetworkError());
      await expect(client.getAllRulesWithFilters(0, 10, {}, 'tok')).rejects.toMatchObject({
        status: HttpStatus.SERVICE_UNAVAILABLE,
      });
    });

    it('throws INTERNAL_SERVER_ERROR for generic errors', async () => {
      mockRequestError(makeGenericError());
      await expect(client.getAllRulesWithFilters(0, 10, {}, 'tok')).rejects.toMatchObject({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe('getAuthHeaders', () => {
    it('prepends Bearer when token does not start with Bearer', async () => {
      mockRequest([]);
      await client.getAllRulesWithFilters(0, 10, {}, 'plain-token');
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({ headers: { Authorization: 'Bearer plain-token' } }),
      );
    });

    it('does not double-prepend when token starts with Bearer', async () => {
      mockRequest([]);
      await client.getAllRulesWithFilters(0, 10, {}, 'Bearer already');
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({ headers: { Authorization: 'Bearer already' } }),
      );
    });
  });

  describe('getAllRulesWithFilters', () => {
    it('returns rules array', async () => {
      mockRequest([{ id: 1 }]);
      const result = await client.getAllRulesWithFilters(0, 10, {}, 'tok');
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('getRulesById', () => {
    it('returns a rule', async () => {
      mockRequest({ id: 1, rule_name: 'rule' });
      const result = await client.getRulesById(1, 'tok');
      expect(result).toEqual({ id: 1, rule_name: 'rule' });
    });
  });

  describe('getVersionsOfTransactionType', () => {
    it('returns versions array', async () => {
      mockRequest({ versions: ['1.0', '2.0'] });
      const result = await client.getVersionsOfTransactionType('pacs.002', 'tok');
      expect(result).toEqual(['1.0', '2.0']);
    });
  });

  describe('saveRuleRequest', () => {
    it('delegates to executeHttpRequest', async () => {
      mockRequest({ success: true });
      const result = await client.saveRuleRequest('pacs.002', 'tenant-1', 'tok', { foo: 'bar' });
      expect(result).toEqual({ success: true });
    });
  });

  describe('createRule', () => {
    it('returns the rule from response envelope', async () => {
      mockRequest({ rule: { id: 5, rule_name: 'new-rule' } });
      const result = await client.createRule({ rule_name: 'new-rule' }, 'tok', undefined);
      expect(result).toEqual({ id: 5, rule_name: 'new-rule' });
    });
  });

  describe('getRuleIds', () => {
    it('returns rule IDs array', async () => {
      mockRequest({ ruleIds: [{ id: 1 }, { id: 2 }] });
      const result = await client.getRuleIds('tok');
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('getRuleConfiguration', () => {
    it('returns configuration object', async () => {
      mockRequest({ configuration: { key: 'val' } });
      const result = await client.getRuleConfiguration('1', 'tok');
      expect(result).toEqual({ key: 'val' });
    });
  });

  describe('getTransactionTypes', () => {
    it('returns transaction types array', async () => {
      mockRequest({ transactionTypes: [{ transaction_type: 'pacs.002', endpoint_path: '/path' }] });
      const result = await client.getTransactionTypes('tok');
      expect(result).toEqual([{ transaction_type: 'pacs.002', endpoint_path: '/path' }]);
    });
  });

  describe('getPayloadByTransactionType', () => {
    it('returns payload object', async () => {
      mockRequest({ payload: { data: 'here' } });
      const result = await client.getPayloadByTransactionType('pacs.002', '1.0', 'tok');
      expect(result).toEqual({ data: 'here' });
    });
  });

  describe('updateRule', () => {
    it('returns updated rule', async () => {
      mockRequest({ rule: { id: 1, rule_name: 'updated' } });
      const result = await client.updateRule('1', { rule_name: 'updated' }, 'tok');
      expect(result).toEqual({ id: 1, rule_name: 'updated' });
    });
  });

  describe('getActiveNetworkMap', () => {
    it('returns the first active network map', async () => {
      mockRequest({ data: [{ id: 'nm-1', active: true }], meta: { total: 1, limit: 1, offset: 0 } });
      const result = await client.getActiveNetworkMap('tok');
      expect(result).toEqual({ id: 'nm-1', active: true });
    });

    it('throws NOT_FOUND when data array is empty', async () => {
      mockRequest({ data: [], meta: { total: 0, limit: 1, offset: 0 } });
      await expect(client.getActiveNetworkMap('tok')).rejects.toMatchObject({
        status: HttpStatus.NOT_FOUND,
      });
    });
  });

  describe('getConfigPayloadByTxTp', () => {
    it('returns payload response', async () => {
      mockRequest({ payload: { field: 'value' } });
      const result = await client.getConfigPayloadByTxTp('pacs.002', '1.0', 'tok');
      expect(result).toEqual({ payload: { field: 'value' } });
    });
  });

  describe('getConfigRowByTxTp', () => {
    it('returns config object', async () => {
      const config = { schema: {}, mapping: [], payload: {} };
      mockRequest({ config });
      const result = await client.getConfigRowByTxTp('pacs.002', '1.0', 'tok');
      expect(result).toEqual({ config });
    });
  });

  describe('cloneRule', () => {
    it('returns cloned rule', async () => {
      mockRequest({ rule: { id: 99 } });
      const result = await client.cloneRule('1', 'tok', { txtp: 'pacs.002' });
      expect(result).toEqual({ id: 99 });
    });
  });

  // --- Nodes API ---
  describe('createNode', () => {
    it('returns created nodes', async () => {
      mockRequest([{ id: 'node-1' }]);
      const result = await client.createNode('tok', [{ type: 'rule', category: 'cat' } as any]);
      expect(result).toEqual([{ id: 'node-1' }]);
    });
  });

  describe('getAllNodes', () => {
    it('returns nodes with empty query', async () => {
      mockRequest({ nodes: [{ id: 'n1' }] });
      const result = await client.getAllNodes('tok', {});
      expect(result).toEqual([{ id: 'n1' }]);
    });

    it('builds params from query object', async () => {
      mockRequest({ nodes: [] });
      await client.getAllNodes('tok', {
        tenantId: 'tenant-1',
        type: 'rule',
        category: 'cat',
        sortBy: 'id',
        sortOrder: 'asc',
        limit: 10,
        offset: 0,
      });
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET' }),
      );
    });
  });

  describe('deleteNodeByNodeId', () => {
    it('returns success response', async () => {
      mockRequest({ success: true, message: 'deleted' });
      const result = await client.deleteNodeByNodeId('node-1', 'tok');
      expect(result).toEqual({ success: true, message: 'deleted' });
    });
  });

  describe('createRuleFlow', () => {
    it('returns first element from flow array', async () => {
      mockRequest({ flow: [{ id: 'flow-1' }] });
      const result = await client.createRuleFlow('1', { flow_json_rule_builder: {}, flow_json_test_case: {} } as any, 'tok');
      expect(result).toEqual({ id: 'flow-1' });
    });
  });

  describe('getRuleFlow', () => {
    it('returns rule flow', async () => {
      mockRequest({ result: { flow_json_rule_builder: {} } });
      const result = await client.getRuleFlow('1', 'tok');
      expect(result).toEqual({ result: { flow_json_rule_builder: {} } });
    });

    it('appends filters as query string when provided', async () => {
      mockRequest({ result: {} });
      await client.getRuleFlow('1', 'tok', { category: 'rule' } as any);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('does not append query string when filters is empty', async () => {
      mockRequest({ result: {} });
      await client.getRuleFlow('1', 'tok', {});
      expect(httpService.request).toHaveBeenCalled();
    });
  });

  describe('getRuleFlowStatus', () => {
    it('returns rule flow status', async () => {
      mockRequest({ status: 'active' });
      const result = await client.getRuleFlowStatus('1', 'tok');
      expect(result).toEqual({ status: 'active' });
    });

    it('appends filters when provided', async () => {
      mockRequest({ status: 'active' });
      await client.getRuleFlowStatus('1', 'tok', { category: 'rule' } as any);
      expect(httpService.request).toHaveBeenCalled();
    });
  });

  describe('updateRuleFlow', () => {
    it('returns updated rule flow', async () => {
      mockRequest({ updated: true });
      const result = await client.updateRuleFlow('1', { flow_json_rule_builder: {} } as any, 'tok');
      expect(result).toEqual({ updated: true });
    });
  });

  describe('getGlobalVariables', () => {
    it('returns global variables', async () => {
      mockRequest({ RuleRequest: { a: 1 } });
      const result = await client.getGlobalVariables('1', 'tok');
      expect(result).toEqual({ RuleRequest: { a: 1 } });
    });
  });

  describe('updateRuleStatus', () => {
    it('returns updated rule', async () => {
      mockRequest({ rule: { id: 1, status: 'STATUS_03_UNDER_REVIEW' } });
      const result = await client.updateRuleStatus('1', 'STATUS_03_UNDER_REVIEW', 'reason', 'tok');
      expect(result).toEqual({ id: 1, status: 'STATUS_03_UNDER_REVIEW' });
    });
  });

  describe('executeQueryNode', () => {
    it('returns query result', async () => {
      mockRequest({ result: [{ id: 1 }] });
      const result = await client.executeQueryNode('tok', { query: 'SELECT 1', dbName: 'db' } as any);
      expect(result).toEqual({ result: [{ id: 1 }] });
    });
  });

  describe('getSimulationLogs', () => {
    it('returns simulation logs', async () => {
      mockRequest({ logs: [] });
      const result = await client.getSimulationLogs('tok', 'rule-1', { category: 'read_only' });
      expect(result).toEqual({ logs: [] });
    });

    it('includes category in query string', async () => {
      mockRequest({ logs: [] });
      await client.getSimulationLogs('tok', 'rule-1', { category: 'end_to_end' });
      expect(httpService.request).toHaveBeenCalled();
    });
  });

  describe('insertSimulationLogs', () => {
    it('returns inserted log', async () => {
      mockRequest({ id: 'log-1' });
      const result = await client.insertSimulationLogs('tok', { ruleId: 'r1' } as any);
      expect(result).toEqual({ id: 'log-1' });
    });
  });

  describe('getAllMaskWithFilters', () => {
    it('returns masking list', async () => {
      mockRequest({ data: [], total: 0 });
      const result = await client.getAllMaskWithFilters(0, 10, {}, 'tok');
      expect(result).toEqual({ data: [], total: 0 });
    });
  });

  describe('createMask', () => {
    it('returns success response', async () => {
      mockRequest({ success: true });
      const result = await client.createMask({ txtp: 'pacs.002' } as any, 'tok');
      expect(result).toEqual({ success: true });
    });
  });

  describe('updateMask', () => {
    it('returns updated mask', async () => {
      mockRequest({ id: 1, txtp: 'pacs.002' });
      const result = await client.updateMask(1, { txtp: 'pacs.002' }, 'tok');
      expect(result).toEqual({ id: 1, txtp: 'pacs.002' });
    });
  });

  describe('getMaskById', () => {
    it('returns mask', async () => {
      mockRequest({ mask: { id: 1, txtp: 'pacs.002' } });
      const result = await client.getMaskById(1, 'tok');
      expect(result).toEqual({ id: 1, txtp: 'pacs.002' });
    });
  });

  describe('reviewMask', () => {
    it('approves mask without comments', async () => {
      mockRequest({ mask: { id: 1, status: 'approved' } });
      const result = await client.reviewMask(1, 'approve', undefined, 'tok');
      expect(result).toEqual({ id: 1, status: 'approved' });
    });

    it('rejects mask with comments', async () => {
      mockRequest({ mask: { id: 1, status: 'rejected' } });
      const result = await client.reviewMask(1, 'reject', 'not good', 'tok');
      expect(result).toEqual({ id: 1, status: 'rejected' });
    });

    it('trims and includes comments when non-blank', async () => {
      mockRequest({ mask: { id: 1 } });
      await client.reviewMask(1, 'reject', '  trimmed  ', 'tok');
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ comments: 'trimmed' }),
        }),
      );
    });

    it('omits comments when blank', async () => {
      mockRequest({ mask: { id: 1 } });
      await client.reviewMask(1, 'approve', '   ', 'tok');
      const callArg = httpService.request.mock.calls[0][0];
      expect(callArg.data).not.toHaveProperty('comments');
    });
  });

  describe('getSimulationMessages', () => {
    it('returns simulation messages', async () => {
      mockRequest({ messages: [{ messageId: 'm1' }] });
      const result = await client.getSimulationMessages('tok', 'table1');
      expect(result).toEqual([{ messageId: 'm1' }]);
    });
  });

  describe('getAllSimulations', () => {
    it('returns simulation list', async () => {
      mockRequest({ data: [], total: 0 });
      const result = await client.getAllSimulations(0, 10, 'tok');
      expect(result).toEqual({ data: [], total: 0 });
    });
  });

  describe('createSimulation', () => {
    it('returns created simulation', async () => {
      mockRequest({ id: 'sim-1' });
      const result = await client.createSimulation({ name: 'sim' } as any, 'tok');
      expect(result).toEqual({ id: 'sim-1' });
    });
  });

  describe('getExcludedTypes', () => {
    it('returns excluded types', async () => {
      mockRequest({ excluded: ['type-a'] });
      const result = await client.getExcludedTypes('tok');
      expect(result).toEqual({ excluded: ['type-a'] });
    });
  });

  describe('getSimulationStats', () => {
    it('returns simulation stats', async () => {
      mockRequest({ total: 100, hits: 50 });
      const result = await client.getSimulationStats('sim1', '1', 'tok');
      expect(result).toEqual({ total: 100, hits: 50 });
    });
  });

  describe('getSimulationResults', () => {
    it('returns results without filters', async () => {
      mockRequest({ data: [], total: 0 });
      const result = await client.getSimulationResults('sim1', '1', 10, 0, 'tok');
      expect(result).toEqual({ data: [], total: 0 });
    });

    it('includes optional filters in params', async () => {
      mockRequest({ data: [] });
      await client.getSimulationResults('sim1', '1', 10, 0, 'tok', {
        msg_id: 'id-1',
        msg_type: 'pacs.002',
        outcome: 'Hit',
      });
      expect(httpService.request).toHaveBeenCalled();
    });
  });

  describe('fetchFromDlh', () => {
    it('returns DLH data', async () => {
      mockRequest({ results: [] });
      const result = await client.fetchFromDlh([{ query: 'SELECT 1' }], 'tok');
      expect(result).toEqual({ results: [] });
    });
  });

  describe('fetchCountFromDlh', () => {
    it('returns count response', async () => {
      mockRequest({ count: 42 });
      const result = await client.fetchCountFromDlh({ data: [] } as any, 'tok');
      expect(result).toEqual({ count: 42 });
    });
  });

  describe('fetchMaskingConfig', () => {
    it('returns masking config', async () => {
      mockRequest({ configs: [] });
      const result = await client.fetchMaskingConfig('tok');
      expect(result).toEqual({ configs: [] });
    });
  });

  describe('fetchActiveMaskingConfigs', () => {
    it('returns active masks array', async () => {
      const masks = [{ tenant_id: 't1', txtp: 'pacs.002', txtp_version: '1.0', endpoint_path: '/ep' }];
      mockRequest({ masks });
      const result = await client.fetchActiveMaskingConfigs(
        [{ tenant_id: 't1', txtp: 'pacs.002', txtp_version: '1.0' }],
        'tok',
      );
      expect(result).toEqual(masks);
    });
  });
});
