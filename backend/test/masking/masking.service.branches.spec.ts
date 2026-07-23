import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { MaskingService } from '../../src/services/masking/masking.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import { makeAuthenticatedUser } from '../helpers/rbac/user.factory';
import type { MaskingFiltersDto } from '../../src/services/masking/dto/masking.dto';

describe('MaskingService - branch coverage (lines 31-32)', () => {
  let service: MaskingService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaskingService,
        {
          provide: AdminServiceClient,
          useValue: {
            getAllMaskWithFilters: jest.fn(),
            getMaskById: jest.fn(),
            createMask: jest.fn(),
            updateMask: jest.fn(),
            reviewMask: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MaskingService>(MaskingService);
    adminServiceClient = module.get(AdminServiceClient);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('getAllMask - allowedStatuses branch (lines 31-32)', () => {
    const allowedStatuses = ['STATUS_01_IN_PROGRESS', 'STATUS_03_UNDER_REVIEW'];

    it('line 31: uses filters.status when it IS in allowedStatuses', async () => {
      const user = makeAuthenticatedUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({
        allowed: true,
        allowedStatuses,
      });
      adminServiceClient.getAllMaskWithFilters.mockResolvedValue({ masks: [], total: 0 } as any);

      const filters: MaskingFiltersDto = { status: 'STATUS_01_IN_PROGRESS' };
      await service.getAllMask(0, 10, filters, user);

      expect(adminServiceClient.getAllMaskWithFilters).toHaveBeenCalledWith(
        0, 10, expect.objectContaining({ status: 'STATUS_01_IN_PROGRESS' }), 'test-token',
      );
    });

    it('line 32: uses joined allowedStatuses when filters.status is NOT in allowedStatuses', async () => {
      const user = makeAuthenticatedUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({
        allowed: true,
        allowedStatuses,
      });
      adminServiceClient.getAllMaskWithFilters.mockResolvedValue({ masks: [], total: 0 } as any);

      const filters: MaskingFiltersDto = { status: 'STATUS_08_DEPLOYED' }; // NOT in allowedStatuses
      await service.getAllMask(0, 10, filters, user);

      expect(adminServiceClient.getAllMaskWithFilters).toHaveBeenCalledWith(
        0, 10, expect.objectContaining({ status: 'STATUS_01_IN_PROGRESS,STATUS_03_UNDER_REVIEW' }), 'test-token',
      );
    });

    it('line 32: uses joined allowedStatuses when filters has no status (undefined → falsy)', async () => {
      const user = makeAuthenticatedUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({
        allowed: true,
        allowedStatuses,
      });
      adminServiceClient.getAllMaskWithFilters.mockResolvedValue({ masks: [], total: 0 } as any);

      await service.getAllMask(0, 10, {} as MaskingFiltersDto, user);

      expect(adminServiceClient.getAllMaskWithFilters).toHaveBeenCalledWith(
        0, 10, expect.objectContaining({ status: 'STATUS_01_IN_PROGRESS,STATUS_03_UNDER_REVIEW' }), 'test-token',
      );
    });

    it('deletes status when allowedStatuses is empty', async () => {
      const user = makeAuthenticatedUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({
        allowed: true,
        allowedStatuses: [],
      });
      adminServiceClient.getAllMaskWithFilters.mockResolvedValue({ masks: [], total: 0 } as any);

      await service.getAllMask(0, 10, { status: 'STATUS_01_IN_PROGRESS' }, user);

      const callArgs = adminServiceClient.getAllMaskWithFilters.mock.calls[0][2] as any;
      expect(callArgs).not.toHaveProperty('status');
    });

    it('throws ForbiddenException without reason when tier2 has no reason', async () => {
      const user = makeAuthenticatedUser('editor');
      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'getTier2').mockReturnValue({ allowed: false });

      await expect(service.getAllMask(0, 10, {}, user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create - non-Error exception', () => {
    it('throws BadRequestException for duplicate key error', async () => {
      const user = makeAuthenticatedUser('editor');
      adminServiceClient.createMask.mockRejectedValue(new Error('duplicate key value violates unique constraint'));

      await expect(
        service.create({ txtp: 'pacs.002', txtpVersion: '1.0' } as any, user),
      ).rejects.toThrow('already exists');
    });

    it('rethrows non-duplicate errors', async () => {
      const user = makeAuthenticatedUser('editor');
      adminServiceClient.createMask.mockRejectedValue(new Error('upstream service error'));

      await expect(
        service.create({ txtp: 'pacs.002', txtpVersion: '1.0' } as any, user),
      ).rejects.toThrow('upstream service error');
    });
  });

  describe('updateMask - branch coverage', () => {
    it('skips tier3 check when no status change', async () => {
      const user = makeAuthenticatedUser('trs_data_engineer_editor');
      adminServiceClient.getMaskById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' });
      adminServiceClient.updateMask.mockResolvedValue({ id: 1, txtp: 'pacs.002' });

      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
      jest.spyOn(rbacService, 'checkTier3');

      await service.updateMask(1, {} as any, user);
      expect(rbacService.checkTier3).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when tier3 denies status transition', async () => {
      const user = makeAuthenticatedUser('trs_data_engineer_editor');
      adminServiceClient.getMaskById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' });

      const rbacService = (service as any).rbacService;
      jest.spyOn(rbacService, 'checkTier2').mockReturnValue({ allowed: true });
      jest.spyOn(rbacService, 'checkTier3').mockReturnValue({ allowed: false, reason: 'Tier3 denied' });

      await expect(
        service.updateMask(1, { status: 'STATUS_08_DEPLOYED' } as any, user),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
