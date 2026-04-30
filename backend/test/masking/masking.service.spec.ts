import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MaskingService } from '../../src/services/masking/masking.service';
import { AdminServiceClient } from '../../src/services/admin-service-client';
import { makeAuthenticatedUser } from '../helpers/rbac/user.factory';
import { CreateMaskDto } from '../../src/services/masking/dto/mask.dto';

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
        maskingWithoutVersion,
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
});
