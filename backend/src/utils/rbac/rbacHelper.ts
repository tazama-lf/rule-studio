import permissionMatrix from './permissionMatrix.json';

type Matrix = typeof permissionMatrix;
type EndpointKey = keyof Matrix['endpoints'];
type Role = keyof Matrix['_meta']['roles']; 

interface CheckContext {
  role: Role;
  endpointKey: string;
  currentStatus: string;
  targetStatus?: string;
}

interface GetContext {
  role: Role;
  endpointKey: string;
}

interface CheckResult {
  allowed: boolean;
  reason?: string;
  allowedStatuses?: string[];
}

interface Tier2Permissions {
  allowedCurrentStatuses: string[];
}

interface Tier2Config {
  rolePermissions: Record<Role, Tier2Permissions>;
}

interface Tier3Config {
  transitions: Record<Role, Record<string, string[]>>;
}

interface EndpointConfig {
  tier2?: Tier2Config;
  tier3?: Tier3Config;
}

export class RbacService {
  private readonly endpoints = permissionMatrix.endpoints;
  private readonly roles = permissionMatrix._meta.roles;

  isRole(value: string): value is Role {
    return value in this.roles;
  }

  private getEndpointConfig(endpointKey: string): EndpointConfig | undefined {
    return this.endpoints[endpointKey as EndpointKey] as unknown as EndpointConfig | undefined;
  }

  checkTier2({ role, endpointKey, currentStatus }: Omit<CheckContext, 'targetStatus'>): CheckResult {
    const endpoint = this.getEndpointConfig(endpointKey);
    const tier2 = endpoint?.tier2;

    if (!tier2) {
      return { allowed: true };
    }

    const perms = tier2.rolePermissions[role];
    if (!perms) {
      return {
        allowed: false,
        reason: `Role "${role}" has no Tier 2 permissions defined for ${endpointKey}`,
      };
    }

    if (!perms.allowedCurrentStatuses.includes(currentStatus)) {
      return {
        allowed: false,
        reason: `Role "${role}" cannot act on resources in status "${currentStatus}" at ${endpointKey}`,
      };
    }

    return { allowed: true };
  }

  checkTier3({ role, endpointKey, currentStatus, targetStatus }: CheckContext): CheckResult {
    if (!targetStatus) {
      return { allowed: false, reason: 'targetStatus is required for a Tier 3 check' };
    }

    const endpoint = this.getEndpointConfig(endpointKey);
    const tier3 = endpoint?.tier3;

    if (!tier3) {
      return { allowed: true };
    }

    const roleTransitions = tier3.transitions[role];
    if (!roleTransitions) {
      return {
        allowed: false,
        reason: `Role "${role}" has no Tier 3 transitions defined for ${endpointKey}`,
      };
    }

    const allowed = roleTransitions[currentStatus] ?? [];
    if (!allowed.includes(targetStatus)) {
      return {
        allowed: false,
        reason: `Role "${role}" cannot transition from "${currentStatus}" to "${targetStatus}" at ${endpointKey}`,
      };
    }

    return { allowed: true };
  }

  getTier2({ role, endpointKey }: GetContext): CheckResult {
    const endpoint = this.getEndpointConfig(endpointKey);
    const tier2 = endpoint?.tier2;

    if (!tier2) {
      console.log(`No Tier 2 config for ${endpointKey}, allowing by default`);
      return { allowed: true, allowedStatuses: [] };
    }

    const perms = tier2.rolePermissions[role];
    if (!perms) {
      return {
        allowed: false,
        reason: `Role "${role}" has no Tier 2 permissions defined for ${endpointKey}`,
      };
    }

    return {
      allowed: true,
      allowedStatuses: perms.allowedCurrentStatuses,
    };
  }
}