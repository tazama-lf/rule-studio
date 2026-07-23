import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import * as nodemailer from 'nodemailer';
import { NotificationService } from '../../src/services/notification/notification.service';

jest.mock('nodemailer');

describe('NotificationService - SMTP configured paths', () => {
  let service: NotificationService;
  let configService: jest.Mocked<NestConfigService>;
  let mockSendMail: jest.Mock;
  let mockVerify: jest.Mock;
  let mockTransporter: { verify: jest.Mock; sendMail: jest.Mock };

  const mockedNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

  beforeEach(async () => {
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
    mockVerify = jest.fn();
    mockTransporter = { verify: mockVerify, sendMail: mockSendMail };
    mockedNodemailer.createTransport.mockReturnValue(mockTransporter as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: NestConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: HttpService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    configService = module.get(NestConfigService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('initializeTransporter verify callback', () => {
    it('sets isConfigured=false and logs error when verify callback has an error', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_HOST') return 'smtp.example.com';
        if (key === 'SMTP_PASS') return 'secret';
        if (key === 'SMTP_PORT') return 587;
        return undefined;
      });

      mockVerify.mockImplementation((cb: (err: Error | null) => void) => {
        cb(new Error('SMTP connection refused'));
      });

      service.onModuleInit();

      expect(mockVerify).toHaveBeenCalled();
      expect((service as any).isConfigured).toBe(false);
    });

    it('sets isConfigured=true and logs success when verify callback succeeds', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_HOST') return 'smtp.example.com';
        if (key === 'SMTP_PASS') return 'secret';
        if (key === 'SMTP_PORT') return 587;
        return undefined;
      });

      mockVerify.mockImplementation((cb: (err: null) => void) => {
        cb(null);
      });

      service.onModuleInit();

      expect(mockVerify).toHaveBeenCalled();
      expect((service as any).isConfigured).toBe(true);
    });

    it('sets isConfigured=false when nodemailer.createTransport throws', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_HOST') return 'smtp.example.com';
        if (key === 'SMTP_PASS') return 'secret';
        return undefined;
      });

      mockedNodemailer.createTransport.mockImplementationOnce(() => {
        throw new Error('createTransport failed');
      });

      service.onModuleInit();

      expect((service as any).isConfigured).toBe(false);
    });
  });

  describe('sendEmail when SMTP is configured', () => {
    beforeEach(() => {
      (service as any).isConfigured = true;
      (service as any).transporter = mockTransporter;
    });

    it('returns true when email is sent successfully', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_FROM_EMAIL') return 'noreply@test.com';
        if (key === 'SMTP_FROM_NAME') return 'Test System';
        return undefined;
      });

      const result = await service.sendEmail({
        to: 'recipient@test.com',
        subject: 'Test Subject',
        text: 'Hello World',
      });

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'recipient@test.com',
          subject: 'Test Subject',
          from: '"Test System" <noreply@test.com>',
        }),
      );
    });

    it('uses default from name when SMTP_FROM_NAME is not configured', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_FROM_EMAIL') return 'noreply@test.com';
        return undefined;
      });

      await service.sendEmail({ to: 'r@test.com', subject: 'S', text: 'T' });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"Tazama Rule Studio" <noreply@test.com>',
        }),
      );
    });

    it('sends to multiple recipients joined by comma', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_FROM_EMAIL') return 'noreply@test.com';
        return undefined;
      });

      await service.sendEmail({
        to: ['a@test.com', 'b@test.com'],
        subject: 'S',
        text: 'T',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'a@test.com, b@test.com' }),
      );
    });

    it('includes replyTo header when provided', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_FROM_EMAIL') return 'noreply@test.com';
        return undefined;
      });

      await service.sendEmail({
        to: 'r@test.com',
        subject: 'S',
        text: 'T',
        replyTo: 'reply@test.com',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ replyTo: 'reply@test.com' }),
      );
    });

    it('uses provided html when given', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_FROM_EMAIL') return 'noreply@test.com';
        return undefined;
      });

      await service.sendEmail({
        to: 'r@test.com',
        subject: 'S',
        text: 'T',
        html: '<b>Custom HTML</b>',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ html: '<b>Custom HTML</b>' }),
      );
    });

    it('falls back to wrapped text as html when html is not provided', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_FROM_EMAIL') return 'noreply@test.com';
        return undefined;
      });

      await service.sendEmail({ to: 'r@test.com', subject: 'S', text: 'Hello' });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ html: '<p>Hello</p>' }),
      );
    });

    it('returns false when SMTP_FROM_EMAIL is not configured', async () => {
      configService.get.mockReturnValue(undefined); // SMTP_FROM_EMAIL not set

      const result = await service.sendEmail({ to: 'r@test.com', subject: 'S', text: 'T' });

      expect(result).toBe(false);
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('returns false when sendMail throws an error', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_FROM_EMAIL') return 'noreply@test.com';
        return undefined;
      });
      mockSendMail.mockRejectedValueOnce(new Error('SMTP send failed'));

      const result = await service.sendEmail({ to: 'r@test.com', subject: 'S', text: 'T' });

      expect(result).toBe(false);
    });
  });
});
