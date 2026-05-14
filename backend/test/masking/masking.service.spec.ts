import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MaskingService } from '../../src/services/masking/masking.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import { makeAuthenticatedUser } from '../helpers/rbac/user.factory';
import { CreateMaskDto } from '../../src/services/masking/dto/mask.dto';
import type { MaskingFiltersDto, UpdateMaskDto, ReviewMaskDto } from '../../src/services/masking/dto/masking.dto';

describe('MaskingService', () => {
  let service: MaskingService;
  let adminServiceClient: jest.Mocked<AdminServiceClient>;

  const makeUser = makeAuthenticatedUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaskingService,
        {
          provide: AdminServiceClient,
          useValue: {
            createMask: jest.fn(),
            getAllMaskWithFilters: jest.fn(),
            getMaskById: jest.fn(),
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const maskingDto: CreateMaskDto = {
      txtp: 'pain.001.001.11',
      txtpVersion: '11',
    };

    const user = makeUser('editor');

    it('should successfully create a masking configuration', async () => {
      const expectedResponse = {
        success: true,
        message: 'Masking created successfully',
      };

      adminServiceClient.createMask.mockResolvedValue(expectedResponse);

      const result = await service.create(maskingDto, user);

      expect(adminServiceClient.createMask).toHaveBeenCalledWith(
        {
          txtp: 'pain.001.001.11',
          txtp_version: '11',
        },
        user.token.tokenString,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should pass the correct token to admin service client', async () => {
      const customUser = {
        ...makeUser('editor'),
        token: { tokenString: 'custom-token', tenantId: 'tenant-1' } as any,
      };

      adminServiceClient.createMask.mockResolvedValue({
        success: true,
        message: 'Success',
      });

      await service.create(maskingDto, customUser);

      expect(adminServiceClient.createMask).toHaveBeenCalledWith(
        {
          txtp: 'pain.001.001.11',
          txtp_version: '11',
        },
        'custom-token',
      );
    });

    it('should throw BadRequestException when duplicate key constraint is violated', async () => {
      const duplicateError = new Error(
        'duplicate key value violates unique constraint "masking_txtp_version_unique"',
      );

      adminServiceClient.createMask.mockRejectedValue(duplicateError);

      await expect(service.create(maskingDto, user)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.create(maskingDto, user)).rejects.toThrow(
        'A masking configuration with this type and version already exists. Please use a different type or version combination.',
      );
    });

    it('should throw BadRequestException with original error message for non-duplicate errors', async () => {
      const genericError = new Error('Database connection failed');

      adminServiceClient.createMask.mockRejectedValue(genericError);

      await expect(service.create(maskingDto, user)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.create(maskingDto, user)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle non-Error objects gracefully', async () => {
      const stringError = 'Something went wrong';

      adminServiceClient.createMask.mockRejectedValue(stringError);

      await expect(service.create(maskingDto, user)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.create(maskingDto, user)).rejects.toThrow(
        'Something went wrong',
      );
    });

    it('should log errors when creation fails', async () => {
      const error = new Error('Test error');
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      adminServiceClient.createMask.mockRejectedValue(error);

      await expect(service.create(maskingDto, user)).rejects.toThrow(
        BadRequestException,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        'Error While Creating Masking : Test error',
      );
    });

    it('should handle masking without version', async () => {
      const maskingWithoutVersion: CreateMaskDto = {
        txtp: 'pain.001.001.11',
      };

      const expectedResponse = {
        success: true,
        message: 'Masking created successfully',
      };

      adminServiceClient.createMask.mockResolvedValue(expectedResponse);

      const result = await service.create(maskingWithoutVersion, user);

      expect(adminServiceClient.createMask).toHaveBeenCalledWith(
        {
          txtp: maskingWithoutVersion.txtp,
          txtp_version: maskingWithoutVersion.txtpVersion,
        },
        user.token.tokenString,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle empty error message', async () => {
      const emptyError = new Error('');

      adminServiceClient.createMask.mockRejectedValue(emptyError);

      await expect(service.create(maskingDto, user)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should correctly identify duplicate key errors with different constraint names', async () => {
      const duplicateError = new Error(
        'Error: duplicate key value violates unique constraint',
      );

      adminServiceClient.createMask.mockRejectedValue(duplicateError);

      await expect(service.create(maskingDto, user)).rejects.toThrow(
        'A masking configuration with this type and version already exists. Please use a different type or version combination.',
      );
    });

    it('should handle null or undefined error objects', async () => {
      adminServiceClient.createMask.mockRejectedValue(null);

      await expect(service.create(maskingDto, user)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should pass through different transaction types', async () => {
      const differentMasking: CreateMaskDto = {
        txtp: 'pacs.008.001.10',
        txtpVersion: '10',
      };

      adminServiceClient.createMask.mockResolvedValue({
        success: true,
        message: 'Success',
      });

      await service.create(differentMasking, user);

      expect(adminServiceClient.createMask).toHaveBeenCalledWith(
        {
          txtp: 'pacs.008.001.10',
          txtp_version: '10',
        },
        user.token.tokenString,
      );
    });
  });

  // ─── getAllMask ────────────────────────────────────────────────────────────

  describe('getAllMask', () => {
    it('should throw ForbiddenException when role has no masking permissions', async () => {
      const user = makeUser('editor');
      await expect(service.getAllMask(0, 10, {}, user)).rejects.toThrow(ForbiddenException);
    });

    it('should set all allowed statuses joined when no status filter is provided', async () => {
      const user = makeUser('trs_data_engineer_editor');
      adminServiceClient.getAllMaskWithFilters.mockResolvedValue({ masks: [], total: 0 });

      await service.getAllMask(0, 10, {}, user);

      expect(adminServiceClient.getAllMaskWithFilters).toHaveBeenCalledWith(
        0,
        10,
        expect.objectContaining({
          status: 'STATUS_01_IN_PROGRESS,STATUS_03_UNDER_REVIEW,STATUS_04_APPROVED,STATUS_05_REJECTED',
        }),
        user.token.tokenString,
      );
    });

    it('should pass through status filter when it is within the allowed list', async () => {
      const user = makeUser('trs_data_engineer_editor');
      const filters: MaskingFiltersDto = { status: 'STATUS_01_IN_PROGRESS' };
      adminServiceClient.getAllMaskWithFilters.mockResolvedValue({ masks: [], total: 0 });

      await service.getAllMask(0, 10, filters, user);

      expect(adminServiceClient.getAllMaskWithFilters).toHaveBeenCalledWith(
        0,
        10,
        expect.objectContaining({ status: 'STATUS_01_IN_PROGRESS' }),
        user.token.tokenString,
      );
    });

    it('should override with all allowed statuses when requested status is outside allowed list', async () => {
      const user = makeUser('trs_data_engineer_editor');
      const filters: MaskingFiltersDto = { status: 'STATUS_08_DEPLOYED' };
      adminServiceClient.getAllMaskWithFilters.mockResolvedValue({ masks: [], total: 0 });

      await service.getAllMask(0, 10, filters, user);

      expect(adminServiceClient.getAllMaskWithFilters).toHaveBeenCalledWith(
        0,
        10,
        expect.objectContaining({
          status: 'STATUS_01_IN_PROGRESS,STATUS_03_UNDER_REVIEW,STATUS_04_APPROVED,STATUS_05_REJECTED',
        }),
        user.token.tokenString,
      );
    });

    it('should restrict approver to only their allowed statuses', async () => {
      const user = makeUser('trs_data_engineer_approver');
      adminServiceClient.getAllMaskWithFilters.mockResolvedValue({ masks: [], total: 0 });

      await service.getAllMask(0, 10, {}, user);

      expect(adminServiceClient.getAllMaskWithFilters).toHaveBeenCalledWith(
        0,
        10,
        expect.objectContaining({ status: 'STATUS_03_UNDER_REVIEW,STATUS_04_APPROVED' }),
        user.token.tokenString,
      );
    });

    it('should return the result from adminServiceClient', async () => {
      const user = makeUser('trs_data_engineer_editor');
      const mockResponse = { masks: [{ id: '1', txtp: 'pain.001', status: 'STATUS_01_IN_PROGRESS' }], total: 1 };
      adminServiceClient.getAllMaskWithFilters.mockResolvedValue(mockResponse as any);

      const result = await service.getAllMask(0, 10, {}, user);

      expect(result).toEqual(mockResponse);
    });
  });

  // ─── getMaskById ──────────────────────────────────────────────────────────

  describe('getMaskById', () => {
    it('should return the mask when role has access to the current status', async () => {
      const user = makeUser('trs_data_engineer_editor');
      const mockMask = { id: 1, txtp: 'pain.001', status: 'STATUS_01_IN_PROGRESS' };
      adminServiceClient.getMaskById.mockResolvedValue(mockMask);

      const result = await service.getMaskById(1, user);

      expect(result).toEqual(mockMask);
      expect(adminServiceClient.getMaskById).toHaveBeenCalledWith(1, user.token.tokenString);
    });

    it('should throw ForbiddenException when approver tries to access STATUS_01_IN_PROGRESS', async () => {
      const user = makeUser('trs_data_engineer_approver');
      adminServiceClient.getMaskById.mockResolvedValue({ id: 1, status: 'STATUS_01_IN_PROGRESS' });

      await expect(service.getMaskById(1, user)).rejects.toThrow(ForbiddenException);
    });

    it('should allow approver to access STATUS_03_UNDER_REVIEW', async () => {
      const user = makeUser('trs_data_engineer_approver');
      const mockMask = { id: 1, txtp: 'pain.001', status: 'STATUS_03_UNDER_REVIEW' };
      adminServiceClient.getMaskById.mockResolvedValue(mockMask);

      const result = await service.getMaskById(1, user);

      expect(result).toEqual(mockMask);
    });

    it('should log and rethrow error on failure', async () => {
      const user = makeUser('trs_data_engineer_editor');
      const error = new Error('DB connection failed');
      adminServiceClient.getMaskById.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.getMaskById(1, user)).rejects.toThrow('DB connection failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error While Getting Masking By Id : DB connection failed');
    });
  });

  // ─── updateMask ───────────────────────────────────────────────────────────

  describe('updateMask', () => {
    const maskInProgress = { id: 1, txtp: 'pain.001', status: 'STATUS_01_IN_PROGRESS' };

    it('should throw ForbiddenException when approver tries to update STATUS_01_IN_PROGRESS', async () => {
      const user = makeUser('trs_data_engineer_approver');
      adminServiceClient.getMaskById.mockResolvedValue(maskInProgress);

      await expect(service.updateMask(1, { txtp: 'pacs.008' } as UpdateMaskDto, user)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException on disallowed status transition', async () => {
      const user = makeUser('trs_data_engineer_editor');
      adminServiceClient.getMaskById.mockResolvedValue(maskInProgress);

      // editor can only go STATUS_01_IN_PROGRESS → STATUS_03_UNDER_REVIEW
      await expect(
        service.updateMask(1, { status: 'STATUS_04_APPROVED' } as UpdateMaskDto, user),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should successfully update without status change', async () => {
      const user = makeUser('trs_data_engineer_editor');
      const updated = { ...maskInProgress, txtp: 'pacs.008' };
      adminServiceClient.getMaskById.mockResolvedValue(maskInProgress);
      adminServiceClient.updateMask.mockResolvedValue(updated);

      const result = await service.updateMask(1, { txtp: 'pacs.008' } as UpdateMaskDto, user);

      expect(result).toEqual(updated);
      expect(adminServiceClient.updateMask).toHaveBeenCalledWith(1, { txtp: 'pacs.008' }, user.token.tokenString);
    });

    it('should successfully update with an allowed status transition', async () => {
      const user = makeUser('trs_data_engineer_editor');
      const updated = { ...maskInProgress, status: 'STATUS_03_UNDER_REVIEW' };
      adminServiceClient.getMaskById.mockResolvedValue(maskInProgress);
      adminServiceClient.updateMask.mockResolvedValue(updated);

      const result = await service.updateMask(
        1,
        { status: 'STATUS_03_UNDER_REVIEW' } as UpdateMaskDto,
        user,
      );

      expect(result).toEqual(updated);
    });

    it('should allow approver to update a STATUS_03_UNDER_REVIEW mask', async () => {
      const user = makeUser('trs_data_engineer_approver');
      const maskUnderReview = { id: 1, txtp: 'pain.001', status: 'STATUS_03_UNDER_REVIEW' };
      const updated = { ...maskUnderReview, status: 'STATUS_04_APPROVED' };
      adminServiceClient.getMaskById.mockResolvedValue(maskUnderReview);
      adminServiceClient.updateMask.mockResolvedValue(updated);

      const result = await service.updateMask(
        1,
        { status: 'STATUS_04_APPROVED' } as UpdateMaskDto,
        user,
      );

      expect(result).toEqual(updated);
    });

    it('should log and rethrow error on failure', async () => {
      const user = makeUser('trs_data_engineer_editor');
      const error = new Error('Update failed');
      adminServiceClient.getMaskById.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.updateMask(1, { txtp: 'pacs.008' } as UpdateMaskDto, user)).rejects.toThrow('Update failed');
      expect(loggerSpy).toHaveBeenCalledWith('Error While Updating Masking : Update failed');
    });
  });

  // ─── reviewMask ───────────────────────────────────────────────────────────

  describe('reviewMask', () => {
    const maskUnderReview = { id: 1, txtp: 'pain.001', status: 'STATUS_03_UNDER_REVIEW' };

    it('should throw ForbiddenException when editor tries to review', async () => {
      const user = makeUser('trs_data_engineer_editor');
      adminServiceClient.getMaskById.mockResolvedValue(maskUnderReview);

      await expect(service.reviewMask(1, { action: 'approve' } as ReviewMaskDto, user)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when rejecting without a comment', async () => {
      const user = makeUser('trs_data_engineer_approver');
      adminServiceClient.getMaskById.mockResolvedValue(maskUnderReview);

      await expect(
        service.reviewMask(1, { action: 'reject' } as ReviewMaskDto, user),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.reviewMask(1, { action: 'reject' } as ReviewMaskDto, user),
      ).rejects.toThrow('A comment is required when rejecting a masking configuration');
    });

    it('should throw BadRequestException when rejecting with a blank comment', async () => {
      const user = makeUser('trs_data_engineer_approver');
      adminServiceClient.getMaskById.mockResolvedValue(maskUnderReview);

      await expect(
        service.reviewMask(1, { action: 'reject', comments: '   ' } as ReviewMaskDto, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully approve a masking configuration', async () => {
      const user = makeUser('trs_data_engineer_approver');
      const approved = { ...maskUnderReview, status: 'STATUS_04_APPROVED' };
      adminServiceClient.getMaskById.mockResolvedValue(maskUnderReview);
      adminServiceClient.reviewMask.mockResolvedValue(approved);

      const result = await service.reviewMask(1, { action: 'approve' } as ReviewMaskDto, user);

      expect(result).toEqual(approved);
      expect(adminServiceClient.reviewMask).toHaveBeenCalledWith(1, 'approve', undefined, user.token.tokenString);
    });

    it('should successfully reject a masking configuration with a comment', async () => {
      const user = makeUser('trs_data_engineer_approver');
      const rejected = { ...maskUnderReview, status: 'STATUS_05_REJECTED' };
      adminServiceClient.getMaskById.mockResolvedValue(maskUnderReview);
      adminServiceClient.reviewMask.mockResolvedValue(rejected);

      const result = await service.reviewMask(
        1,
        { action: 'reject', comments: 'Needs revision' } as ReviewMaskDto,
        user,
      );

      expect(result).toEqual(rejected);
      expect(adminServiceClient.reviewMask).toHaveBeenCalledWith(1, 'reject', 'Needs revision', user.token.tokenString);
    });

    it('should log and rethrow error on failure', async () => {
      const user = makeUser('trs_data_engineer_approver');
      const error = new Error('Review service down');
      adminServiceClient.getMaskById.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(service.reviewMask(1, { action: 'approve' } as ReviewMaskDto, user)).rejects.toThrow('Review service down');
      expect(loggerSpy).toHaveBeenCalledWith('Error While Reviewing Masking : Review service down');
    });
  });
});
