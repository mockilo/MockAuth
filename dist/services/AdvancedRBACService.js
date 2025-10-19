"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedRBACService = void 0;
exports.createAdvancedRBACService = createAdvancedRBACService;
class AdvancedRBACService {
    constructor(config) {
        this.permissions = new Map();
        this.roles = new Map();
        this.policies = new Map();
        this.resources = new Map();
        this.config = config;
        this.initializeDefaultPermissions();
        this.initializeDefaultRoles();
    }
    /**
     * Check if user has permission to perform action on resource
     */
    async checkPermission(user, action, resource, context) {
        const resourceObj = typeof resource === 'string' ? this.resources.get(resource) : resource;
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
            const policyDecision = await this.evaluatePolicies(user, action, resourceObj, context);
            if (policyDecision.allowed !== null) {
                return policyDecision;
            }
        }
        // Check role-based permissions
        const roleDecision = await this.evaluateRoles(user, action, resourceObj, context);
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
    async evaluatePolicies(user, action, resource, context) {
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
            allowed: null,
            reason: 'No policy matched',
            matchedPolicies: [],
            matchedRoles: [],
            matchedPermissions: [],
        };
    }
    /**
     * Evaluate role-based permissions
     */
    async evaluateRoles(user, action, resource, context) {
        const userRoles = await this.getUserRoles(user);
        const matchedRoles = [];
        const matchedPermissions = [];
        for (const roleId of userRoles) {
            const role = this.roles.get(roleId);
            if (!role)
                continue;
            matchedRoles.push(roleId);
            // Check direct permissions
            for (const permissionId of role.permissions) {
                const permission = this.permissions.get(permissionId);
                if (!permission)
                    continue;
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
                    if (!inheritedRole)
                        continue;
                    for (const permissionId of inheritedRole.permissions) {
                        const permission = this.permissions.get(permissionId);
                        if (!permission)
                            continue;
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
    matchesRule(user, action, resource, rule, context) {
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
    matchesPermission(permission, action, resource, context) {
        // Check resource type
        if (permission.resource !== '*' && permission.resource !== resource.type) {
            return false;
        }
        // Check action
        if (permission.action !== '*' && permission.action !== action) {
            return false;
        }
        // Check conditions
        if (permission.conditions &&
            !this.evaluateConditions(permission.conditions, context)) {
            return false;
        }
        return true;
    }
    /**
     * Check if user matches subject patterns
     */
    matchesSubjects(user, subjects) {
        return subjects.some((subject) => {
            if (subject === '*')
                return true;
            if (subject === user.id)
                return true;
            if (subject.startsWith('role:') &&
                user.roles.includes(subject.substring(5)))
                return true;
            return false;
        });
    }
    /**
     * Check if resource matches resource patterns
     */
    matchesResourcePatterns(resource, patterns) {
        return patterns.some((pattern) => {
            if (pattern === '*')
                return true;
            if (pattern === resource.id)
                return true;
            if (pattern === resource.type)
                return true;
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
    matchesActionPatterns(action, patterns) {
        return patterns.some((pattern) => {
            if (pattern === '*')
                return true;
            if (pattern === action)
                return true;
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
    evaluateConditions(conditions, context) {
        return conditions.every((condition) => {
            const value = context?.[condition.field];
            switch (condition.operator) {
                case 'equals':
                    return value === condition.value;
                case 'not_equals':
                    return value !== condition.value;
                case 'in':
                    return (Array.isArray(condition.value) && condition.value.includes(value));
                case 'not_in':
                    return (Array.isArray(condition.value) && !condition.value.includes(value));
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
    async getUserRoles(user) {
        const allRoles = new Set();
        // Add direct roles
        for (const roleName of user.roles) {
            const role = Array.from(this.roles.values()).find((r) => r.name === roleName);
            if (role) {
                allRoles.add(role.id);
            }
        }
        // Add inherited roles
        if (this.config.enableHierarchicalRoles) {
            const rolesToProcess = Array.from(allRoles);
            while (rolesToProcess.length > 0) {
                const roleId = rolesToProcess.pop();
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
    createPermission(permission) {
        const id = `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newPermission = { ...permission, id };
        this.permissions.set(id, newPermission);
        return newPermission;
    }
    /**
     * Create a new role
     */
    createRole(role) {
        const id = `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newRole = { ...role, id };
        this.roles.set(id, newRole);
        return newRole;
    }
    /**
     * Create a new policy
     */
    createPolicy(policy) {
        const id = `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newPolicy = { ...policy, id };
        this.policies.set(id, newPolicy);
        return newPolicy;
    }
    /**
     * Create a new resource
     */
    createResource(resource) {
        const id = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newResource = { ...resource, id };
        this.resources.set(id, newResource);
        return newResource;
    }
    /**
     * Initialize default permissions
     */
    initializeDefaultPermissions() {
        const defaultPermissions = [
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
    initializeDefaultRoles() {
        const readUsersPerm = Array.from(this.permissions.values()).find((p) => p.name === 'read_users');
        const writeUsersPerm = Array.from(this.permissions.values()).find((p) => p.name === 'write_users');
        const adminAllPerm = Array.from(this.permissions.values()).find((p) => p.name === 'admin_all');
        const defaultRoles = [
            {
                name: 'user',
                description: 'Basic user role',
                permissions: readUsersPerm ? [readUsersPerm.id] : [],
            },
            {
                name: 'moderator',
                description: 'Moderator role',
                permissions: readUsersPerm && writeUsersPerm
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
exports.AdvancedRBACService = AdvancedRBACService;
function createAdvancedRBACService(config) {
    return new AdvancedRBACService(config);
}
//# sourceMappingURL=AdvancedRBACService.js.map