import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import {
  getEmailTheme,
} from '@tazama-lf/tcs-lib';
import { firstValueFrom } from 'rxjs/internal/firstValueFrom';
import { HttpService } from '@nestjs/axios';
import { AuthenticatedUser } from '../auth/auth.types';

import {
  decodeValidatedToken,
  getGroupNameFromToken,
  getTenantId,
} from '../../utils/helpers';
import { EventType } from '../../utils/enums/events.enum';
import { Rules } from '../rules/dto/rules.dto';

// it should be place at interface file.
export interface EmailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) { }

  onModuleInit(): void {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    const smtpSecure = this.configService.get<string>('SMTP_SECURE') === 'true';

    if (!smtpHost || !smtpPass) {
      this.logger.warn(
        ' SMTP NOT CONFIGURED - Email notifications will be logged but not sent',
      );
      this.logger.warn(
        '   Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env to enable emails',
      );
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort ?? 587,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      this.transporter.verify((error) => {
        if (error) {
          this.logger.error(` SMTP connection error: ${error.message}`);
          this.logger.error(
            '   Please check your SMTP credentials in .env file',
          );
          this.isConfigured = false;
        } else {
          this.logger.log(` SMTP configured and ready: ${smtpHost}`);
          this.isConfigured = true;
        }
      });
    } catch (error) {
      this.logger.error(
        `Failed to initialize SMTP transporter: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      this.isConfigured = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      this.logger.warn(
        ` [DRY RUN] Would send email to: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`,
      );
      return false;
    }

    try {
      const fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL');
      if (!fromEmail) {
        this.logger.error('SMTP_FROM_EMAIL is not configured');
        throw new Error('SMTP_FROM_EMAIL is required when SMTP is enabled');
      }
      const fromName =
        this.configService.get<string>('SMTP_FROM_NAME') ??
        'Tazama Connection Studio'; //change this

      const mailOptions: nodemailer.SendMailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html ?? `<p>${options.text}</p>`,
      };

      if (options.replyTo) {
        mailOptions.replyTo = options.replyTo;
        this.logger.log('Reply-To header set');
      }

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }
  // write interface for this function.
  async fetchRecipientEmails(
    event: EventType,
    tenantId: string,
    authToken: string,
    groupName: string,
  ): Promise<any> { // write appropriate type instead of any.
    try {
      let role: string | null = null; // why role is null
      let fetchAll = false;

      switch (event) {
        case EventType.EditorSubmit:
          role = 'approver';
          break;
        case EventType.ApproverApprove:
          role = 'publisher';
          break;
        case EventType.ApproverReject:
          role = 'editor';
          break;
        case EventType.PublisherDeploy:
        case EventType.PublisherActivate:
        case EventType.PublisherDeactivate:
          fetchAll = true;
          break;
      }

      if (fetchAll) {
        this.logger.log(
          `Fetching all user emails from AuthService for tenant '${tenantId}'`,
        );
        const emails = await this.getUserGroupMembers(
          authToken,
          groupName,
          undefined,
        );
        this.logger.log(
          `✓ Fetched ${emails.length} total emails from Auth Service`,
        );
        return emails;
      }

      if (role) {
        this.logger.log(`Fetching emails for role '${role}' from AuthService`);
        const emails = await this.getUserGroupMembers(
          authToken,
          groupName,
          role,
        );

        this.logger.log(`Fetched ${emails.length} emails for role '${role}'`);
        return emails;
      }

      return [];
    } catch (error) {
      this.logger.error(`Failed to fetch recipient emails: ${error}`);
      return [];
    }
  }
  // write interface for this function.
  async getUserGroupMembers(
    token: string,
    groupName: string,
    roleName?: string,
  ): Promise<string[]> {
    const authUrl = this.configService.get<string>('TAZAMA_AUTH_URL');
    let url = `${authUrl}?groupName=${groupName}`;
    if (roleName) {
      url = url.concat(`&subGroupRoleName=${roleName}`);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      this.logger.debug('Response from Auth Service: ', response.data);

      const responseArr = response.data && Array.isArray(response.data) ? response.data : [];
      const emailList = responseArr.map((obj) => obj?.username);
      this.logger.debug('Fetched user emails: ', emailList);
      return emailList;
    } catch (error) {
      this.logger.error('Error fetching user group members: ', error);
      this.logger.error(
        `Auth service error during fetching user group members: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException(
        'Authentication service unavailable',
      );
    }
  }

  /**
   * Sends a rule-specific workflow notification email with a custom template
   * that displays all rule fields returned by the admin service.
   */
  async sendRuleWorkflowNotification(
    event: EventType,
    user: AuthenticatedUser,
    ruleData: Rules,
    authToken: string,
    comment?: string,
  ): Promise<void> {
    try {
      const decodedToken = decodeValidatedToken(user);
      const actorEmail = decodedToken.preferredUsername;
      const actorName = actorEmail;
      const tenantId = getTenantId(user);
      const groupName = getGroupNameFromToken(decodedToken);
      this.logger.log(`Rule Information: ${JSON.stringify(ruleData.ruleName)}, Transaction Type Version: ${JSON.stringify(ruleData.txtpVersion)}`);

      if (!groupName) {
        this.logger.error('Group name not found in token. Cannot send rule notification.');
        return;
      }

      this.logger.log(`Decoded token info: Email=${actorEmail}, Group=${groupName}, TenantId=${tenantId}`);

      // Fetch recipients based on event type
      const recipientEmails = (await this.fetchRecipientEmails(
        event,
        tenantId,
        authToken,
        groupName,
      )) as string[];

      if (recipientEmails.length === 0) {
        this.logger.warn(`No recipients found for event '${event}' in tenant '${tenantId}'`);
        return;
      }

      const {ruleName, version} = ruleData;
      const theme = getEmailTheme(event, ruleName, version);

      const htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 750px; padding: 24px; background-color: #f4f6f8;">
        <h2 style="color: ${theme.themeColor}; margin-top: 0;">${theme.emailTitle}</h2>
        <div style="background-color: ${theme.statusBadgeColor}; padding: 16px; border-left: 5px solid ${theme.themeColor}; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; font-size: 16px;">From: ${actorName}</p>
          <p style="margin: 5px 0 0 0;">
            <a href="mailto:${actorEmail}" style="color: ${theme.themeColor}; text-decoration: none;">${actorEmail}</a>
          </p>
          ${comment ? `<p style="margin-top: 10px; font-weight: bold; font-size: 16px;"><strong>Comment:</strong><br />${comment}</p>` : ''}
        </div>
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
          <h3 style="margin-top: 0; color: ${theme.themeColor};">Rule Information</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            ${this.emailRow('Rule ID', ruleData.id)}
            ${this.emailRow('Rule Name', ruleData.ruleName)}
            ${this.emailRow('Description', ruleData.description)}
            ${this.emailRow('Transaction Type', ruleData.txtp)}
            ${this.emailRow('Transaction Type Version', ruleData.txtpVersion)}
            ${this.emailRow('Rule Version', ruleData.version)}
            ${this.emailRow('Rule Type', ruleData.rule_type)}
            ${this.emailRow('Rule Config ID', ruleData.rule_config_id)}
            ${this.emailRowWithBadge('Status', ruleData.status, theme.themeColor)}
            ${this.emailRow('Created At', ruleData.created_at)}
            ${this.emailRow('Updated At', ruleData.updated_at)}
          </table>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
        <p style="font-size: 12px; color: #888;">
          Automated notification from Tazama Rule Studio<br />
          Tenant: ${tenantId}
        </p>
      </div>`;

      const textContent = `${theme.emailTitle}\n\nFrom: ${actorName}\nEmail: ${actorEmail}\n\nRule ID: ${ruleData.id}\nRule Name: ${ruleData.ruleName}\nDescription: ${ruleData.description}\nTransaction Type: ${ruleData.txtp}\nTransaction Type Version: ${ruleData.txtpVersion}\nVersion: ${ruleData.version}\nRule Type: ${ruleData.rule_type}\nRule Config ID: ${ruleData.rule_config_id}\nStatus: ${ruleData.status}\n\nCreated At: ${ruleData.created_at}\nUpdated At: ${ruleData.updated_at}\n${comment ? `Comment:\n${comment}\n` : ''}\nTenant: ${tenantId}`;

      this.logger.log(`Sending rule notification email to ${recipientEmails.length} recipient(s)`);

      const emailSent = await this.sendEmail({
        to: recipientEmails,
        subject: theme.subject,
        text: textContent,
        html: htmlContent,
        replyTo: actorEmail,
      });

      if (emailSent) {
        this.logger.log(`Rule workflow notification sent successfully for rule ${ruleName} to ${recipientEmails.join(', ')}`);
      } else {
        this.logger.warn('Email not sent (SMTP not configured or error occurred)');
      }
    } catch (error) {
      this.logger.error(
        `Error sending rule workflow notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : '',
      );
    }
  }

  private emailRow(label: string, value: any): string {
    return `
      <tr>
        <td style="padding: 8px; font-weight: bold; color: #666; width: 40%;">${label}</td>
        <td style="padding: 8px;">${value ?? 'N/A'}</td>
      </tr>`;
  }

  private emailRowWithBadge(label: string, value: any, color: string): string {
    return `
      <tr>
        <td style="padding: 8px; font-weight: bold; color: #666;">${label}</td>
        <td style="padding: 8px;">
          <span style="background-color: ${color}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;">
            ${value ?? 'N/A'}
          </span>
        </td>
      </tr>`;
  }
}
