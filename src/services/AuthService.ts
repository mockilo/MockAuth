import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  Session,
  TokenPayload,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  MFAConfig,
  MFASetupResponse,
  MFAVerifyRequest,
  MFAVerifyResponse,
  PasswordResetRequest,
  PasswordResetResponse,
  PasswordResetVerifyRequest,
  PasswordResetCompleteRequest,
  PasswordResetCompleteResponse,
  AccountLockoutConfig,
  UnlockAccountRequest,
  UnlockAccountResponse,
} from '../types';
import { UserService } from './UserService';
import { MFAService } from './MFAService';
import { PasswordResetService } from './PasswordResetService';
import { AccountLockoutService } from './AccountLockoutService';

export class AuthService {
  private sessions: Map<string, Session> = new Map();
  private userSessions: Map<string, string[]> = new Map();
  private refreshTokens: Map<string, string> = new Map(); // refreshToken -> sessionId
  private passwordResetService: PasswordResetService;
  private lockoutService: AccountLockoutService;

  constructor(
    private userService: UserService,
    private jwtSecret: string,
    private tokenExpiry: string = '24h',
    private refreshTokenExpiry: string = '7d',
    private lockoutConfig?: AccountLockoutConfig
  ) {
    this.passwordResetService = new PasswordResetService();
    this.lockoutService = new AccountLockoutService(lockoutConfig);
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    // Check if account is locked before attempting authentication
    const lockoutStatus = await this.lockoutService.isAccountLocked(
      request.email
    );
    if (lockoutStatus.isLocked) {
      throw new Error(
        `Account is locked until ${lockoutStatus.lockedUntil?.toISOString()}`
      );
    }

    const user = await this.userService.authenticateUser(
      request.email,
      request.password
    );

    if (!user) {
      // Record failed attempt
      const lockoutResult = await this.lockoutService.recordFailedAttempt(
        request.email
      );
      if (lockoutResult.isLocked) {
        throw new Error(
          `Account locked due to too many failed attempts. Try again after ${lockoutResult.lockedUntil?.toISOString()}`
        );
      }
      throw new Error(
        `Invalid credentials. ${lockoutResult.attemptsRemaining} attempts remaining.`
      );
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Clear failed attempts on successful login
    await this.lockoutService.clearFailedAttempts(request.email);

    // Create session
    const session = await this.createSession(user, {
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
  }

  async register(userData: {
    email: string;
    password: string;
    username: string;
    profile?: any;
    roles?: string[];
    permissions?: string[];
  }): Promise<LoginResponse> {
    const user = await this.userService.createUser(userData);

    // Create session
    const session = await this.createSession(user, {
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
  }

  async logout(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    // Remove session
    this.sessions.delete(sessionId);

    // Remove from user sessions
    const userSessions = this.userSessions.get(session.userId) || [];
    const updatedUserSessions = userSessions.filter((id) => id !== sessionId);
    if (updatedUserSessions.length > 0) {
      this.userSessions.set(session.userId, updatedUserSessions);
    } else {
      this.userSessions.delete(session.userId);
    }

    // Remove refresh token
    this.refreshTokens.delete(session.refreshToken);

    return true;
  }

  async refreshToken(
    request: RefreshTokenRequest
  ): Promise<RefreshTokenResponse> {
    const sessionId = this.refreshTokens.get(request.refreshToken);
    if (!sessionId) {
      throw new Error('Invalid refresh token');
    }

    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      throw new Error('Session not found or inactive');
    }

    const user = await this.userService.getUserById(session.userId);
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
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as TokenPayload;

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
      const user = await this.userService.getUserById(payload.userId);
      if (!user || !user.isActive) {
        return null;
      }

      // Update last activity
      session.lastActivityAt = new Date();
      this.sessions.set(session.id, session);

      return user;
    } catch (error) {
      return null;
    }
  }

  async getCurrentUser(token: string): Promise<User | null> {
    const user = await this.verifyToken(token);
    if (!user) {
      return null;
    }

    // Return user without password for security
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    const sessionIds = this.userSessions.get(userId) || [];
    return sessionIds
      .map((id) => this.sessions.get(id))
      .filter((session): session is Session => session !== undefined);
  }

  async revokeSession(sessionId: string, userId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return false;
    }

    return this.logout(sessionId);
  }

  async revokeAllSessions(userId: string): Promise<number> {
    const sessionIds = this.userSessions.get(userId) || [];
    let revokedCount = 0;

    for (const sessionId of sessionIds) {
      if (await this.logout(sessionId)) {
        revokedCount++;
      }
    }

    return revokedCount;
  }

  private async createSession(
    user: User,
    metadata: {
      device?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<Session> {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + this.parseExpiry(this.tokenExpiry)
    );

    const session: Session = {
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
  }

  private generateToken(user: User, sessionId: string): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles,
      permissions: user.permissions,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp:
        Math.floor(Date.now() / 1000) +
        this.parseExpiry(this.tokenExpiry) / 1000,
    };

    return jwt.sign(payload, this.jwtSecret);
  }

  private generateRefreshToken(sessionId: string): string {
    const refreshToken = uuidv4();
    this.refreshTokens.set(refreshToken, sessionId);
    return refreshToken;
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 24 * 60 * 60 * 1000; // Default 24 hours
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  private sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.logout(sessionId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  async getSessionStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    byUser: Record<string, number>;
  }> {
    const now = new Date();
    const sessions = Array.from(this.sessions.values());

    const stats = {
      total: sessions.length,
      active: sessions.filter((s) => s.isActive && s.expiresAt > now).length,
      expired: sessions.filter((s) => s.expiresAt <= now).length,
      byUser: {} as Record<string, number>,
    };

    // Count sessions by user
    for (const session of sessions) {
      stats.byUser[session.userId] = (stats.byUser[session.userId] || 0) + 1;
    }

    return stats;
  }

  // MFA Methods

  /**
   * Setup MFA for a user
   */
  async setupMFA(userId: string): Promise<MFASetupResponse> {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.mfa?.enabled) {
      throw new Error('MFA is already enabled for this user');
    }

    const mfaSetup = MFAService.setupMFA(user);
    const mfaConfig = {
      enabled: false,
      secret: mfaSetup.secret,
      backupCodes: mfaSetup.backupCodes,
      createdAt: new Date(),
    };

    // Update user with MFA config (but don't enable yet)
    await this.userService.updateUser(userId, {
      mfa: mfaConfig,
    });

    return mfaSetup;
  }

  /**
   * Verify MFA setup code and enable MFA
   */
  async verifyMFASetup(
    userId: string,
    request: MFAVerifyRequest
  ): Promise<MFAVerifyResponse> {
    const user = await this.userService.getUserById(userId);
    if (!user || !user.mfa?.secret) {
      throw new Error('MFA setup not found');
    }

    if (user.mfa.enabled) {
      throw new Error('MFA is already enabled');
    }

    let isValid = false;
    let remainingBackupCodes = user.mfa.backupCodes || [];

    if (request.backupCode) {
      const backupResult = MFAService.verifyBackupCode(
        user.mfa.backupCodes || [],
        request.backupCode
      );
      isValid = backupResult.valid;
      // Update remaining codes after verification
      remainingBackupCodes = user.mfa.backupCodes || [];
    } else {
      isValid = MFAService.verifyTOTP(user.mfa.secret, request.code);
    }

    if (!isValid) {
      return { success: false };
    }

    // Enable MFA
    const updatedMfaConfig: MFAConfig = {
      ...user.mfa,
      enabled: true,
      lastUsed: new Date(),
    };

    await this.userService.updateUser(userId, {
      mfa: updatedMfaConfig,
    });

    return {
      success: true,
      backupCodes: remainingBackupCodes,
    };
  }

  /**
   * Verify MFA code during login
   */
  async verifyMFA(
    userId: string,
    request: MFAVerifyRequest
  ): Promise<MFAVerifyResponse> {
    const user = await this.userService.getUserById(userId);
    if (!user || !user.mfa?.enabled) {
      throw new Error('MFA not enabled for this user');
    }

    let isValid = false;
    let remainingBackupCodes = user.mfa.backupCodes || [];

    if (request.backupCode) {
      const backupResult = MFAService.verifyBackupCode(
        user.mfa.backupCodes || [],
        request.backupCode
      );
      isValid = backupResult.valid;
      // Update remaining codes after verification
      remainingBackupCodes = user.mfa.backupCodes || [];
    } else {
      isValid = MFAService.verifyTOTP(user.mfa.secret!, request.code);
    }

    if (!isValid) {
      return { success: false };
    }

    // Update MFA config with new backup codes if used
    if (
      request.backupCode &&
      remainingBackupCodes.length !== user.mfa.backupCodes?.length
    ) {
      const updatedMfaConfig: MFAConfig = {
        ...user.mfa,
        backupCodes: remainingBackupCodes,
        lastUsed: new Date(),
      };

      await this.userService.updateUser(userId, {
        mfa: updatedMfaConfig,
      });
    }

    return {
      success: true,
      backupCodes: remainingBackupCodes,
    };
  }

  /**
   * Disable MFA for a user
   */
  async disableMFA(userId: string): Promise<boolean> {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.mfa?.enabled) {
      throw new Error('MFA is not enabled for this user');
    }

    const disabledMfaConfig = MFAService.disableMFA(user);
    await this.userService.updateUser(userId, {
      mfa: disabledMfaConfig,
    });

    return true;
  }

  /**
   * Get MFA status for a user
   */
  async getMFAStatus(userId: string): Promise<{
    enabled: boolean;
    backupCodesCount: number;
    lastUsed?: Date;
  }> {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      enabled: MFAService.isMFAEnabled(user),
      backupCodesCount: MFAService.getRemainingBackupCodes(user),
      lastUsed: user.mfa?.lastUsed,
    };
  }

  /**
   * Generate new backup codes for MFA
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const user = await this.userService.getUserById(userId);
    if (!user || !user.mfa?.enabled) {
      throw new Error('MFA not enabled for this user');
    }

    const newBackupCodes = MFAService.generateBackupCodes();
    const updatedMfaConfig: MFAConfig = {
      ...user.mfa,
      backupCodes: newBackupCodes,
    };

    await this.userService.updateUser(userId, {
      mfa: updatedMfaConfig,
    });

    return newBackupCodes;
  }

  // Password Reset Methods

  /**
   * Request password reset
   */
  async requestPasswordReset(
    request: PasswordResetRequest
  ): Promise<PasswordResetResponse> {
    return this.passwordResetService.requestPasswordReset(request);
  }

  /**
   * Verify password reset token
   */
  async verifyPasswordResetToken(
    request: PasswordResetVerifyRequest
  ): Promise<{ valid: boolean; message: string }> {
    return this.passwordResetService.verifyResetToken(request);
  }

  /**
   * Complete password reset
   */
  async completePasswordReset(
    request: PasswordResetCompleteRequest
  ): Promise<PasswordResetCompleteResponse> {
    const result =
      await this.passwordResetService.completePasswordReset(request);

    if (result.success) {
      // In a real implementation, you would update the user's password here
      // For MockAuth, we'll just return success
    }

    return result;
  }

  /**
   * Get password reset statistics
   */
  getPasswordResetStats(): {
    total: number;
    active: number;
    expired: number;
    used: number;
  } {
    return this.passwordResetService.getStats();
  }

  /**
   * Clean up expired password reset tokens
   */
  async cleanupExpiredPasswordResetTokens(): Promise<number> {
    return this.passwordResetService.cleanupExpiredTokens();
  }

  // Account Lockout Methods

  /**
   * Unlock an account (admin function)
   */
  async unlockAccount(
    request: UnlockAccountRequest,
    unlockedBy: string
  ): Promise<UnlockAccountResponse> {
    return this.lockoutService.unlockAccount(request, unlockedBy);
  }

  /**
   * Get lockout status for a user
   */
  async getLockoutStatus(userId: string): Promise<{
    isLocked: boolean;
    lockedUntil?: Date;
    attempts?: number;
  }> {
    return this.lockoutService.isAccountLocked(userId);
  }

  /**
   * Get lockout statistics
   */
  getLockoutStats(): {
    totalLocked: number;
    totalAttempts: number;
    averageAttempts: number;
    byReason: Record<string, number>;
  } {
    return this.lockoutService.getLockoutStats();
  }

  /**
   * Get lockout record for a user
   */
  getLockoutRecord(userId: string) {
    return this.lockoutService.getLockoutRecord(userId);
  }

  /**
   * Clean up expired lockout records
   */
  async cleanupExpiredLockoutRecords(): Promise<number> {
    return this.lockoutService.cleanupExpiredRecords();
  }

  /**
   * Update lockout configuration
   */
  updateLockoutConfig(newConfig: Partial<AccountLockoutConfig>): void {
    this.lockoutService.updateConfig(newConfig);
  }

  /**
   * Get current lockout configuration
   */
  getLockoutConfig(): AccountLockoutConfig {
    return this.lockoutService.getConfig();
  }

  // Enhanced Session Management

  /**
   * Get sessions by device type
   */
  async getSessionsByDevice(
    userId: string,
    deviceType?: string
  ): Promise<Session[]> {
    const sessions = await this.getUserSessions(userId);

    if (!deviceType) {
      return sessions;
    }

    return sessions.filter((session) =>
      session.device?.toLowerCase().includes(deviceType.toLowerCase())
    );
  }

  /**
   * Get session analytics for a user
   */
  async getSessionAnalytics(userId: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    byDevice: Record<string, number>;
    byLocation: Record<string, number>;
    averageSessionDuration: number;
    lastActivity: Date | null;
  }> {
    const sessions = await this.getUserSessions(userId);
    const now = new Date();

    const activeSessions = sessions.filter(
      (s) => s.isActive && s.expiresAt > now
    );

    const byDevice: Record<string, number> = {};
    const byLocation: Record<string, number> = {};

    sessions.forEach((session) => {
      const device = session.device || 'Unknown';
      const location = session.ipAddress || 'Unknown';

      byDevice[device] = (byDevice[device] || 0) + 1;
      byLocation[location] = (byLocation[location] || 0) + 1;
    });

    const totalDuration = sessions.reduce((sum, session) => {
      return (
        sum + (session.lastActivityAt.getTime() - session.createdAt.getTime())
      );
    }, 0);

    const averageSessionDuration =
      sessions.length > 0 ? totalDuration / sessions.length : 0;

    const lastActivity =
      sessions.length > 0
        ? new Date(Math.max(...sessions.map((s) => s.lastActivityAt.getTime())))
        : null;

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      byDevice,
      byLocation,
      averageSessionDuration,
      lastActivity,
    };
  }

  /**
   * Revoke sessions by device type
   */
  async revokeSessionsByDevice(
    userId: string,
    deviceType: string
  ): Promise<number> {
    const sessions = await this.getSessionsByDevice(userId, deviceType);
    let revokedCount = 0;

    for (const session of sessions) {
      if (await this.revokeSession(session.id, userId)) {
        revokedCount++;
      }
    }

    return revokedCount;
  }

  /**
   * Revoke all sessions except current
   */
  async revokeAllOtherSessions(
    userId: string,
    currentSessionId: string
  ): Promise<number> {
    const sessions = await this.getUserSessions(userId);
    let revokedCount = 0;

    for (const session of sessions) {
      if (session.id !== currentSessionId) {
        if (await this.revokeSession(session.id, userId)) {
          revokedCount++;
        }
      }
    }

    return revokedCount;
  }

  /**
   * Get session statistics across all users
   */
  async getGlobalSessionStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    byDevice: Record<string, number>;
    byUser: Record<string, number>;
    averageSessionsPerUser: number;
  }> {
    const now = new Date();
    const allSessions = Array.from(this.sessions.values());

    const activeSessions = allSessions.filter(
      (s) => s.isActive && s.expiresAt > now
    );
    const expiredSessions = allSessions.filter((s) => s.expiresAt <= now);

    const byDevice: Record<string, number> = {};
    const byUser: Record<string, number> = {};

    allSessions.forEach((session) => {
      const device = session.device || 'Unknown';
      byDevice[device] = (byDevice[device] || 0) + 1;
      byUser[session.userId] = (byUser[session.userId] || 0) + 1;
    });

    const uniqueUsers = Object.keys(byUser).length;
    const averageSessionsPerUser =
      uniqueUsers > 0 ? allSessions.length / uniqueUsers : 0;

    return {
      totalSessions: allSessions.length,
      activeSessions: activeSessions.length,
      expiredSessions: expiredSessions.length,
      byDevice,
      byUser,
      averageSessionsPerUser,
    };
  }
}
