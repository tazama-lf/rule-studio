import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { ServiceUnavailableException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { NotificationService } from '../../src/services/notification/notification.service';
import { EventType } from '../../src/utils/enums/events.enum';
import * as helpers from '../../src/utils/helpers';

const makeAuthUser = (overrides: Record<string, unknown> = {}) =>
  ({
    actorRole: 'editor',
    token: { tokenString: 'test-token', tenantId: 'tenant-1' },
    tenantId: 'tenant-1',
    userId: 'user-1',
    validated: {
      preferred_username: 'actor@test.com',
      name: 'Actor Name',
      tokenString: 'inner-token',
      realm_access: { roles: ['editor'] },
      groups: ['group-name'],
    },
    validClaims: ['editor'],
    ...overrides,
  }) as any;

describe('NotificationService', () => {
  let service: NotificationService;
  let configService: jest.Mocked<NestConfigService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: NestConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    configService = module.get(NestConfigService);
    httpService = module.get(HttpService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('does not configure transporter when SMTP_HOST is missing', () => {
      configService.get.mockReturnValue(undefined);
      service.onModuleInit();
      expect(service).toBeDefined();
    });

    it('does not configure transporter when SMTP_PASS is missing', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_HOST') return 'smtp.example.com';
        return undefined;
      });
      service.onModuleInit();
      expect(service).toBeDefined();
    });

    it('attempts to configure transporter when both SMTP_HOST and SMTP_PASS are set', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_HOST') return 'smtp.example.com';
        if (key === 'SMTP_PASS') return 'secret';
        if (key === 'SMTP_PORT') return 587;
        if (key === 'SMTP_SECURE') return 'false';
        return undefined;
      });
      expect(() => service.onModuleInit()).not.toThrow();
    });
  });

  describe('sendEmail', () => {
    it('returns false when SMTP is not configured', async () => {
      const result = await service.sendEmail({
        to: 'user@test.com',
        subject: 'Test',
        text: 'Hello',
      });
      expect(result).toBe(false);
    });

    it('returns false for array recipients when SMTP is not configured', async () => {
      const result = await service.sendEmail({
        to: ['a@test.com', 'b@test.com'],
        subject: 'Test',
        text: 'Hello',
      });
      expect(result).toBe(false);
    });
  });

  describe('fetchRecipientEmails', () => {
    beforeEach(() => {
      jest.spyOn(service, 'getUserGroupMembers').mockResolvedValue(['user@test.com']);
    });

    it('returns empty array when event has no role and is not fetchAll', async () => {
      const result = await service.fetchRecipientEmails(
        'UNKNOWN_EVENT' as EventType,
        'tenant-1',
        'token',
        'group-name',
      );
      expect(result).toEqual([]);
    });

    it('fetches approver emails for EditorSubmit event', async () => {
      const result = await service.fetchRecipientEmails(
        EventType.EditorSubmit,
        'tenant-1',
        'token',
        'group-name',
      );
      expect(service.getUserGroupMembers).toHaveBeenCalledWith('token', 'group-name', 'approver');
      expect(result).toEqual(['user@test.com']);
    });

    it('fetches publisher emails for ApproverApprove event', async () => {
      await service.fetchRecipientEmails(EventType.ApproverApprove, 'tenant-1', 'token', 'group-name');
      expect(service.getUserGroupMembers).toHaveBeenCalledWith('token', 'group-name', 'publisher');
    });

    it('fetches editor emails for ApproverReject event', async () => {
      await service.fetchRecipientEmails(EventType.ApproverReject, 'tenant-1', 'token', 'group-name');
      expect(service.getUserGroupMembers).toHaveBeenCalledWith('token', 'group-name', 'editor');
    });

    it('fetches all users for PublisherDeploy event', async () => {
      await service.fetchRecipientEmails(EventType.PublisherDeploy, 'tenant-1', 'token', 'group-name');
      expect(service.getUserGroupMembers).toHaveBeenCalledWith('token', 'group-name', undefined);
    });

    it('fetches all users for PublisherActivate event', async () => {
      await service.fetchRecipientEmails(EventType.PublisherActivate, 'tenant-1', 'token', 'group-name');
      expect(service.getUserGroupMembers).toHaveBeenCalledWith('token', 'group-name', undefined);
    });

    it('fetches all users for PublisherDeactivate event', async () => {
      await service.fetchRecipientEmails(EventType.PublisherDeactivate, 'tenant-1', 'token', 'group-name');
      expect(service.getUserGroupMembers).toHaveBeenCalledWith('token', 'group-name', undefined);
    });

    it('returns empty array when getUserGroupMembers throws', async () => {
      jest.spyOn(service, 'getUserGroupMembers').mockRejectedValue(new Error('auth error'));
      const result = await service.fetchRecipientEmails(EventType.EditorSubmit, 'tenant-1', 'token', 'group-name');
      expect(result).toEqual([]);
    });
  });

  describe('getUserGroupMembers', () => {
    it('returns email list from auth service response', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'TAZAMA_AUTH_URL') return 'http://auth.example.com';
        return undefined;
      });
      httpService.get.mockReturnValue(
        of({ data: [{ username: 'user1@test.com' }, { username: 'user2@test.com' }] } as any),
      );

      const result = await service.getUserGroupMembers('token', 'group-name');
      expect(result).toEqual(['user1@test.com', 'user2@test.com']);
    });

    it('returns email list with roleName as subgroup filter', async () => {
      configService.get.mockReturnValue('http://auth.example.com');
      httpService.get.mockReturnValue(
        of({ data: [{ username: 'approver@test.com' }] } as any),
      );

      const result = await service.getUserGroupMembers('token', 'group-name', 'approver');
      expect(result).toEqual(['approver@test.com']);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('subGroupRoleName=approver'),
        expect.any(Object),
      );
    });

    it('returns empty list when response data is not an array', async () => {
      configService.get.mockReturnValue('http://auth.example.com');
      httpService.get.mockReturnValue(of({ data: null } as any));

      const result = await service.getUserGroupMembers('token', 'group-name');
      expect(result).toEqual([]);
    });

    it('throws ServiceUnavailableException when http request fails', async () => {
      configService.get.mockReturnValue('http://auth.example.com');
      httpService.get.mockReturnValue(throwError(() => new Error('network error')));

      await expect(service.getUserGroupMembers('token', 'group-name')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('sendRuleWorkflowNotification', () => {
    const ruleData = {
      id: 1,
      rule_name: 'test-rule',
      description: 'desc',
      txtp: 'pacs.002',
      txtp_version: '1.0',
      version: '1.0.0',
      rule_type: 'standard',
      rule_config_id: 'conf-1',
      status: 'STATUS_03_UNDER_REVIEW',
      created_at: '2024-01-01',
      updated_at: '2024-01-02',
    } as any;

    const decodedInfo = {
      preferredUsername: 'actor@test.com',
      realmRoles: ['editor'],
      tenantDetails: ['group-name'],
    };

    it('completes without throwing when no group name in token', async () => {
      const user = makeAuthUser();
      jest.spyOn(helpers, 'decodeValidatedToken').mockReturnValue({
        preferredUsername: 'actor@test.com',
        realmRoles: ['editor'],
        tenantDetails: [], // empty → getGroupNameFromToken returns null
      });
      jest.spyOn(helpers, 'getTenantId').mockReturnValue('tenant-1');

      await expect(
        service.sendRuleWorkflowNotification(EventType.EditorSubmit, user, ruleData),
      ).resolves.not.toThrow();
    });

    it('completes without throwing when recipients list is empty', async () => {
      const user = makeAuthUser();
      jest.spyOn(helpers, 'decodeValidatedToken').mockReturnValue(decodedInfo);
      jest.spyOn(helpers, 'getTenantId').mockReturnValue('tenant-1');
      jest.spyOn(service, 'fetchRecipientEmails').mockResolvedValue([]);

      await expect(
        service.sendRuleWorkflowNotification(EventType.EditorSubmit, user, ruleData),
      ).resolves.not.toThrow();
    });

    it('sends email when recipients are found', async () => {
      const user = makeAuthUser();
      jest.spyOn(helpers, 'decodeValidatedToken').mockReturnValue(decodedInfo);
      jest.spyOn(helpers, 'getTenantId').mockReturnValue('tenant-1');
      jest.spyOn(service, 'fetchRecipientEmails').mockResolvedValue(['target@test.com']);
      jest.spyOn(service, 'sendEmail').mockResolvedValue(true);

      await service.sendRuleWorkflowNotification(EventType.EditorSubmit, user, ruleData, 'A comment');

      expect(service.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: ['target@test.com'] }),
      );
    });

    it('logs warning when email is not sent', async () => {
      const user = makeAuthUser();
      jest.spyOn(helpers, 'decodeValidatedToken').mockReturnValue(decodedInfo);
      jest.spyOn(helpers, 'getTenantId').mockReturnValue('tenant-1');
      jest.spyOn(service, 'fetchRecipientEmails').mockResolvedValue(['target@test.com']);
      jest.spyOn(service, 'sendEmail').mockResolvedValue(false);

      await expect(
        service.sendRuleWorkflowNotification(EventType.EditorSubmit, user, ruleData),
      ).resolves.not.toThrow();
    });

    it('catches and logs errors without rethrowing', async () => {
      const user = makeAuthUser();
      jest.spyOn(helpers, 'decodeValidatedToken').mockImplementation(() => {
        throw new Error('decode error');
      });

      await expect(
        service.sendRuleWorkflowNotification(EventType.EditorSubmit, user, ruleData),
      ).resolves.not.toThrow();
    });
  });
});
