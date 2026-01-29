import { Test, TestingModule } from '@nestjs/testing';
import { NodesService } from '../../src/services/nodes/nodes.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import {
  CreateNodeDto,
  RequestQueryNodeDto,
} from '../../src/services/nodes/dto';
import { GetNodesQuery } from '../../src/services/nodes/interfaces/node.interface';

// Mock AdminServiceClient
const mockAdminServiceClient = {
  createNode: jest.fn(),
  getAllNodes: jest.fn(),
  deleteNodeByNodeId: jest.fn(),
  executeQueryNode: jest.fn(),
};

describe('NodesService', () => {
  let service: NodesService;
  let adminServiceClient: AdminServiceClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodesService,
        {
          provide: AdminServiceClient,
          useValue: mockAdminServiceClient,
        },
      ],
    }).compile();

    service = module.get<NodesService>(NodesService);
    adminServiceClient = module.get<AdminServiceClient>(AdminServiceClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNode', () => {
    it('should successfully create a node', async () => {
      const token = 'test-token';
      const createNodeDto: CreateNodeDto[] = [
        {
          node_json: { name: 'test' },
          tenant_id: 'test-tenant',
          created_by: 'test-user',
          order: 1,
        },
      ];
      const expectedResult = [{ id: '1', ...createNodeDto[0] }];

      mockAdminServiceClient.createNode.mockResolvedValue(expectedResult);

      const result = await service.createNode(token, createNodeDto);

      expect(result).toEqual(expectedResult);
      expect(adminServiceClient.createNode).toHaveBeenCalledWith(
        token,
        createNodeDto,
      );
    });

    it('should throw an error if adminServiceClient fails', async () => {
      const token = 'test-token';
      const createNodeDto: CreateNodeDto[] = [];
      const error = new Error('Failed to create node');

      mockAdminServiceClient.createNode.mockRejectedValue(error);

      await expect(service.createNode(token, createNodeDto)).rejects.toThrow(
        error,
      );
    });
  });

  describe('getAllNodes', () => {
    it('should return all nodes', async () => {
      const token = 'test-token';
      const query: GetNodesQuery = { tenantId: 'test-tenant' };
      const expectedResult = [{ id: '1', node_json: { name: 'test' } }];

      mockAdminServiceClient.getAllNodes.mockResolvedValue(expectedResult);

      const result = await service.getAllNodes(token, query);

      expect(result).toEqual(expectedResult);
      expect(adminServiceClient.getAllNodes).toHaveBeenCalledWith(token, query);
    });

    it('should throw an error if adminServiceClient fails', async () => {
      const token = 'test-token';
      const query: GetNodesQuery = { tenantId: 'test-tenant' };
      const error = new Error('Failed to get nodes');

      mockAdminServiceClient.getAllNodes.mockRejectedValue(error);

      await expect(service.getAllNodes(token, query)).rejects.toThrow(error);
    });
  });

  describe('deleteNodeById', () => {
    it('should successfully delete a node', async () => {
      const nodeId = 'node-1';
      const token = 'test-token';
      const expectedResult = { success: true, message: 'Node deleted' };

      mockAdminServiceClient.deleteNodeByNodeId.mockResolvedValue(
        expectedResult,
      );

      const result = await service.deleteNodeById(nodeId, token);

      expect(result).toEqual(expectedResult);
      expect(adminServiceClient.deleteNodeByNodeId).toHaveBeenCalledWith(
        nodeId,
        token,
      );
    });

    it('should throw an error if adminServiceClient fails', async () => {
      const nodeId = 'node-1';
      const token = 'test-token';
      const error = new Error('Failed to delete node');

      mockAdminServiceClient.deleteNodeByNodeId.mockRejectedValue(error);

      await expect(service.deleteNodeById(nodeId, token)).rejects.toThrow(
        error,
      );
    });
  });

  describe('executeQueryNode', () => {
    it('should successfully execute a query', async () => {
      const token = 'test-token';
      const data: RequestQueryNodeDto = { query: 'SELECT * FROM users' };
      const expectedResult = { result: [{ id: 1, name: 'Test User' }] };

      mockAdminServiceClient.executeQueryNode.mockResolvedValue(expectedResult);

      const result = await service.executeQueryNode(token, data);

      expect(result).toEqual(expectedResult);
      expect(adminServiceClient.executeQueryNode).toHaveBeenCalledWith(
        token,
        data,
      );
    });

    it('should throw an error if adminServiceClient fails', async () => {
      const token = 'test-token';
      const data: RequestQueryNodeDto = { query: 'SELECT * FROM users' };
      const error = new Error('Failed to execute query');

      mockAdminServiceClient.executeQueryNode.mockRejectedValue(error);

      await expect(service.executeQueryNode(token, data)).rejects.toThrow(
        error,
      );
    });
  });
});
