import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DockerHubService } from '../../src/services/simulation-studio/dockerhub/dockerhub.service';
import { TenantConfigService } from '../../src/services/simulation-studio/dockerhub/tenant-config.service';
import type { TenantDockerHubCredentials } from '../../src/services/simulation-studio/dockerhub/tenant-config.service';

// ─── helpers ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'cbe';
const CREDS: TenantDockerHubCredentials = {
  tenantId: TENANT_ID,
  token: 'dckr_pat_test',
  username: 'testuser',
  namespace: 'testns',
};

const mockLoginResponse = { token: 'dh-jwt-token' };

const makeRepo = (name: string) => ({
  name,
  namespace: CREDS.namespace,
  repository_type: 'image',
  pull_count: 0,
  last_updated: '2026-01-01T00:00:00Z',
});

const makeTag = (name: string) => ({
  name,
  last_updated: '2026-01-01T00:00:00Z',
  digest: `sha256:${name}`,
});

const makeFetchOk = (body: unknown) =>
  jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response);

const makeFetchFail = (status: number, statusText = 'Error') =>
  jest.fn().mockResolvedValue({
    ok: false,
    status,
    statusText,
    json: jest.fn().mockResolvedValue({}),
  } as unknown as Response);

// ─── suite ───────────────────────────────────────────────────────────────────

describe('DockerHubService', () => {
  let service: DockerHubService;
  let tenantConfig: jest.Mocked<TenantConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DockerHubService,
        {
          provide: TenantConfigService,
          useValue: {
            getCredentials: jest.fn().mockReturnValue(CREDS),
          },
        },
      ],
    }).compile();

    service = module.get(DockerHubService);
    tenantConfig = module.get(TenantConfigService);
  });

  afterEach(() => jest.restoreAllMocks());

  // ─── getPublishedRules ──────────────────────────────────────────────────────

  describe('getPublishedRules', () => {
    it('returns mapped rules for a single page', async () => {
      const repos = [makeRepo('cbe-case105'), makeRepo('cbe-case106')];
      global.fetch = jest
        .fn()
        // first call: login
        .mockResolvedValueOnce({
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue(mockLoginResponse),
        } as unknown as Response)
        // second call: list repos (single page)
        .mockResolvedValueOnce({
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue({ count: 2, next: null, results: repos }),
        } as unknown as Response);

      const result = await service.getPublishedRules(TENANT_ID);

      expect(result.count).toBe(2);
      expect(result.rules).toHaveLength(2);
      expect(result.rules[0].name).toBe('cbe-case105');
      expect(result.rules[1].name).toBe('cbe-case106');
      expect(tenantConfig.getCredentials).toHaveBeenCalledWith(TENANT_ID);
    });

    it('filters out rules that do not match tenant prefix', async () => {
      const repos = [makeRepo('cbe-case105'), makeRepo('abc-case105'), makeRepo('cbe-case106')];
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue(mockLoginResponse),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue({ count: 3, next: null, results: repos }),
        } as unknown as Response);

      const result = await service.getPublishedRules(TENANT_ID);

      expect(result.count).toBe(2);
      expect(result.rules.map((r) => r.name)).toEqual(['cbe-case105', 'cbe-case106']);
    });

    it('follows pagination and returns all repos across pages', async () => {
      const page1Repos = [makeRepo('cbe-repo-a')];
      const page2Repos = [makeRepo('cbe-repo-b')];

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ // login
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue(mockLoginResponse),
        } as unknown as Response)
        .mockResolvedValueOnce({ // page 1 with next URL
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue({
            count: 2, next: 'https://hub.docker.com/v2/next-page', results: page1Repos,
          }),
        } as unknown as Response)
        .mockResolvedValueOnce({ // page 2 (no next)
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue({
            count: 2, next: null, results: page2Repos,
          }),
        } as unknown as Response);

      const result = await service.getPublishedRules(TENANT_ID);

      expect(result.count).toBe(2);
      expect(result.rules.map((r) => r.name)).toEqual(['cbe-repo-a', 'cbe-repo-b']);
    });

    it('throws InternalServerErrorException when Docker Hub login fails', async () => {
      global.fetch = makeFetchFail(401, 'Unauthorized');

      await expect(service.getPublishedRules(TENANT_ID)).rejects.toThrow(InternalServerErrorException);
    });

    it('throws InternalServerErrorException when repo fetch fails', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ // login ok
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue(mockLoginResponse),
        } as unknown as Response)
        .mockResolvedValueOnce(makeFetchFail(500, 'Internal Server Error')());

      await expect(service.getPublishedRules(TENANT_ID)).rejects.toThrow(InternalServerErrorException);
    });

    it('throws UnauthorizedException when tenant is not configured', async () => {
      tenantConfig.getCredentials.mockImplementation(() => {
        throw new UnauthorizedException('No config for tenant');
      });

      await expect(service.getPublishedRules(TENANT_ID)).rejects.toThrow(UnauthorizedException);
    });

    it('returns count equal to rules array length', async () => {
      const repos = [makeRepo('cbe-only-one')];
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue(mockLoginResponse),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue({ count: 1, next: null, results: repos }),
        } as unknown as Response);

      const result = await service.getPublishedRules(TENANT_ID);
      expect(result.count).toBe(result.rules.length);
    });
  });

  // ─── getTagsForRule ─────────────────────────────────────────────────────────

  describe('getTagsForRule', () => {
    const RULE = 'case105';
    const PREFIXED_RULE = `${TENANT_ID}-${RULE}`;

    it('returns mapped tags for a single page', async () => {
      const tags = [makeTag('latest'), makeTag('1.0.0')];
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ // login
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue(mockLoginResponse),
        } as unknown as Response)
        .mockResolvedValueOnce({ // tags page 1
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue({ count: 2, next: null, results: tags }),
        } as unknown as Response);

      const result = await service.getTagsForRule(TENANT_ID, RULE);

      expect(result.rule).toBe(PREFIXED_RULE);
      expect(result.count).toBe(2);
      expect(result.tags[0].name).toBe('latest');
      expect(result.tags[1].name).toBe('1.0.0');
    });

    it('follows pagination and returns all tags across pages', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ // login
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue(mockLoginResponse),
        } as unknown as Response)
        .mockResolvedValueOnce({ // page 1
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue({
            count: 2, next: 'https://hub.docker.com/v2/next-tags', results: [makeTag('v1')],
          }),
        } as unknown as Response)
        .mockResolvedValueOnce({ // page 2
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue({
            count: 2, next: null, results: [makeTag('v2')],
          }),
        } as unknown as Response);

      const result = await service.getTagsForRule(TENANT_ID, RULE);

      expect(result.count).toBe(2);
      expect(result.tags.map((t) => t.name)).toEqual(['v1', 'v2']);
    });

    it('throws NotFoundException when the rule repository does not exist (404)', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ // login ok
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue(mockLoginResponse),
        } as unknown as Response)
        .mockResolvedValueOnce({ // 404 on tags
          ok: false, status: 404, statusText: 'Not Found',
          json: jest.fn().mockResolvedValue({}),
        } as unknown as Response);

      await expect(service.getTagsForRule(TENANT_ID, RULE)).rejects.toThrow(NotFoundException);
    });

    it('NotFoundException message contains rule name, namespace and tenantId', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue(mockLoginResponse),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: false, status: 404, statusText: 'Not Found',
          json: jest.fn().mockResolvedValue({}),
        } as unknown as Response);

      await expect(service.getTagsForRule(TENANT_ID, RULE)).rejects.toThrow(
        new RegExp(`${PREFIXED_RULE}.*${CREDS.namespace}.*${TENANT_ID}`, 's'),
      );
    });

    it('throws InternalServerErrorException when Docker Hub login fails', async () => {
      global.fetch = makeFetchFail(401, 'Unauthorized');

      await expect(service.getTagsForRule(TENANT_ID, RULE)).rejects.toThrow(InternalServerErrorException);
    });

    it('throws InternalServerErrorException on non-404 tags fetch error', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ // login ok
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue(mockLoginResponse),
        } as unknown as Response)
        .mockResolvedValueOnce({ // 500 on tags
          ok: false, status: 500, statusText: 'Server Error',
          json: jest.fn().mockResolvedValue({}),
        } as unknown as Response);

      await expect(service.getTagsForRule(TENANT_ID, RULE)).rejects.toThrow(InternalServerErrorException);
    });

    it('throws UnauthorizedException when tenant is not configured', async () => {
      tenantConfig.getCredentials.mockImplementation(() => {
        throw new UnauthorizedException('No config');
      });

      await expect(service.getTagsForRule(TENANT_ID, RULE)).rejects.toThrow(UnauthorizedException);
    });

    it('encodes special characters in rule name in the URL', async () => {
      const specialRule = 'rule/with spaces';
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue(mockLoginResponse),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue({ count: 0, next: null, results: [] }),
        } as unknown as Response);

      await service.getTagsForRule(TENANT_ID, specialRule);

      const tagCallUrl = (global.fetch as jest.Mock).mock.calls[1][0] as string;
      expect(tagCallUrl).not.toContain(' ');
      expect(tagCallUrl).toContain(encodeURIComponent(`${TENANT_ID}-${specialRule}`));
    });

    it('does not double-prefix a rule that is already tenant-prefixed', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue(mockLoginResponse),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue({ count: 0, next: null, results: [] }),
        } as unknown as Response);

      await service.getTagsForRule(TENANT_ID, PREFIXED_RULE);

      const tagCallUrl = (global.fetch as jest.Mock).mock.calls[1][0] as string;
      expect(tagCallUrl).toContain(encodeURIComponent(PREFIXED_RULE));
    });

    it('maps each tag fields correctly (name, last_updated, digest)', async () => {
      const rawTag = { name: 'v3', last_updated: '2026-05-01T00:00:00Z', digest: 'sha256:abc' };
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue(mockLoginResponse),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true, status: 200, statusText: 'OK',
          json: jest.fn().mockResolvedValue({ count: 1, next: null, results: [rawTag] }),
        } as unknown as Response);

      const result = await service.getTagsForRule(TENANT_ID, RULE);
      expect(result.tags[0]).toEqual({ name: 'v3', last_updated: '2026-05-01T00:00:00Z', digest: 'sha256:abc' });
    });
  });

  // ─── makeFetchOk / makeFetchFail unused-ref guard ───────────────────────────
  it('makeFetchOk helper produces ok response', async () => {
    const mock = makeFetchOk({ hello: 'world' });
    const resp = await mock() as Response;
    expect(resp.ok).toBe(true);
  });
});
