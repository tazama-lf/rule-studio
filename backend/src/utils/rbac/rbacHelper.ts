import permissionMatrix from './permissionMatrix.json';

type Matrix = typeof permissionMatrix;
type EndpointKey = keyof Matrix['endpoints'];
type Role = keyof Matrix['_meta']['roles']; 

interface CheckContext {
  role: Role;
  endpointKey: EndpointKey;   
  currentStatus: string;      
  targetStatus?: string;      
}
interface getContext{
    role: Role;
    endpointKey: EndpointKey; 
}

interface CheckResult {
  allowed: boolean;
  reason?: string;
  allowedStatuses?: string[];
}

export class RbacService {
  private readonly endpoints = permissionMatrix.endpoints;
  private readonly roles = permissionMatrix._meta.roles;

  isRole(value: string): value is Role {
    return value in this.roles;
  }

  /**
   * Tier 2: Is this role allowed to act on a resource in its current status?
   */
  checkTier2({ role, endpointKey, currentStatus }: Omit<CheckContext, 'targetStatus'>): CheckResult {
    const endpoint = this.endpoints[endpointKey] as any;
    const tier2 = endpoint?.tier2;

    if (!tier2) return { allowed: true }; // no Tier 2 rule = unrestricted

    const perms = tier2.rolePermissions[role];
    if (!perms) {
      return { allowed: false, reason: `Role "${role}" has no Tier 2 permissions defined for ${endpointKey}` };
    }
 
    if (!perms.allowedCurrentStatuses.includes(currentStatus)) {

      return {
        allowed: false,
        reason: `Role "${role}" cannot act on resources in status "${currentStatus}" at ${endpointKey}`,
      };
    }

    return { allowed: true };
  }

  /**
   * Tier 3: Is the requested status transition valid for this role and current status?
   */
  checkTier3({ role, endpointKey, currentStatus, targetStatus }: CheckContext): CheckResult {
    if (!targetStatus) {
      return { allowed: false, reason: 'targetStatus is required for a Tier 3 check' };
    }

    const endpoint = this.endpoints[endpointKey] as any;
    const tier3 = endpoint?.tier3;

    if (!tier3) return { allowed: true }; // no Tier 3 rule = unrestricted

    const roleTransitions = tier3.transitions[role];
    if (!roleTransitions) {
      return { allowed: false, reason: `Role "${role}" has no Tier 3 transitions defined for ${endpointKey}` };
    }

    const allowed: string[] = roleTransitions[currentStatus] ?? [];
    if (!allowed.includes(targetStatus)) {
      return {
        allowed: false,
        reason: `Role "${role}" cannot transition from "${currentStatus}" to "${targetStatus}" at ${endpointKey}`,
      };
    }

    return { allowed: true };
  }

  getTier2 ({ role, endpointKey }: getContext): CheckResult {
    const endpoint = this.endpoints[endpointKey] as any;
    const tier2 = endpoint?.tier2;

    if (!tier2) return { allowed: true, allowedStatuses: [] }; // no Tier 2 rule = unrestricted

    const perms = tier2.rolePermissions[role];
    if (!perms) {
      return { allowed: false, reason: `Role "${role}" has no Tier 2 permissions defined for ${endpointKey}` };
    }

    return { 
      allowed: true, 
      allowedStatuses: perms.allowedCurrentStatuses 
    };
  }
}