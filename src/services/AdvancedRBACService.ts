import { User } from '../types';

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[]; // Permission IDs
  inherits?: string[]; // Role IDs to inherit from
  metadata?: Record<string, any>;
}

export interface PermissionCondition {
  field: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'in'
    | 'not_in'
    | 'contains'
    | 'starts_with'
    | 'ends_with';
  value: any;
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  owner?: string;
  metadata?: Record<string, any>;
}

export interface Policy {
  id: string;
  name: string;
  description?: string;
  rules: PolicyRule[];
  priority: number;
  enabled: boolean;
}

export interface PolicyRule {
  effect: 'allow' | 'deny';
  subjects: string[]; // User IDs, role names, or wildcards
  resources: string[]; // Resource patterns
  actions: string[]; // Action patterns
  conditions?: PermissionCondition[];
}

export interface RBACConfig {
  enableHierarchicalRoles: boolean;
  enableResourceOwnership: boolean;
  enablePolicyEngine: boolean;
  defaultDeny: boolean;
  auditLogging: boolean;
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  matchedPolicies: string[];
  matchedRoles: string[];
  matchedPermissions: string[];
}

export class AdvancedRBACService {
  private config: RBACConfig;
  private permissions: Map<string, Permission> = new Map();
  private roles: Map<string, Role> = new Map();
  private policies: Map<string, Policy> = new Map();
  private resources: Map<string, Resource> = new Map();

  constructor(config: RBACConfig) {
    this.config = config;
    this.initializeDefaultPermissions();
    this.initializeDefaultRoles();
  }

  /**
   * Check if user has permission to perform action on resource
   */
  async checkPermission(
    user: User,
    action: string,
    resource: string | Resource,
    context?: Record<string, any>
  ): Promise<AccessDecision> {
    const resourceObj =
      typeof resource === 'string' ? this.resources.get(resource) : resource;

    if (!resourceObj) {
      return {
        allowed: false,
        reason: 'Resource not found',
        matchedPolicies: [],
        matchedRoles: [],
        matchedPermissions: [],
      };
    }

    // Check policies first (highest priority)
    if (this.config.enablePolicyEngine) {
      const policyDecision = await this.evaluatePolicies(
        user,
        action,
        resourceObj,
        context
      );
      if (policyDecision.allowed !== null) {
        return policyDecision;
      }
    }

    // Check role-based permissions
    const roleDecision = await this.evaluateRoles(
      user,
      action,
      resourceObj,
      context
    );
    if (roleDecision.allowed) {
      return roleDecision;
    }

    // Check resource ownership
    if (this.config.enableResourceOwnership && resourceObj.owner === user.id) {
      return {
        allowed: true,
        reason: 'Resource owner',
        matchedPolicies: [],
        matchedRoles: [],
        matchedPermissions: ['owner'],
      };
    }

    return {
      allowed: this.config.defaultDeny ? false : true,
      reason: this.config.defaultDeny
        ? 'Default deny policy'
        : 'Default allow policy',
      matchedPolicies: [],
      matchedRoles: [],
      matchedPermissions: [],
    };
  }

  /**
   * Evaluate policies for access decision
   */
  private async evaluatePolicies(
    user: User,
    action: string,
    resource: Resource,
    context?: Record<string, any>
  ): Promise<AccessDecision> {
    const sortedPolicies = Array.from(this.policies.values())
      .filter((p) => p.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const policy of sortedPolicies) {
      for (const rule of policy.rules) {
        if (this.matchesRule(user, action, resource, rule, context)) {
          return {
            allowed: rule.effect === 'allow',
            reason: `Policy: ${policy.name}`,
            matchedPolicies: [policy.id],
            matchedRoles: [],
            matchedPermissions: [],
          };
        }
      }
    }

    return {
      allowed: null as any,
      reason: 'No policy matched',
      matchedPolicies: [],
      matchedRoles: [],
      matchedPermissions: [],
    };
  }

  /**
   * Evaluate role-based permissions
   */
  private async evaluateRoles(
    user: User,
    action: string,
    resource: Resource,
    context?: Record<string, any>
  ): Promise<AccessDecision> {
    const userRoles = await this.getUserRoles(user);
    const matchedRoles: string[] = [];
    const matchedPermissions: string[] = [];

    for (const roleId of userRoles) {
      const role = this.roles.get(roleId);
      if (!role) continue;

      matchedRoles.push(roleId);

      // Check direct permissions
      for (const permissionId of role.permissions) {
        const permission = this.permissions.get(permissionId);
        if (!permission) continue;

        if (this.matchesPermission(permission, action, resource, context)) {
          matchedPermissions.push(permissionId);
          return {
            allowed: true,
            reason: `Role: ${role.name}`,
            matchedPolicies: [],
            matchedRoles: [roleId],
            matchedPermissions: [permissionId],
          };
        }
      }

      // Check inherited roles
      if (this.config.enableHierarchicalRoles && role.inherits) {
        for (const inheritedRoleId of role.inherits) {
          const inheritedRole = this.roles.get(inheritedRoleId);
          if (!inheritedRole) continue;

          for (const permissionId of inheritedRole.permissions) {
            const permission = this.permissions.get(permissionId);
            if (!permission) continue;

            if (this.matchesPermission(permission, action, resource, context)) {
              matchedPermissions.push(permissionId);
              return {
                allowed: true,
                reason: `Inherited role: ${inheritedRole.name}`,
                matchedPolicies: [],
                matchedRoles: [roleId, inheritedRoleId],
                matchedPermissions: [permissionId],
              };
            }
          }
        }
      }
    }

    return {
      allowed: false,
      reason: 'No matching permissions found',
      matchedPolicies: [],
      matchedRoles: matchedRoles,
      matchedPermissions: matchedPermissions,
    };
  }

  /**
   * Check if rule matches user, action, and resource
   */
  private matchesRule(
    user: User,
    action: string,
    resource: Resource,
    rule: PolicyRule,
    context?: Record<string, any>
  ): boolean {
    // Check subjects
    if (!this.matchesSubjects(user, rule.subjects)) {
      return false;
    }

    // Check resources
    if (!this.matchesResourcePatterns(resource, rule.resources)) {
      return false;
    }

    // Check actions
    if (!this.matchesActionPatterns(action, rule.actions)) {
      return false;
    }

    // Check conditions
    if (rule.conditions && !this.evaluateConditions(rule.conditions, context)) {
      return false;
    }

    return true;
  }

  /**
   * Check if permission matches action and resource
   */
  private matchesPermission(
    permission: Permission,
    action: string,
    resource: Resource,
    context?: Record<string, any>
  ): boolean {
    // Check resource type
    if (permission.resource !== '*' && permission.resource !== resource.type) {
      return false;
    }

    // Check action
    if (permission.action !== '*' && permission.action !== action) {
      return false;
    }

    // Check conditions
    if (
      permission.conditions &&
      !this.evaluateConditions(permission.conditions, context)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Check if user matches subject patterns
   */
  private matchesSubjects(user: User, subjects: string[]): boolean {
    return subjects.some((subject) => {
      if (subject === '*') return true;
      if (subject === user.id) return true;
      if (
        subject.startsWith('role:') &&
        user.roles.includes(subject.substring(5))
      )
        return true;
      return false;
    });
  }

  /**
   * Check if resource matches resource patterns
   */
  private matchesResourcePatterns(
    resource: Resource,
    patterns: string[]
  ): boolean {
    return patterns.some((pattern) => {
      if (pattern === '*') return true;
      if (pattern === resource.id) return true;
      if (pattern === resource.type) return true;
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(resource.id) || regex.test(resource.type);
      }
      return false;
    });
  }

  /**
   * Check if action matches action patterns
   */
  private matchesActionPatterns(action: string, patterns: string[]): boolean {
    return patterns.some((pattern) => {
      if (pattern === '*') return true;
      if (pattern === action) return true;
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(action);
      }
      return false;
    });
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(
    conditions: PermissionCondition[],
    context?: Record<string, any>
  ): boolean {
    return conditions.every((condition) => {
      const value = context?.[condition.field];

      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'not_equals':
          return value !== condition.value;
        case 'in':
          return (
            Array.isArray(condition.value) && condition.value.includes(value)
          );
        case 'not_in':
          return (
            Array.isArray(condition.value) && !condition.value.includes(value)
          );
        case 'contains':
          return typeof value === 'string' && value.includes(condition.value);
        case 'starts_with':
          return typeof value === 'string' && value.startsWith(condition.value);
        case 'ends_with':
          return typeof value === 'string' && value.endsWith(condition.value);
        default:
          return false;
      }
    });
  }

  /**
   * Get all roles for a user (including inherited)
   */
  private async getUserRoles(user: User): Promise<string[]> {
    const allRoles = new Set<string>();

    // Add direct roles
    for (const roleName of user.roles) {
      const role = Array.from(this.roles.values()).find(
        (r) => r.name === roleName
      );
      if (role) {
        allRoles.add(role.id);
      }
    }

    // Add inherited roles
    if (this.config.enableHierarchicalRoles) {
      const rolesToProcess = Array.from(allRoles);

      while (rolesToProcess.length > 0) {
        const roleId = rolesToProcess.pop()!;
        const role = this.roles.get(roleId);

        if (role?.inherits) {
          for (const inheritedRoleId of role.inherits) {
            if (!allRoles.has(inheritedRoleId)) {
              allRoles.add(inheritedRoleId);
              rolesToProcess.push(inheritedRoleId);
            }
          }
        }
      }
    }

    return Array.from(allRoles);
  }

  /**
   * Create a new permission
   */
  createPermission(permission: Omit<Permission, 'id'>): Permission {
    const id = `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPermission: Permission = { ...permission, id };
    this.permissions.set(id, newPermission);
    return newPermission;
  }

  /**
   * Create a new role
   */
  createRole(role: Omit<Role, 'id'>): Role {
    const id = `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newRole: Role = { ...role, id };
    this.roles.set(id, newRole);
    return newRole;
  }

  /**
   * Create a new policy
   */
  createPolicy(policy: Omit<Policy, 'id'>): Policy {
    const id = `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPolicy: Policy = { ...policy, id };
    this.policies.set(id, newPolicy);
    return newPolicy;
  }

  /**
   * Create a new resource
   */
  createResource(resource: Omit<Resource, 'id'>): Resource {
    const id = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newResource: Resource = { ...resource, id };
    this.resources.set(id, newResource);
    return newResource;
  }

  /**
   * Initialize default permissions
   */
  private initializeDefaultPermissions(): void {
    const defaultPermissions: Omit<Permission, 'id'>[] = [
      { name: 'read_users', resource: 'user', action: 'read' },
      { name: 'write_users', resource: 'user', action: 'write' },
      { name: 'delete_users', resource: 'user', action: 'delete' },
      { name: 'read_posts', resource: 'post', action: 'read' },
      { name: 'write_posts', resource: 'post', action: 'write' },
      { name: 'delete_posts', resource: 'post', action: 'delete' },
      { name: 'admin_all', resource: '*', action: '*' },
    ];

    defaultPermissions.forEach((perm) => {
      this.createPermission(perm);
    });
  }

  /**
   * Initialize default roles
   */
  private initializeDefaultRoles(): void {
    const readUsersPerm = Array.from(this.permissions.values()).find(
      (p) => p.name === 'read_users'
    );
    const writeUsersPerm = Array.from(this.permissions.values()).find(
      (p) => p.name === 'write_users'
    );
    const adminAllPerm = Array.from(this.permissions.values()).find(
      (p) => p.name === 'admin_all'
    );

    const defaultRoles: Omit<Role, 'id'>[] = [
      {
        name: 'user',
        description: 'Basic user role',
        permissions: readUsersPerm ? [readUsersPerm.id] : [],
      },
      {
        name: 'moderator',
        description: 'Moderator role',
        permissions:
          readUsersPerm && writeUsersPerm
            ? [readUsersPerm.id, writeUsersPerm.id]
            : [],
        inherits: ['user'],
      },
      {
        name: 'admin',
        description: 'Administrator role',
        permissions: adminAllPerm ? [adminAllPerm.id] : [],
        inherits: ['moderator'],
      },
    ];

    defaultRoles.forEach((role) => {
      this.createRole(role);
    });
  }
}

export function createAdvancedRBACService(
  config: RBACConfig
): AdvancedRBACService {
  return new AdvancedRBACService(config);
}
