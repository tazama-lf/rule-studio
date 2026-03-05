import { ConfigController } from '../../src/services/config/config.controller';
import { ConfigService } from '../../src/services/config/config.service';
import type { AuthenticatedUser } from '../../src/services/auth/auth.types';

describe('ConfigController wiring', () => {
  const mockConfigService = {
    getTransactionTypes: jest.fn(),
    getVersionsOfTransactionType: jest.fn(),
    getPayloadByTransactionType: jest.fn(),
  } as unknown as jest.Mocked<ConfigService>;

  const controller = new ConfigController(mockConfigService);

  const user = {
    token: { tokenString: 'test-token', tenantId: 'tenant-1' },
  } as unknown as AuthenticatedUser;

  beforeEach(() => jest.clearAllMocks());

  it('getTransactionTypes passes endpointKey', async () => {
    (mockConfigService.getTransactionTypes as jest.Mock).mockResolvedValue([]);

    await controller.getTransactionTypes(user);

    expect(mockConfigService.getTransactionTypes).toHaveBeenCalledWith(
      user,
      'GET /config/api/transaction-types',
    );
  });

  it('getVersionsByTransactionType passes endpointKey', async () => {
    (mockConfigService.getVersionsOfTransactionType as jest.Mock).mockResolvedValue([]);

    await controller.getVersionsByTransactionType('pain.001.001.11', user);

    expect(mockConfigService.getVersionsOfTransactionType).toHaveBeenCalledWith(
      'pain.001.001.11',
      user,
      'GET /config/api/versions/:transactionType',
    );
  });

  it('getPayloadByTransactionType passes endpointKey and augments response', async () => {
    (mockConfigService.getPayloadByTransactionType as jest.Mock).mockResolvedValue({ schema: {} });

    const result = await controller.getPayloadByTransactionType('pain.001.001.11', '11', user);

    expect(mockConfigService.getPayloadByTransactionType).toHaveBeenCalledWith(
      'pain.001.001.11',
      '11',
      user,
      'GET /config/api/payload/:transactionType/:transactionVersion',
    );
    expect(result).toEqual({
      schema: {},
      TxTp: 'pain.001.001.11',
      TenantId: 'tenant-1',
    });
  });
});
