import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantConfigService } from '../../../src/services/dockerhub/tenant-config.service';

const ORIGINAL_ENV = process.env;

describe('TenantConfigService', () => {
  let service: TenantConfigService;

  const buildModule = async (): Promise<TenantConfigService> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantConfigService],
    }).compile();
    return module.get<TenantConfigService>(TenantConfigService);
  };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.restoreAllMocks();
  });

  // ─── loadTenantConfigs (via onModuleInit) ────────────────────────────────────

  describe('onModuleInit / loadTenantConfigs', () => {
    it('registers a valid tenant and logs success', async () => {
      process.env = {
        CBE_TENANT_NAME: 'cbe',
        CBE_DOCKERHUB_TOKEN: 'tok123',
        CBE_DOCKERHUB_USERNAME: 'user1',
        CBE_DOCKERHUB_NAMESPACE: 'ns1',
      };

      service = await buildModule();
      service.onModuleInit();

      expect(service.getRegisteredTenants()).toContain('cbe');
    });

    it('registers multiple tenants from different prefixes', async () => {
      process.env = {
        CBE_TENANT_NAME: 'cbe',
        CBE_DOCKERHUB_TOKEN: 'tok1',
        CBE_DOCKERHUB_USERNAME: 'u1',
        CBE_DOCKERHUB_NAMESPACE: 'ns1',
        TENANT_001_TENANT_NAME: 'tenant_001',
        TENANT_001_DOCKERHUB_TOKEN: 'tok2',
        TENANT_001_DOCKERHUB_USERNAME: 'u2',
        TENANT_001_DOCKERHUB_NAMESPACE: 'ns2',
      };

      service = await buildModule();
      service.onModuleInit();

      const tenants = service.getRegisteredTenants();
      expect(tenants).toContain('cbe');
      expect(tenants).toContain('tenant_001');
    });

    it('skips a tenant whose TENANT_NAME value is empty', async () => {
      process.env = {
        EMPTY_TENANT_NAME: '   ',
        EMPTY_DOCKERHUB_TOKEN: 'tok',
        EMPTY_DOCKERHUB_USERNAME: 'u',
        EMPTY_DOCKERHUB_NAMESPACE: 'ns',
      };

      service = await buildModule();
      service.onModuleInit();

      expect(service.getRegisteredTenants()).toHaveLength(0);
    });

    it('skips a tenant missing DOCKERHUB_TOKEN', async () => {
      process.env = {
        BAD_TENANT_NAME: 'bad',
        BAD_DOCKERHUB_USERNAME: 'u',
        BAD_DOCKERHUB_NAMESPACE: 'ns',
      };

      service = await buildModule();
      service.onModuleInit();

      expect(service.getRegisteredTenants()).toHaveLength(0);
    });

    it('skips a tenant missing DOCKERHUB_USERNAME', async () => {
      process.env = {
        BAD_TENANT_NAME: 'bad',
        BAD_DOCKERHUB_TOKEN: 'tok',
        BAD_DOCKERHUB_NAMESPACE: 'ns',
      };

      service = await buildModule();
      service.onModuleInit();

      expect(service.getRegisteredTenants()).toHaveLength(0);
    });

    it('skips a tenant missing DOCKERHUB_NAMESPACE', async () => {
      process.env = {
        BAD_TENANT_NAME: 'bad',
        BAD_DOCKERHUB_TOKEN: 'tok',
        BAD_DOCKERHUB_USERNAME: 'u',
      };

      service = await buildModule();
      service.onModuleInit();

      expect(service.getRegisteredTenants()).toHaveLength(0);
    });

    it('warns when no tenant configs are found at all', async () => {
      process.env = {};

      service = await buildModule();
      const warnSpy = jest.spyOn((service as any).logger, 'warn');
      service.onModuleInit();

      expect(warnSpy).toHaveBeenCalledWith(
        'No tenant Docker Hub configurations found in environment variables',
      );
    });

    it('stores tenantId with case-insensitive key (lowercased)', async () => {
      process.env = {
        X_TENANT_NAME: 'MyTenant',
        X_DOCKERHUB_TOKEN: 't',
        X_DOCKERHUB_USERNAME: 'u',
        X_DOCKERHUB_NAMESPACE: 'n',
      };

      service = await buildModule();
      service.onModuleInit();

      // getRegisteredTenants returns lowercased keys
      expect(service.getRegisteredTenants()).toContain('mytenant');
    });
  });

  // ─── getCredentials ───────────────────────────────────────────────────────────

  describe('getCredentials', () => {
    beforeEach(async () => {
      process.env = {
        CBE_TENANT_NAME: 'cbe',
        CBE_DOCKERHUB_TOKEN: 'tok123',
        CBE_DOCKERHUB_USERNAME: 'user1',
        CBE_DOCKERHUB_NAMESPACE: 'pslcopilot',
      };
      service = await buildModule();
      service.onModuleInit();
    });

    it('returns credentials for a registered tenant (exact case)', () => {
      const creds = service.getCredentials('cbe');
      expect(creds).toEqual({
        tenantId: 'cbe',
        token: 'tok123',
        username: 'user1',
        namespace: 'pslcopilot',
      });
    });

    it('returns credentials for a registered tenant (case-insensitive lookup)', () => {
      const creds = service.getCredentials('CBE');
      expect(creds.namespace).toBe('pslcopilot');
    });

    it('throws UnauthorizedException for an unknown tenant', () => {
      expect(() => service.getCredentials('unknown')).toThrow(UnauthorizedException);
    });

    it('error message mentions the tenantId', () => {
      expect(() => service.getCredentials('ghost')).toThrow(/ghost/);
    });
  });

  // ─── getRegisteredTenants ─────────────────────────────────────────────────────

  describe('getRegisteredTenants', () => {
    it('returns an empty array when no tenants are configured', async () => {
      process.env = {};
      service = await buildModule();
      service.onModuleInit();
      expect(service.getRegisteredTenants()).toEqual([]);
    });

    it('returns all registered tenant ids', async () => {
      process.env = {
        A_TENANT_NAME: 'alpha',
        A_DOCKERHUB_TOKEN: 't1',
        A_DOCKERHUB_USERNAME: 'u1',
        A_DOCKERHUB_NAMESPACE: 'n1',
        B_TENANT_NAME: 'beta',
        B_DOCKERHUB_TOKEN: 't2',
        B_DOCKERHUB_USERNAME: 'u2',
        B_DOCKERHUB_NAMESPACE: 'n2',
      };
      service = await buildModule();
      service.onModuleInit();
      expect(service.getRegisteredTenants()).toEqual(expect.arrayContaining(['alpha', 'beta']));
    });
  });
});
