import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '../../src/services/config/config.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import { makeAuthenticatedUser } from '../helpers/rbac/user.factory';

describe('ConfigService RBAC', () => {
  let service: ConfigService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;

  const makeUser = makeAuthenticatedUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: AdminServiceClient,
          useValue: {
            getTransactionTypes: jest.fn(),
            getPayloadByTransactionType: jest.fn(),
            getVersionsOfTransactionType: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
    adminServiceClient = module.get(AdminServiceClient);
  });

  afterEach(() => jest.restoreAllMocks());

  it('covers GET /config/api/transaction-types', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;
    const tier2Spy = jest
      .spyOn(rbacService, 'getTier2')
      .mockReturnValue({ allowed: true, allowedStatuses: [] });
    adminServiceClient.getTransactionTypes.mockResolvedValue(['pain.001.001.11']);

    await service.getTransactionTypes(user, 'GET /config/api/transaction-types');

    expect(tier2Spy).toHaveBeenCalledWith({
      role: 'editor',
      endpointKey: 'GET /config/api/transaction-types',
    });
  });

  it('covers GET /config/api/versions/:transactionType', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;
    const tier2Spy = jest
      .spyOn(rbacService, 'getTier2')
      .mockReturnValue({ allowed: true, allowedStatuses: [] });
    adminServiceClient.getVersionsOfTransactionType.mockResolvedValue(['11']);

    await service.getVersionsOfTransactionType(
      'pain.001.001.11',
      user,
      'GET /config/api/versions/:transactionType',
    );

    expect(tier2Spy).toHaveBeenCalledWith({
      role: 'editor',
      endpointKey: 'GET /config/api/versions/:transactionType',
    });
  });

  it('covers GET /config/api/payload/:transactionType', async () => {
    const user = makeUser('editor');
    const rbacService = (service as any).rbacService;
    const tier2Spy = jest
      .spyOn(rbacService, 'getTier2')
      .mockReturnValue({ allowed: true, allowedStatuses: [] });
    adminServiceClient.getPayloadByTransactionType.mockResolvedValue({} as any);

    await service.getPayloadByTransactionType(
      'pain.001.001.11',
      user,
      'GET /config/api/payload/:transactionType',
    );

    expect(tier2Spy).toHaveBeenCalledWith({
      role: 'editor',
      endpointKey: 'GET /config/api/payload/:transactionType',
    });
  });

  it('denies invalid role before admin call', async () => {
    const user = makeUser('guest');

    await expect(
      service.getTransactionTypes(user, 'GET /config/api/transaction-types'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(adminServiceClient.getTransactionTypes).not.toHaveBeenCalled();
  });
});
