import { ParseExtractController } from '../../src/services/parse-extract/parse-extract.controller';
import { ParseExtractService } from '../../src/services/parse-extract/parse-extract.service';
import type { AuthenticatedUser } from '../../src/services/auth/auth.types';

describe('ParseExtractController wiring', () => {
  const mockParseExtractService = {
    processTransactionalMessage: jest.fn(),
  } as unknown as jest.Mocked<ParseExtractService>;

  const controller = new ParseExtractController(mockParseExtractService);

  const user = {
    token: { tokenString: 'test-token', tenantId: 'tenant-1' },
  } as unknown as AuthenticatedUser;

  beforeEach(() => jest.clearAllMocks());

  it('processTransactionalMessage passes endpointKey', async () => {
    (mockParseExtractService.processTransactionalMessage as jest.Mock).mockResolvedValue({ validatedMessage: {} });

    await controller.processTransactionalMessage(
      { TxTp: 'pacs.008.001.10', TenantId: 'tenant-1' } as any,
      user,
    );

    expect(mockParseExtractService.processTransactionalMessage).toHaveBeenCalledWith(
      { TxTp: 'pacs.008.001.10', TenantId: 'tenant-1' },
      user,
      'POST /parse/api/validatePayload',
    );
  });
});
