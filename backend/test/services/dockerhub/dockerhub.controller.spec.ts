import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DockerHubController } from '../../../src/services/dockerhub/dockerhub.controller';
import { DockerHubService } from '../../../src/services/dockerhub/dockerhub.service';
import type { AuthenticatedUser } from '../../../src/services/auth/auth.types';
import type {
  DockerHubRepositoriesResponseDto,
  DockerHubTagsResponseDto,
} from '../../../src/services/dockerhub/dto/dockerhub.dto';

// ─── helpers ─────────────────────────────────────────────────────────────────

const makeUser = (tenantId = 'cbe'): AuthenticatedUser =>
  ({
    tenantId,
    userId: 'user-1',
    actorRole: 'editor',
    token: { tokenString: 'tok', tenantId } as any,
    validated: {} as any,
    validClaims: [],
  }) as AuthenticatedUser;

const mockRulesResponse: DockerHubRepositoriesResponseDto = {
  rules: [
    {
      name: 'case105',
      namespace: 'pslcopilot',
      repository_type: 'image',
      pull_count: 0,
      last_updated: '2026-05-20T06:43:21Z',
    },
  ],
  count: 1,
};

const mockTagsResponse: DockerHubTagsResponseDto = {
  rule: 'case105',
  tags: [
    { name: 'latest', last_updated: '2026-05-20T06:43:21Z', digest: 'sha256:abc' },
    { name: '1.0.0', last_updated: '2026-05-20T06:43:14Z', digest: 'sha256:def' },
  ],
  count: 2,
};

// ─── suite ───────────────────────────────────────────────────────────────────

describe('DockerHubController', () => {
  let controller: DockerHubController;
  let service: jest.Mocked<DockerHubService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DockerHubController],
      providers: [
        {
          provide: DockerHubService,
          useValue: {
            getPublishedRules: jest.fn(),
            getTagsForRule: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(DockerHubController);
    service = module.get(DockerHubService);
  });

  afterEach(() => jest.restoreAllMocks());

  // ─── getPublishedRules ──────────────────────────────────────────────────────

  describe('getPublishedRules', () => {
    it('delegates to DockerHubService with the user tenantId', async () => {
      service.getPublishedRules.mockResolvedValue(mockRulesResponse);
      const user = makeUser('cbe');

      const result = await controller.getPublishedRules(user);

      expect(service.getPublishedRules).toHaveBeenCalledWith('cbe');
      expect(result).toStrictEqual(mockRulesResponse);
    });

    it('passes tenantId from the user object (not hard-coded)', async () => {
      service.getPublishedRules.mockResolvedValue(mockRulesResponse);
      const user = makeUser('tenant_001');

      await controller.getPublishedRules(user);

      expect(service.getPublishedRules).toHaveBeenCalledWith('tenant_001');
    });

    it('propagates errors thrown by the service', async () => {
      service.getPublishedRules.mockRejectedValue(new Error('downstream error'));
      const user = makeUser();

      await expect(controller.getPublishedRules(user)).rejects.toThrow('downstream error');
    });
  });

  // ─── getTagsForRule ─────────────────────────────────────────────────────────

  describe('getTagsForRule', () => {
    it('delegates to DockerHubService with tenantId and trimmed rule name', async () => {
      service.getTagsForRule.mockResolvedValue(mockTagsResponse);
      const user = makeUser('cbe');

      const result = await controller.getTagsForRule('  case105  ', user);

      expect(service.getTagsForRule).toHaveBeenCalledWith('cbe', 'case105');
      expect(result).toStrictEqual(mockTagsResponse);
    });

    it('throws BadRequestException when rule is an empty string', async () => {
      const user = makeUser();

      await expect(controller.getTagsForRule('', user)).rejects.toThrow(BadRequestException);
      expect(service.getTagsForRule).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when rule is only whitespace', async () => {
      const user = makeUser();

      await expect(controller.getTagsForRule('   ', user)).rejects.toThrow(BadRequestException);
      expect(service.getTagsForRule).not.toHaveBeenCalled();
    });

    it('error message mentions the `rule` parameter', async () => {
      const user = makeUser();

      await expect(controller.getTagsForRule('', user)).rejects.toThrow(/rule/i);
    });

    it('propagates errors thrown by the service', async () => {
      service.getTagsForRule.mockRejectedValue(new Error('not found'));
      const user = makeUser();

      await expect(controller.getTagsForRule('case105', user)).rejects.toThrow('not found');
    });

    it('passes different tenantIds from different users', async () => {
      service.getTagsForRule.mockResolvedValue(mockTagsResponse);
      const userA = makeUser('tenant_a');
      const userB = makeUser('tenant_b');

      await controller.getTagsForRule('rule-x', userA);
      expect(service.getTagsForRule).toHaveBeenLastCalledWith('tenant_a', 'rule-x');

      await controller.getTagsForRule('rule-x', userB);
      expect(service.getTagsForRule).toHaveBeenLastCalledWith('tenant_b', 'rule-x');
    });
  });
});
