import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DockerHubService } from '../../src/services/simulation-studio/dockerhub/dockerhub.service';

// ─── helpers ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'cbe';
const NAMESPACE = 'testns';

const LOGIN_BODY = { token: 'dh-jwt-token' };

const makeRepo = (name: string) => ({
  name,
  namespace: NAMESPACE,
  repository_type: 'image',
  pull_count: 0,
  last_updated: '2026-01-01T00:00:00Z',
});

const makeTag = (name: string) => ({
  name,
  last_updated: '2026-01-01T00:00:00Z',
  digest: `sha256:${name}`,
});

const okResp = (body: unknown) =>
  ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response);

const failResp = (status: number, statusText = 'Error') =>
  ({
    ok: false,
    status,
    statusText,
    json: jest.fn().mockResolvedValue({}),
  } as unknown as Response);

const mockConfigService = {
  get: (key: string) =>
  ({
    DOCKERHUB_TOKEN: 'dckr_pat_test',
    DOCKERHUB_USERNAME: 'testuser',
    DOCKERHUB_NAMESPACE: NAMESPACE,
  }[key]),
};

// ─── suite ───────────────────────────────────────────────────────────────────

describe('DockerHubService', () => {
  let service: DockerHubService;

  const bootService = async (loginResp: Response = okResp(LOGIN_BODY)) => {
    global.fetch = jest.fn().mockResolvedValueOnce(loginResp);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DockerHubService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(DockerHubService);
    await service.onModuleInit();
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── onModuleInit / login ───────────────────────────────────────────────────

  describe('onModuleInit', () => {
    it('exchanges the PAT for a JWT at /v2/users/login', async () => {
      await bootService();

      const call = (global.fetch as jest.Mock).mock.calls[0];
      const [url, init] = call as [string, RequestInit];
      expect(url).toContain('/v2/users/login');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual({
        username: 'testuser',
        password: 'dckr_pat_test',
      });
    });

    it('throws InternalServerErrorException when Docker Hub login fails at boot', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce(failResp(401, 'Unauthorized'));
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DockerHubService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const svc = module.get(DockerHubService);
      await expect(svc.onModuleInit()).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── getPublishedRules ──────────────────────────────────────────────────────

  describe('getPublishedRules', () => {
    beforeEach(async () => {
      await bootService();
    });

    it('returns mapped rules for a single page', async () => {
      const repos = [makeRepo('cbe-case105'), makeRepo('cbe-case106')];
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okResp({ count: 2, next: null, results: repos }),
      );

      const result = await service.getPublishedRules(TENANT_ID);

      expect(result.count).toBe(2);
      expect(result.rules).toHaveLength(2);
      expect(result.rules[0].name).toBe('cbe-case105');
      expect(result.rules[1].name).toBe('cbe-case106');
    });

    it('filters out rules that do not match tenant prefix', async () => {
      const repos = [makeRepo('cbe-case105'), makeRepo('abc-case105'), makeRepo('cbe-case106')];
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okResp({ count: 3, next: null, results: repos }),
      );

      const result = await service.getPublishedRules(TENANT_ID);

      expect(result.count).toBe(2);
      expect(result.rules.map((r) => r.name)).toEqual(['cbe-case105', 'cbe-case106']);
    });

    it('follows pagination and returns all repos across pages', async () => {
      const page1Repos = [makeRepo('cbe-repo-a')];
      const page2Repos = [makeRepo('cbe-repo-b')];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(
          okResp({ count: 2, next: 'https://hub.docker.com/v2/next-page', results: page1Repos }),
        )
        .mockResolvedValueOnce(
          okResp({ count: 2, next: null, results: page2Repos }),
        );

      const result = await service.getPublishedRules(TENANT_ID);

      expect(result.count).toBe(2);
      expect(result.rules.map((r) => r.name)).toEqual(['cbe-repo-a', 'cbe-repo-b']);
    });

    it('re-logins and retries once when the API returns 401', async () => {
      const repos = [makeRepo('cbe-case105')];
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(failResp(401, 'Unauthorized'))
        .mockResolvedValueOnce(okResp({ token: 'dh-jwt-refreshed' }))
        .mockResolvedValueOnce(okResp({ count: 1, next: null, results: repos }));

      const result = await service.getPublishedRules(TENANT_ID);

      expect(result.count).toBe(1);
      // boot login + first call (401) + re-login + retry = 4 fetches total
      expect((global.fetch as jest.Mock).mock.calls).toHaveLength(4);
    });

    it('throws InternalServerErrorException when repo fetch fails with 500', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(failResp(500, 'Internal Server Error'));

      await expect(service.getPublishedRules(TENANT_ID)).rejects.toThrow(InternalServerErrorException);
    });

    it('returns count equal to rules array length', async () => {
      const repos = [makeRepo('cbe-only-one')];
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okResp({ count: 1, next: null, results: repos }),
      );

      const result = await service.getPublishedRules(TENANT_ID);
      expect(result.count).toBe(result.rules.length);
    });

    it('sends the JWT as a Bearer token on API calls', async () => {
      const repos = [makeRepo('cbe-case105')];
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okResp({ count: 1, next: null, results: repos }),
      );

      await service.getPublishedRules(TENANT_ID);

      const apiCall = (global.fetch as jest.Mock).mock.calls[1];
      const [, init] = apiCall as [string, RequestInit];
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer dh-jwt-token');
    });
  });

  // ─── getTagsForRule ─────────────────────────────────────────────────────────

  describe('getTagsForRule', () => {
    const RULE = 'case105';
    const PREFIXED_RULE = `${TENANT_ID}-${RULE}`;

    beforeEach(async () => {
      await bootService();
    });

    it('returns mapped tags for a single page', async () => {
      const tags = [makeTag('latest'), makeTag('1.0.0')];
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okResp({ count: 2, next: null, results: tags }),
      );

      const result = await service.getTagsForRule(TENANT_ID, RULE);

      // service filters out 'latest'; only versioned tags are returned
      expect(result.rule).toBe(PREFIXED_RULE);
      expect(result.count).toBe(1);
      expect(result.tags[0].name).toBe('1.0.0');
    });

    it('follows pagination and returns all tags across pages', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(
          okResp({ count: 2, next: 'https://hub.docker.com/v2/next-tags', results: [makeTag('v1')] }),
        )
        .mockResolvedValueOnce(
          okResp({ count: 2, next: null, results: [makeTag('v2')] }),
        );

      const result = await service.getTagsForRule(TENANT_ID, RULE);

      expect(result.count).toBe(2);
      expect(result.tags.map((t) => t.name)).toEqual(['v1', 'v2']);
    });

    it('throws NotFoundException when the rule repository does not exist (404)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(failResp(404, 'Not Found'));

      await expect(service.getTagsForRule(TENANT_ID, RULE)).rejects.toThrow(NotFoundException);
    });

    it('NotFoundException message contains rule name and namespace', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(failResp(404, 'Not Found'));

      await expect(service.getTagsForRule(TENANT_ID, RULE)).rejects.toThrow(
        new RegExp(`${PREFIXED_RULE}.*${NAMESPACE}`, 's'),
      );
    });

    it('throws InternalServerErrorException on non-404 tags fetch error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(failResp(500, 'Server Error'));

      await expect(service.getTagsForRule(TENANT_ID, RULE)).rejects.toThrow(InternalServerErrorException);
    });

    it('encodes special characters in rule name in the URL', async () => {
      const specialRule = 'rule/with spaces';
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okResp({ count: 0, next: null, results: [] }),
      );

      await service.getTagsForRule(TENANT_ID, specialRule);

      const tagCallUrl = (global.fetch as jest.Mock).mock.calls[1][0] as string;
      expect(tagCallUrl).not.toContain(' ');
      expect(tagCallUrl).toContain(encodeURIComponent(`${TENANT_ID}-${specialRule}`));
    });

    it('does not double-prefix a rule that is already tenant-prefixed', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okResp({ count: 0, next: null, results: [] }),
      );

      await service.getTagsForRule(TENANT_ID, PREFIXED_RULE);

      const tagCallUrl = (global.fetch as jest.Mock).mock.calls[1][0] as string;
      expect(tagCallUrl).toContain(encodeURIComponent(PREFIXED_RULE));
    });

    it('maps each tag fields correctly (name, last_updated, digest)', async () => {
      const rawTag = { name: 'v3', last_updated: '2026-05-01T00:00:00Z', digest: 'sha256:abc' };
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okResp({ count: 1, next: null, results: [rawTag] }),
      );

      const result = await service.getTagsForRule(TENANT_ID, RULE);
      expect(result.tags[0]).toEqual({ name: 'v3', last_updated: '2026-05-01T00:00:00Z', digest: 'sha256:abc' });
    });
  });
});
