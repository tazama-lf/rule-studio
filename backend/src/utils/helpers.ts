import { BadRequestException } from '@nestjs/common';
import { CronTime } from 'cron';
import * as crypto from 'node:crypto';
import dotenv from 'dotenv';
import * as path from 'node:path';
import type { AuthenticatedUser } from '../services/auth/auth.types';
import * as jwt from 'jsonwebtoken';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface DecodedUserInfo {
  preferredUsername: string;
  realmRoles: string[];
  tenantDetails: string[];
}

const { ENCRYPTION_KEY, IV_LENGTH } = process.env;

const key = Buffer.from(ENCRYPTION_KEY!, 'utf8');

if (key.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 32 bytes for aes-256-cbc');
}

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(parseInt(IV_LENGTH!, 10));
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(message, { cause: error });
  }
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted payload format');
  }

  const [ivHex, encrypted] = parts;

  try {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted = decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt payload', { cause: error });
  }
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function validateCronExpression(expression: string): void {
  try {
    const isValid = CronTime.validateCronExpression(expression);
    if (!isValid.valid) {
      throw new Error('Expression did not pass validation');
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new BadRequestException(`Invalid Cron Expression: ${message}`);
  }
}

export function validateFileType(filePath: string): 'CSV' | 'TSV' | 'JSON' {
  const ext = path.extname(filePath).toLowerCase().replace('.', '');

  switch (ext) {
    case 'csv':
      return 'CSV';
    case 'tsv':
      return 'TSV';
    case 'json':
      return 'JSON';
    default:
      throw new Error(
        `Invalid file type: ${ext}. Only CSV, TSV, or JSON are allowed.`,
      );
  }
}

export function isValidText(text: string): boolean {
  return !/�{3,}/.test(text);
}

export function getTenantId(user: AuthenticatedUser): string {
  const tenantId = user.token.tenantId || user.tenantId;
  if (!tenantId) {
    throw new Error('Tenant ID not found in user token or claims');
  }
  return tenantId;
}

function decodeTokenString(tokenString: string): jwt.JwtPayload | null {
  try {
    return jwt.decode(tokenString) as jwt.JwtPayload;
  } catch {
    return null;
  }
}

export function decodeValidatedToken(user: AuthenticatedUser): DecodedUserInfo {
  let decoded = decodeTokenString(user.token.tokenString);

  if (!decoded) {
    throw new Error('Invalid token: unable to decode');
  }

  if (decoded.tokenString && typeof decoded.tokenString === 'string') {
    const innerDecoded = decodeTokenString(decoded.tokenString);
    if (innerDecoded) {
      decoded = innerDecoded;
    }
  }

  if (!decoded.preferred_username) {
    throw new Error(
      `Invalid token: preferred_username missing. Available keys: ${Object.keys(decoded).join(', ')}`,
    );
  }

  if (!decoded.realm_access || !Array.isArray(decoded.realm_access.roles)) {
    throw new Error('Invalid token: realm_access.roles missing or invalid');
  }

  if (!Array.isArray(decoded.tenant_details)) {
    throw new Error('Invalid token: tenant_details missing or invalid');
  }

  return {
    preferredUsername: decoded.preferred_username,
    realmRoles: decoded.realm_access.roles,
    tenantDetails: decoded.tenant_details,
  };
}

export const getGroupNameFromToken = (
  decodedToken: DecodedUserInfo,
): string | null => {
  const groupName =
    decodedToken.tenantDetails.length > 0
      ? decodedToken.tenantDetails[0].replace(/\//g, '')
      : null;
  return groupName;
};

export const getEmailsFromToken = (
  decodedToken: DecodedUserInfo,
): string[] => {
  const email = decodedToken.preferredUsername;
  return email ? [email] : [];
};
