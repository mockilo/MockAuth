import { User, Session, LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse, MFASetupResponse, MFAVerifyRequest, MFAVerifyResponse, PasswordResetRequest, PasswordResetResponse, PasswordResetVerifyRequest, PasswordResetCompleteRequest, PasswordResetCompleteResponse, AccountLockoutConfig, UnlockAccountRequest, UnlockAccountResponse } from '../types';
import { UserService } from './UserService';
export declare class AuthService {
    private userService;
    private jwtSecret;
    private tokenExpiry;
    private refreshTokenExpiry;
    private lockoutConfig?;
    private sessions;
    private userSessions;
    private refreshTokens;
    private passwordResetService;
    private lockoutService;
    constructor(userService: UserService, jwtSecret: string, tokenExpiry?: string, refreshTokenExpiry?: string, lockoutConfig?: AccountLockoutConfig | undefined);
    login(request: LoginRequest): Promise<LoginResponse>;
    register(userData: {
        email: string;
        password: string;
        username: string;
        profile?: any;
        roles?: string[];
        permissions?: string[];
    }): Promise<LoginResponse>;
    logout(sessionId: string): Promise<boolean>;
    refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse>;
    verifyToken(token: string): Promise<User | null>;
    getCurrentUser(token: string): Promise<User | null>;
    getUserSessions(userId: string): Promise<Session[]>;
    revokeSession(sessionId: string, userId: string): Promise<boolean>;
    revokeAllSessions(userId: string): Promise<number>;
    private createSession;
    private generateToken;
    private generateRefreshToken;
    private parseExpiry;
    private sanitizeUser;
    cleanupExpiredSessions(): Promise<number>;
    getSessionStats(): Promise<{
        total: number;
        active: number;
        expired: number;
        byUser: Record<string, number>;
    }>;
    /**
     * Setup MFA for a user
     */
    setupMFA(userId: string): Promise<MFASetupResponse>;
    /**
     * Verify MFA setup code and enable MFA
     */
    verifyMFASetup(userId: string, request: MFAVerifyRequest): Promise<MFAVerifyResponse>;
    /**
     * Verify MFA code during login
     */
    verifyMFA(userId: string, request: MFAVerifyRequest): Promise<MFAVerifyResponse>;
    /**
     * Disable MFA for a user
     */
    disableMFA(userId: string): Promise<boolean>;
    /**
     * Get MFA status for a user
     */
    getMFAStatus(userId: string): Promise<{
        enabled: boolean;
        backupCodesCount: number;
        lastUsed?: Date;
    }>;
    /**
     * Generate new backup codes for MFA
     */
    regenerateBackupCodes(userId: string): Promise<string[]>;
    /**
     * Request password reset
     */
    requestPasswordReset(request: PasswordResetRequest): Promise<PasswordResetResponse>;
    /**
     * Verify password reset token
     */
    verifyPasswordResetToken(request: PasswordResetVerifyRequest): Promise<{
        valid: boolean;
        message: string;
    }>;
    /**
     * Complete password reset
     */
    completePasswordReset(request: PasswordResetCompleteRequest): Promise<PasswordResetCompleteResponse>;
    /**
     * Get password reset statistics
     */
    getPasswordResetStats(): {
        total: number;
        active: number;
        expired: number;
        used: number;
    };
    /**
     * Clean up expired password reset tokens
     */
    cleanupExpiredPasswordResetTokens(): Promise<number>;
    /**
     * Unlock an account (admin function)
     */
    unlockAccount(request: UnlockAccountRequest, unlockedBy: string): Promise<UnlockAccountResponse>;
    /**
     * Get lockout status for a user
     */
    getLockoutStatus(userId: string): Promise<{
        isLocked: boolean;
        lockedUntil?: Date;
        attempts?: number;
    }>;
    /**
     * Get lockout statistics
     */
    getLockoutStats(): {
        totalLocked: number;
        totalAttempts: number;
        averageAttempts: number;
        byReason: Record<string, number>;
    };
    /**
     * Get lockout record for a user
     */
    getLockoutRecord(userId: string): import("./AccountLockoutService").LockoutRecord | null;
    /**
     * Clean up expired lockout records
     */
    cleanupExpiredLockoutRecords(): Promise<number>;
    /**
     * Update lockout configuration
     */
    updateLockoutConfig(newConfig: Partial<AccountLockoutConfig>): void;
    /**
     * Get current lockout configuration
     */
    getLockoutConfig(): AccountLockoutConfig;
    /**
     * Get sessions by device type
     */
    getSessionsByDevice(userId: string, deviceType?: string): Promise<Session[]>;
    /**
     * Get session analytics for a user
     */
    getSessionAnalytics(userId: string): Promise<{
        totalSessions: number;
        activeSessions: number;
        byDevice: Record<string, number>;
        byLocation: Record<string, number>;
        averageSessionDuration: number;
        lastActivity: Date | null;
    }>;
    /**
     * Revoke sessions by device type
     */
    revokeSessionsByDevice(userId: string, deviceType: string): Promise<number>;
    /**
     * Revoke all sessions except current
     */
    revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<number>;
    /**
     * Get session statistics across all users
     */
    getGlobalSessionStats(): Promise<{
        totalSessions: number;
        activeSessions: number;
        expiredSessions: number;
        byDevice: Record<string, number>;
        byUser: Record<string, number>;
        averageSessionsPerUser: number;
    }>;
}
//# sourceMappingURL=AuthService.d.ts.map