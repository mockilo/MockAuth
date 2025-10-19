"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const uuid_1 = require("uuid");
const bcrypt = __importStar(require("bcryptjs"));
class UserService {
    constructor(initialUsers = []) {
        this.users = new Map();
        this.emailIndex = new Map();
        this.usernameIndex = new Map();
        this.initializeUsers(initialUsers);
    }
    async initializeUsers(initialUsers) {
        for (const userData of initialUsers) {
            const user = await this.createUserFromData(userData);
            this.users.set(user.id, user);
            this.emailIndex.set(user.email.toLowerCase(), user.id);
            this.usernameIndex.set(user.username.toLowerCase(), user.id);
        }
    }
    async createUserFromData(userData) {
        const now = new Date();
        const hashedPassword = userData.password
            ? await bcrypt.hash(userData.password, 10)
            : undefined;
        return {
            id: userData.id || (0, uuid_1.v4)(),
            email: userData.email || '',
            username: userData.username || '',
            password: hashedPassword,
            roles: userData.roles || ['user'],
            permissions: userData.permissions || ['read:profile'],
            profile: userData.profile || {},
            metadata: userData.metadata || {},
            createdAt: userData.createdAt || now,
            updatedAt: now,
            lastLoginAt: userData.lastLoginAt,
            isActive: userData.isActive !== false,
            isLocked: userData.isLocked || false,
            failedLoginAttempts: userData.failedLoginAttempts || 0,
            lockedUntil: userData.lockedUntil,
        };
    }
    async createUser(request) {
        // Check if user already exists
        if (this.emailIndex.has(request.email.toLowerCase())) {
            throw new Error('User with this email already exists');
        }
        if (this.usernameIndex.has(request.username.toLowerCase())) {
            throw new Error('User with this username already exists');
        }
        const user = await this.createUserFromData({
            email: request.email,
            username: request.username,
            password: request.password,
            roles: request.roles || ['user'],
            permissions: request.permissions || ['read:profile'],
            profile: request.profile,
            metadata: request.metadata,
        });
        this.users.set(user.id, user);
        this.emailIndex.set(user.email.toLowerCase(), user.id);
        this.usernameIndex.set(user.username.toLowerCase(), user.id);
        return user;
    }
    createUserSync(userData) {
        // CRITICAL FIX: Hash password synchronously for security
        const hashedPassword = userData.password
            ? bcrypt.hashSync(userData.password, 10)
            : undefined;
        const user = {
            id: Math.random().toString(36).substr(2, 9),
            email: userData.email,
            username: userData.username,
            password: hashedPassword, // Now properly hashed!
            roles: userData.roles || ['user'],
            permissions: userData.permissions || ['read:profile'],
            profile: userData.profile || {},
            metadata: userData.metadata || {},
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            isLocked: false,
            failedLoginAttempts: 0,
        };
        this.users.set(user.id, user);
        this.emailIndex.set(user.email.toLowerCase(), user.id);
        this.usernameIndex.set(user.username.toLowerCase(), user.id);
        return user;
    }
    async getUserById(id) {
        return this.users.get(id) || null;
    }
    async getUserByEmail(email) {
        const userId = this.emailIndex.get(email.toLowerCase());
        return userId ? this.users.get(userId) || null : null;
    }
    async getUserByUsername(username) {
        const userId = this.usernameIndex.get(username.toLowerCase());
        return userId ? this.users.get(userId) || null : null;
    }
    async getAllUsers() {
        return Array.from(this.users.values());
    }
    async updateUser(id, updates) {
        const user = this.users.get(id);
        if (!user) {
            return null;
        }
        // Check for email conflicts
        if (updates.profile?.firstName !== undefined ||
            updates.profile?.lastName !== undefined) {
            // Profile update - no conflicts
        }
        const updatedUser = {
            ...user,
            ...updates,
            profile: { ...user.profile, ...updates.profile },
            metadata: { ...user.metadata, ...updates.metadata },
            updatedAt: new Date(),
        };
        this.users.set(id, updatedUser);
        return updatedUser;
    }
    async deleteUser(id) {
        const user = this.users.get(id);
        if (!user) {
            return false;
        }
        this.users.delete(id);
        this.emailIndex.delete(user.email.toLowerCase());
        this.usernameIndex.delete(user.username.toLowerCase());
        return true;
    }
    async authenticateUser(email, password) {
        const user = await this.getUserByEmail(email);
        if (!user || !user.password) {
            return null;
        }
        // CRITICAL FIX: Removed duplicate lockout logic - now handled by AuthService
        // This prevents race conditions and ensures single source of truth
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return null;
        }
        // Update last login time
        await this.updateUser(user.id, {
            lastLoginAt: new Date(),
        });
        return user;
    }
    async searchUsers(query, limit = 10) {
        const searchTerm = query.toLowerCase();
        const results = [];
        for (const user of this.users.values()) {
            if (results.length >= limit)
                break;
            if (user.email.toLowerCase().includes(searchTerm) ||
                user.username.toLowerCase().includes(searchTerm) ||
                user.profile?.firstName?.toLowerCase().includes(searchTerm) ||
                user.profile?.lastName?.toLowerCase().includes(searchTerm)) {
                results.push(user);
            }
        }
        return results;
    }
    async getUsersByRole(role) {
        return Array.from(this.users.values()).filter((user) => user.roles.includes(role));
    }
    async hasPermission(userId, permission) {
        const user = this.users.get(userId);
        if (!user)
            return false;
        return user.permissions.includes(permission);
    }
    async hasRole(userId, role) {
        const user = this.users.get(userId);
        if (!user)
            return false;
        return user.roles.includes(role);
    }
    async getUserStats() {
        const users = Array.from(this.users.values());
        const stats = {
            total: users.length,
            active: users.filter((u) => u.isActive && !u.isLocked).length,
            locked: users.filter((u) => u.isLocked).length,
            byRole: {},
        };
        // Count users by role
        for (const user of users) {
            for (const role of user.roles) {
                stats.byRole[role] = (stats.byRole[role] || 0) + 1;
            }
        }
        return stats;
    }
    async validatePassword(password, policy) {
        const errors = [];
        if (!policy) {
            return { valid: true, errors: [] };
        }
        if (password.length < policy.minLength) {
            errors.push(`Password must be at least ${policy.minLength} characters long`);
        }
        if (policy.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (policy.requireNumbers && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (policy.requireSpecialChars &&
            !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
exports.UserService = UserService;
//# sourceMappingURL=UserService.js.map