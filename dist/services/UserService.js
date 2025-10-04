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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    initializeUsers(initialUsers) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const userData of initialUsers) {
                const user = yield this.createUserFromData(userData);
                this.users.set(user.id, user);
                this.emailIndex.set(user.email.toLowerCase(), user.id);
                this.usernameIndex.set(user.username.toLowerCase(), user.id);
            }
        });
    }
    createUserFromData(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const hashedPassword = userData.password ? yield bcrypt.hash(userData.password, 10) : undefined;
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
        });
    }
    createUser(request) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if user already exists
            if (this.emailIndex.has(request.email.toLowerCase())) {
                throw new Error('User with this email already exists');
            }
            if (this.usernameIndex.has(request.username.toLowerCase())) {
                throw new Error('User with this username already exists');
            }
            const user = yield this.createUserFromData({
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
        });
    }
    createUserSync(userData) {
        const user = {
            id: Math.random().toString(36).substr(2, 9),
            email: userData.email,
            username: userData.username,
            password: userData.password,
            roles: userData.roles || ['user'],
            permissions: userData.permissions || ['read:profile'],
            profile: userData.profile || {},
            metadata: userData.metadata || {},
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            isLocked: false,
            failedLoginAttempts: 0
        };
        this.users.set(user.id, user);
        this.emailIndex.set(user.email.toLowerCase(), user.id);
        this.usernameIndex.set(user.username.toLowerCase(), user.id);
        return user;
    }
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.users.get(id) || null;
        });
    }
    getUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = this.emailIndex.get(email.toLowerCase());
            return userId ? this.users.get(userId) || null : null;
        });
    }
    getUserByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = this.usernameIndex.get(username.toLowerCase());
            return userId ? this.users.get(userId) || null : null;
        });
    }
    getAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return Array.from(this.users.values());
        });
    }
    updateUser(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const user = this.users.get(id);
            if (!user) {
                return null;
            }
            // Check for email conflicts
            if (((_a = updates.profile) === null || _a === void 0 ? void 0 : _a.firstName) !== undefined || ((_b = updates.profile) === null || _b === void 0 ? void 0 : _b.lastName) !== undefined) {
                // Profile update - no conflicts
            }
            const updatedUser = Object.assign(Object.assign(Object.assign({}, user), updates), { profile: Object.assign(Object.assign({}, user.profile), updates.profile), metadata: Object.assign(Object.assign({}, user.metadata), updates.metadata), updatedAt: new Date() });
            this.users.set(id, updatedUser);
            return updatedUser;
        });
    }
    deleteUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = this.users.get(id);
            if (!user) {
                return false;
            }
            this.users.delete(id);
            this.emailIndex.delete(user.email.toLowerCase());
            this.usernameIndex.delete(user.username.toLowerCase());
            return true;
        });
    }
    authenticateUser(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getUserByEmail(email);
            if (!user || !user.password) {
                return null;
            }
            // Check if account is locked
            if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
                throw new Error('Account is locked due to too many failed login attempts');
            }
            const isValidPassword = yield bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                // Increment failed login attempts
                const updatedUser = yield this.updateUser(user.id, {
                    failedLoginAttempts: user.failedLoginAttempts + 1,
                });
                // Lock account if max attempts reached
                if (updatedUser && updatedUser.failedLoginAttempts >= 5) {
                    const lockoutDuration = 15 * 60 * 1000; // 15 minutes
                    yield this.updateUser(user.id, {
                        isLocked: true,
                        lockedUntil: new Date(Date.now() + lockoutDuration),
                    });
                }
                return null;
            }
            // Reset failed login attempts on successful login
            if (user.failedLoginAttempts > 0) {
                yield this.updateUser(user.id, {
                    failedLoginAttempts: 0,
                    isLocked: false,
                    lockedUntil: undefined,
                });
            }
            // Update last login time
            yield this.updateUser(user.id, {
                lastLoginAt: new Date(),
            });
            return user;
        });
    }
    searchUsers(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, limit = 10) {
            var _a, _b, _c, _d;
            const searchTerm = query.toLowerCase();
            const results = [];
            for (const user of this.users.values()) {
                if (results.length >= limit)
                    break;
                if (user.email.toLowerCase().includes(searchTerm) ||
                    user.username.toLowerCase().includes(searchTerm) ||
                    ((_b = (_a = user.profile) === null || _a === void 0 ? void 0 : _a.firstName) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(searchTerm)) ||
                    ((_d = (_c = user.profile) === null || _c === void 0 ? void 0 : _c.lastName) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes(searchTerm))) {
                    results.push(user);
                }
            }
            return results;
        });
    }
    getUsersByRole(role) {
        return __awaiter(this, void 0, void 0, function* () {
            return Array.from(this.users.values()).filter(user => user.roles.includes(role));
        });
    }
    hasPermission(userId, permission) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = this.users.get(userId);
            if (!user)
                return false;
            return user.permissions.includes(permission);
        });
    }
    hasRole(userId, role) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = this.users.get(userId);
            if (!user)
                return false;
            return user.roles.includes(role);
        });
    }
    getUserStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const users = Array.from(this.users.values());
            const stats = {
                total: users.length,
                active: users.filter(u => u.isActive && !u.isLocked).length,
                locked: users.filter(u => u.isLocked).length,
                byRole: {},
            };
            // Count users by role
            for (const user of users) {
                for (const role of user.roles) {
                    stats.byRole[role] = (stats.byRole[role] || 0) + 1;
                }
            }
            return stats;
        });
    }
    validatePassword(password, policy) {
        return __awaiter(this, void 0, void 0, function* () {
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
            if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
                errors.push('Password must contain at least one special character');
            }
            return {
                valid: errors.length === 0,
                errors,
            };
        });
    }
}
exports.UserService = UserService;
//# sourceMappingURL=UserService.js.map