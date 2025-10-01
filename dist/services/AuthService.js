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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const MFAService_1 = require("./MFAService");
const PasswordResetService_1 = require("./PasswordResetService");
const AccountLockoutService_1 = require("./AccountLockoutService");
class AuthService {
    constructor(userService, jwtSecret, tokenExpiry = '24h', refreshTokenExpiry = '7d', lockoutConfig) {
        this.userService = userService;
        this.jwtSecret = jwtSecret;
        this.tokenExpiry = tokenExpiry;
        this.refreshTokenExpiry = refreshTokenExpiry;
        this.lockoutConfig = lockoutConfig;
        this.sessions = new Map();
        this.userSessions = new Map();
        this.refreshTokens = new Map(); // refreshToken -> sessionId
        this.passwordResetService = new PasswordResetService_1.PasswordResetService();
        this.lockoutService = new AccountLockoutService_1.AccountLockoutService(lockoutConfig);
    }
    login(request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // Check if account is locked before attempting authentication
            const lockoutStatus = yield this.lockoutService.isAccountLocked(request.email);
            if (lockoutStatus.isLocked) {
                throw new Error(`Account is locked until ${(_a = lockoutStatus.lockedUntil) === null || _a === void 0 ? void 0 : _a.toISOString()}`);
            }
            const user = yield this.userService.authenticateUser(request.email, request.password);
            if (!user) {
                // Record failed attempt
                const lockoutResult = yield this.lockoutService.recordFailedAttempt(request.email);
                if (lockoutResult.isLocked) {
                    throw new Error(`Account locked due to too many failed attempts. Try again after ${(_b = lockoutResult.lockedUntil) === null || _b === void 0 ? void 0 : _b.toISOString()}`);
                }
                throw new Error(`Invalid credentials. ${lockoutResult.attemptsRemaining} attempts remaining.`);
            }
            if (!user.isActive) {
                throw new Error('Account is deactivated');
            }
            // Clear failed attempts on successful login
            yield this.lockoutService.clearFailedAttempts(request.email);
            // Create session
            const session = yield this.createSession(user, {
                device: request.device,
                ipAddress: request.ipAddress,
                userAgent: request.userAgent,
            });
            // Generate tokens
            const token = this.generateToken(user, session.id);
            const refreshToken = this.generateRefreshToken(session.id);
            return {
                success: true,
                user: this.sanitizeUser(user),
                token,
                refreshToken,
                expiresIn: this.tokenExpiry,
                sessionId: session.id,
            };
        });
    }
    register(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userService.createUser(userData);
            // Create session
            const session = yield this.createSession(user, {
                device: 'Unknown',
                ipAddress: '127.0.0.1',
                userAgent: 'MockAuth/1.0.0',
            });
            // Generate tokens
            const token = this.generateToken(user, session.id);
            const refreshToken = this.generateRefreshToken(session.id);
            return {
                success: true,
                user: this.sanitizeUser(user),
                token,
                refreshToken,
                expiresIn: this.tokenExpiry,
                sessionId: session.id,
            };
        });
    }
    logout(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = this.sessions.get(sessionId);
            if (!session) {
                return false;
            }
            // Remove session
            this.sessions.delete(sessionId);
            // Remove from user sessions
            const userSessions = this.userSessions.get(session.userId) || [];
            const updatedUserSessions = userSessions.filter(id => id !== sessionId);
            if (updatedUserSessions.length > 0) {
                this.userSessions.set(session.userId, updatedUserSessions);
            }
            else {
                this.userSessions.delete(session.userId);
            }
            // Remove refresh token
            this.refreshTokens.delete(session.refreshToken);
            return true;
        });
    }
    refreshToken(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionId = this.refreshTokens.get(request.refreshToken);
            if (!sessionId) {
                throw new Error('Invalid refresh token');
            }
            const session = this.sessions.get(sessionId);
            if (!session || !session.isActive) {
                throw new Error('Session not found or inactive');
            }
            const user = yield this.userService.getUserById(session.userId);
            if (!user || !user.isActive) {
                throw new Error('User not found or inactive');
            }
            // Generate new token
            const token = this.generateToken(user, session.id);
            return {
                success: true,
                token,
                expiresIn: this.tokenExpiry,
            };
        });
    }
    verifyToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = jwt.verify(token, this.jwtSecret);
                // Check if session exists and is active
                const session = this.sessions.get(payload.sessionId);
                if (!session || !session.isActive) {
                    return null;
                }
                // Check if token is expired
                if (payload.exp < Date.now() / 1000) {
                    return null;
                }
                // Get user
                const user = yield this.userService.getUserById(payload.userId);
                if (!user || !user.isActive) {
                    return null;
                }
                // Update last activity
                session.lastActivityAt = new Date();
                this.sessions.set(session.id, session);
                return user;
            }
            catch (error) {
                return null;
            }
        });
    }
    getCurrentUser(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.verifyToken(token);
        });
    }
    getUserSessions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionIds = this.userSessions.get(userId) || [];
            return sessionIds
                .map(id => this.sessions.get(id))
                .filter((session) => session !== undefined);
        });
    }
    revokeSession(sessionId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = this.sessions.get(sessionId);
            if (!session || session.userId !== userId) {
                return false;
            }
            return this.logout(sessionId);
        });
    }
    revokeAllSessions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionIds = this.userSessions.get(userId) || [];
            let revokedCount = 0;
            for (const sessionId of sessionIds) {
                if (yield this.logout(sessionId)) {
                    revokedCount++;
                }
            }
            return revokedCount;
        });
    }
    createSession(user, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionId = (0, uuid_1.v4)();
            const now = new Date();
            const expiresAt = new Date(now.getTime() + this.parseExpiry(this.tokenExpiry));
            const session = {
                id: sessionId,
                userId: user.id,
                token: '', // Will be set by generateToken
                refreshToken: '', // Will be set by generateRefreshToken
                device: metadata.device,
                ipAddress: metadata.ipAddress,
                userAgent: metadata.userAgent,
                createdAt: now,
                lastActivityAt: now,
                expiresAt,
                isActive: true,
            };
            this.sessions.set(sessionId, session);
            // Add to user sessions
            const userSessions = this.userSessions.get(user.id) || [];
            userSessions.push(sessionId);
            this.userSessions.set(user.id, userSessions);
            return session;
        });
    }
    generateToken(user, sessionId) {
        const payload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            roles: user.roles,
            permissions: user.permissions,
            sessionId,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + this.parseExpiry(this.tokenExpiry) / 1000,
        };
        return jwt.sign(payload, this.jwtSecret);
    }
    generateRefreshToken(sessionId) {
        const refreshToken = (0, uuid_1.v4)();
        this.refreshTokens.set(refreshToken, sessionId);
        return refreshToken;
    }
    parseExpiry(expiry) {
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (!match) {
            return 24 * 60 * 60 * 1000; // Default 24 hours
        }
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: return 24 * 60 * 60 * 1000;
        }
    }
    sanitizeUser(user) {
        const { password } = user, sanitizedUser = __rest(user, ["password"]);
        return sanitizedUser;
    }
    cleanupExpiredSessions() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            let cleanedCount = 0;
            for (const [sessionId, session] of this.sessions.entries()) {
                if (session.expiresAt < now) {
                    this.logout(sessionId);
                    cleanedCount++;
                }
            }
            return cleanedCount;
        });
    }
    getSessionStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const sessions = Array.from(this.sessions.values());
            const stats = {
                total: sessions.length,
                active: sessions.filter(s => s.isActive && s.expiresAt > now).length,
                expired: sessions.filter(s => s.expiresAt <= now).length,
                byUser: {},
            };
            // Count sessions by user
            for (const session of sessions) {
                stats.byUser[session.userId] = (stats.byUser[session.userId] || 0) + 1;
            }
            return stats;
        });
    }
    // MFA Methods
    /**
     * Setup MFA for a user
     */
    setupMFA(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const user = yield this.userService.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            if ((_a = user.mfa) === null || _a === void 0 ? void 0 : _a.enabled) {
                throw new Error('MFA is already enabled for this user');
            }
            const mfaSetup = MFAService_1.MFAService.setupMFA(userId, user.email);
            const mfaConfig = MFAService_1.MFAService.createMFAConfig(mfaSetup.secret, mfaSetup.backupCodes);
            // Update user with MFA config (but don't enable yet)
            yield this.userService.updateUser(userId, {
                mfa: mfaConfig
            });
            return mfaSetup;
        });
    }
    /**
     * Verify MFA setup code and enable MFA
     */
    verifyMFASetup(userId, request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const user = yield this.userService.getUserById(userId);
            if (!user || !((_a = user.mfa) === null || _a === void 0 ? void 0 : _a.secret)) {
                throw new Error('MFA setup not found');
            }
            if (user.mfa.enabled) {
                throw new Error('MFA is already enabled');
            }
            let isValid = false;
            let remainingBackupCodes = user.mfa.backupCodes || [];
            if (request.backupCode) {
                const result = MFAService_1.MFAService.verifyBackupCode(user.mfa.backupCodes || [], request.backupCode);
                isValid = result.valid;
                remainingBackupCodes = result.remainingCodes;
            }
            else {
                isValid = MFAService_1.MFAService.verifyTOTP(user.mfa.secret, request.code);
            }
            if (!isValid) {
                return { success: false };
            }
            // Enable MFA
            const updatedMfaConfig = Object.assign(Object.assign({}, user.mfa), { enabled: true, lastUsed: new Date() });
            yield this.userService.updateUser(userId, {
                mfa: updatedMfaConfig
            });
            return {
                success: true,
                backupCodes: remainingBackupCodes
            };
        });
    }
    /**
     * Verify MFA code during login
     */
    verifyMFA(userId, request) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const user = yield this.userService.getUserById(userId);
            if (!user || !((_a = user.mfa) === null || _a === void 0 ? void 0 : _a.enabled)) {
                throw new Error('MFA not enabled for this user');
            }
            let isValid = false;
            let remainingBackupCodes = user.mfa.backupCodes || [];
            if (request.backupCode) {
                const result = MFAService_1.MFAService.verifyBackupCode(user.mfa.backupCodes || [], request.backupCode);
                isValid = result.valid;
                remainingBackupCodes = result.remainingCodes;
            }
            else {
                isValid = MFAService_1.MFAService.verifyTOTP(user.mfa.secret, request.code);
            }
            if (!isValid) {
                return { success: false };
            }
            // Update MFA config with new backup codes if used
            if (request.backupCode && remainingBackupCodes.length !== ((_b = user.mfa.backupCodes) === null || _b === void 0 ? void 0 : _b.length)) {
                const updatedMfaConfig = Object.assign(Object.assign({}, user.mfa), { backupCodes: remainingBackupCodes, lastUsed: new Date() });
                yield this.userService.updateUser(userId, {
                    mfa: updatedMfaConfig
                });
            }
            return {
                success: true,
                backupCodes: remainingBackupCodes
            };
        });
    }
    /**
     * Disable MFA for a user
     */
    disableMFA(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const user = yield this.userService.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            if (!((_a = user.mfa) === null || _a === void 0 ? void 0 : _a.enabled)) {
                throw new Error('MFA is not enabled for this user');
            }
            const disabledMfaConfig = MFAService_1.MFAService.disableMFA();
            yield this.userService.updateUser(userId, {
                mfa: disabledMfaConfig
            });
            return true;
        });
    }
    /**
     * Get MFA status for a user
     */
    getMFAStatus(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const user = yield this.userService.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            return {
                enabled: MFAService_1.MFAService.isMFAEnabled(user.mfa),
                backupCodesCount: MFAService_1.MFAService.getRemainingBackupCodes(user.mfa),
                lastUsed: (_a = user.mfa) === null || _a === void 0 ? void 0 : _a.lastUsed
            };
        });
    }
    /**
     * Generate new backup codes for MFA
     */
    regenerateBackupCodes(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const user = yield this.userService.getUserById(userId);
            if (!user || !((_a = user.mfa) === null || _a === void 0 ? void 0 : _a.enabled)) {
                throw new Error('MFA not enabled for this user');
            }
            const newBackupCodes = MFAService_1.MFAService.generateBackupCodes();
            const updatedMfaConfig = Object.assign(Object.assign({}, user.mfa), { backupCodes: newBackupCodes });
            yield this.userService.updateUser(userId, {
                mfa: updatedMfaConfig
            });
            return newBackupCodes;
        });
    }
    // Password Reset Methods
    /**
     * Request password reset
     */
    requestPasswordReset(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.passwordResetService.requestPasswordReset(request);
        });
    }
    /**
     * Verify password reset token
     */
    verifyPasswordResetToken(request) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.passwordResetService.verifyResetToken(request);
        });
    }
    /**
     * Complete password reset
     */
    completePasswordReset(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.passwordResetService.completePasswordReset(request);
            if (result.success) {
                // In a real implementation, you would update the user's password here
                // For MockAuth, we'll just return success
            }
            return result;
        });
    }
    /**
     * Get password reset statistics
     */
    getPasswordResetStats() {
        return this.passwordResetService.getStats();
    }
    /**
     * Clean up expired password reset tokens
     */
    cleanupExpiredPasswordResetTokens() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.passwordResetService.cleanupExpiredTokens();
        });
    }
    // Account Lockout Methods
    /**
     * Unlock an account (admin function)
     */
    unlockAccount(request, unlockedBy) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.lockoutService.unlockAccount(request, unlockedBy);
        });
    }
    /**
     * Get lockout status for a user
     */
    getLockoutStatus(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.lockoutService.isAccountLocked(userId);
        });
    }
    /**
     * Get lockout statistics
     */
    getLockoutStats() {
        return this.lockoutService.getLockoutStats();
    }
    /**
     * Get lockout record for a user
     */
    getLockoutRecord(userId) {
        return this.lockoutService.getLockoutRecord(userId);
    }
    /**
     * Clean up expired lockout records
     */
    cleanupExpiredLockoutRecords() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.lockoutService.cleanupExpiredRecords();
        });
    }
    /**
     * Update lockout configuration
     */
    updateLockoutConfig(newConfig) {
        this.lockoutService.updateConfig(newConfig);
    }
    /**
     * Get current lockout configuration
     */
    getLockoutConfig() {
        return this.lockoutService.getConfig();
    }
    // Enhanced Session Management
    /**
     * Get sessions by device type
     */
    getSessionsByDevice(userId, deviceType) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessions = yield this.getUserSessions(userId);
            if (!deviceType) {
                return sessions;
            }
            return sessions.filter(session => { var _a; return (_a = session.device) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(deviceType.toLowerCase()); });
        });
    }
    /**
     * Get session analytics for a user
     */
    getSessionAnalytics(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessions = yield this.getUserSessions(userId);
            const now = new Date();
            const activeSessions = sessions.filter(s => s.isActive && s.expiresAt > now);
            const byDevice = {};
            const byLocation = {};
            sessions.forEach(session => {
                const device = session.device || 'Unknown';
                const location = session.ipAddress || 'Unknown';
                byDevice[device] = (byDevice[device] || 0) + 1;
                byLocation[location] = (byLocation[location] || 0) + 1;
            });
            const totalDuration = sessions.reduce((sum, session) => {
                return sum + (session.lastActivityAt.getTime() - session.createdAt.getTime());
            }, 0);
            const averageSessionDuration = sessions.length > 0 ? totalDuration / sessions.length : 0;
            const lastActivity = sessions.length > 0
                ? new Date(Math.max(...sessions.map(s => s.lastActivityAt.getTime())))
                : null;
            return {
                totalSessions: sessions.length,
                activeSessions: activeSessions.length,
                byDevice,
                byLocation,
                averageSessionDuration,
                lastActivity
            };
        });
    }
    /**
     * Revoke sessions by device type
     */
    revokeSessionsByDevice(userId, deviceType) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessions = yield this.getSessionsByDevice(userId, deviceType);
            let revokedCount = 0;
            for (const session of sessions) {
                if (yield this.revokeSession(session.id, userId)) {
                    revokedCount++;
                }
            }
            return revokedCount;
        });
    }
    /**
     * Revoke all sessions except current
     */
    revokeAllOtherSessions(userId, currentSessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessions = yield this.getUserSessions(userId);
            let revokedCount = 0;
            for (const session of sessions) {
                if (session.id !== currentSessionId) {
                    if (yield this.revokeSession(session.id, userId)) {
                        revokedCount++;
                    }
                }
            }
            return revokedCount;
        });
    }
    /**
     * Get session statistics across all users
     */
    getGlobalSessionStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const allSessions = Array.from(this.sessions.values());
            const activeSessions = allSessions.filter(s => s.isActive && s.expiresAt > now);
            const expiredSessions = allSessions.filter(s => s.expiresAt <= now);
            const byDevice = {};
            const byUser = {};
            allSessions.forEach(session => {
                const device = session.device || 'Unknown';
                byDevice[device] = (byDevice[device] || 0) + 1;
                byUser[session.userId] = (byUser[session.userId] || 0) + 1;
            });
            const uniqueUsers = Object.keys(byUser).length;
            const averageSessionsPerUser = uniqueUsers > 0 ? allSessions.length / uniqueUsers : 0;
            return {
                totalSessions: allSessions.length,
                activeSessions: activeSessions.length,
                expiredSessions: expiredSessions.length,
                byDevice,
                byUser,
                averageSessionsPerUser
            };
        });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map