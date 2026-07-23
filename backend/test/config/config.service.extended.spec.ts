import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '../../src/services/config/config.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import { makeAuthenticatedUser } from '../helpers/rbac/user.factory';

describe('ConfigService - extended coverage', () => {
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

  describe('getTransactionTypes', () => {
    const endpoint = 'GET /config/api/transaction-types' as any;

    it('returns transaction types for valid role', async () => {
      const user = makeUser('editor');
      const expected = [{ transaction_type: 'pacs.002', endpoint_path: '/path' }];
      adminServiceClient.getTransactionTypes.mockResolvedValue(expected as any);

      const result = await service.getTransactionTypes(user, endpoint);
      expect(result).toEqual(expected);
    });

    it('throws ForbiddenException for invalid role', async () => {
      const user = makeUser('guest');
      await expect(service.getTransactionTypes(user, endpoint)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when tier2 denies access', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({ allowed: false, reason: 'Denied' });

      await expect(service.getTransactionTypes(user, endpoint)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException without reason when tier2 has no reason', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({ allowed: false });

      await expect(service.getTransactionTypes(user, endpoint)).rejects.toThrow(ForbiddenException);
    });

    it('rethrows errors from adminServiceClient', async () => {
      const user = makeUser('editor');
      adminServiceClient.getTransactionTypes.mockRejectedValue(new Error('upstream error'));

      await expect(service.getTransactionTypes(user, endpoint)).rejects.toThrow('upstream error');
    });
  });

  describe('getPayloadByTransactionType', () => {
    const endpoint = 'GET /config/api/payload/:transactionType/:transactionVersion' as any;

    it('returns payload for valid role', async () => {
      const user = makeUser('editor');
      const payload = { data: 'here' };
      adminServiceClient.getPayloadByTransactionType.mockResolvedValue(payload);

      const result = await service.getPayloadByTransactionType('pacs.002', '1.0', user, endpoint);
      expect(result).toEqual(payload);
    });

    it('throws ForbiddenException for invalid role', async () => {
      const user = makeUser('guest');
      await expect(
        service.getPayloadByTransactionType('pacs.002', '1.0', user, endpoint),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when tier2 denies access', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({ allowed: false, reason: 'Denied' });

      await expect(
        service.getPayloadByTransactionType('pacs.002', '1.0', user, endpoint),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException without reason when tier2 has no reason', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({ allowed: false });

      await expect(
        service.getPayloadByTransactionType('pacs.002', '1.0', user, endpoint),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rethrows errors from adminServiceClient', async () => {
      const user = makeUser('editor');
      adminServiceClient.getPayloadByTransactionType.mockRejectedValue(new Error('payload error'));

      await expect(
        service.getPayloadByTransactionType('pacs.002', '1.0', user, endpoint),
      ).rejects.toThrow('payload error');
    });
  });

  describe('getVersionsOfTransactionType', () => {
    const endpoint = 'GET /config/api/versions/:transactionType' as any;

    it('returns versions for valid role', async () => {
      const user = makeUser('editor');
      adminServiceClient.getVersionsOfTransactionType.mockResolvedValue(['1.0', '2.0']);

      const result = await service.getVersionsOfTransactionType('pacs.002', user, endpoint);
      expect(result).toEqual(['1.0', '2.0']);
    });

    it('throws ForbiddenException for invalid role', async () => {
      const user = makeUser('guest');
      await expect(service.getVersionsOfTransactionType('pacs.002', user, endpoint)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when tier2 denies access', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({ allowed: false, reason: 'Denied' });

      await expect(service.getVersionsOfTransactionType('pacs.002', user, endpoint)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException without reason when tier2 has no reason', async () => {
      const user = makeUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({ allowed: false });

      await expect(service.getVersionsOfTransactionType('pacs.002', user, endpoint)).rejects.toThrow(ForbiddenException);
    });

    it('rethrows errors from adminServiceClient', async () => {
      const user = makeUser('editor');
      adminServiceClient.getVersionsOfTransactionType.mockRejectedValue(new Error('versions error'));

      await expect(service.getVersionsOfTransactionType('pacs.002', user, endpoint)).rejects.toThrow('versions error');
    });
  });
});
