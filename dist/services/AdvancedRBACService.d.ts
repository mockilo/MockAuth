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
    permissions: string[];
    inherits?: string[];
    metadata?: Record<string, any>;
}
export interface PermissionCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'starts_with' | 'ends_with';
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
    subjects: string[];
    resources: string[];
    actions: string[];
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
export declare class AdvancedRBACService {
    private config;
    private permissions;
    private roles;
    private policies;
    private resources;
    constructor(config: RBACConfig);
    /**
     * Check if user has permission to perform action on resource
     */
    checkPermission(user: User, action: string, resource: string | Resource, context?: Record<string, any>): Promise<AccessDecision>;
    /**
     * Evaluate policies for access decision
     */
    private evaluatePolicies;
    /**
     * Evaluate role-based permissions
     */
    private evaluateRoles;
    /**
     * Check if rule matches user, action, and resource
     */
    private matchesRule;
    /**
     * Check if permission matches action and resource
     */
    private matchesPermission;
    /**
     * Check if user matches subject patterns
     */
    private matchesSubjects;
    /**
     * Check if resource matches resource patterns
     */
    private matchesResourcePatterns;
    /**
     * Check if action matches action patterns
     */
    private matchesActionPatterns;
    /**
     * Evaluate conditions
     */
    private evaluateConditions;
    /**
     * Get all roles for a user (including inherited)
     */
    private getUserRoles;
    /**
     * Create a new permission
     */
    createPermission(permission: Omit<Permission, 'id'>): Permission;
    /**
     * Create a new role
     */
    createRole(role: Omit<Role, 'id'>): Role;
    /**
     * Create a new policy
     */
    createPolicy(policy: Omit<Policy, 'id'>): Policy;
    /**
     * Create a new resource
     */
    createResource(resource: Omit<Resource, 'id'>): Resource;
    /**
     * Initialize default permissions
     */
    private initializeDefaultPermissions;
    /**
     * Initialize default roles
     */
    private initializeDefaultRoles;
}
export declare function createAdvancedRBACService(config: RBACConfig): AdvancedRBACService;
//# sourceMappingURL=AdvancedRBACService.d.ts.map