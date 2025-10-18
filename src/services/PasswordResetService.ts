import { v4 as uuidv4 } from 'uuid';
import {
  PasswordResetRequest,
  PasswordResetResponse,
  PasswordResetVerifyRequest,
  PasswordResetCompleteRequest,
  PasswordResetCompleteResponse,
} from '../types';

export interface PasswordResetToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export class PasswordResetService {
  private resetTokens: Map<string, PasswordResetToken> = new Map();
  private userResetTokens: Map<string, string[]> = new Map(); // userId -> token[]

  constructor(
    private tokenExpiry: number = 15 * 60 * 1000 // 15 minutes
  ) {}

  /**
   * Request password reset for a user
   */
  async requestPasswordReset(
    request: PasswordResetRequest
  ): Promise<PasswordResetResponse> {
    const { email } = request;

    // In a real implementation, you would check if the user exists
    // For MockAuth, we'll always return success to prevent email enumeration
    const token = this.generateResetToken(email);

    // Store the reset token
    this.resetTokens.set(token, {
      token,
      userId: 'mock-user-id', // In real implementation, get from user lookup
      email,
      expiresAt: new Date(Date.now() + this.tokenExpiry),
      used: false,
      createdAt: new Date(),
    });

    // Add to user's reset tokens
    const userTokens = this.userResetTokens.get('mock-user-id') || [];
    userTokens.push(token);
    this.userResetTokens.set('mock-user-id', userTokens);

    return {
      success: true,
      message: 'Password reset instructions have been sent to your email',
      token, // In production, don't return the token
    };
  }

  /**
   * Verify password reset token
   */
  async verifyResetToken(
    request: PasswordResetVerifyRequest
  ): Promise<{ valid: boolean; message: string }> {
    const { token } = request;
    const resetToken = this.resetTokens.get(token);

    if (!resetToken) {
      return { valid: false, message: 'Invalid reset token' };
    }

    if (resetToken.used) {
      return { valid: false, message: 'Reset token has already been used' };
    }

    if (resetToken.expiresAt < new Date()) {
      return { valid: false, message: 'Reset token has expired' };
    }

    return { valid: true, message: 'Reset token is valid' };
  }

  /**
   * Complete password reset
   */
  async completePasswordReset(
    request: PasswordResetCompleteRequest
  ): Promise<PasswordResetCompleteResponse> {
    const { token, newPassword } = request;
    const resetToken = this.resetTokens.get(token);

    if (!resetToken) {
      return { success: false, message: 'Invalid reset token' };
    }

    if (resetToken.used) {
      return { success: false, message: 'Reset token has already been used' };
    }

    if (resetToken.expiresAt < new Date()) {
      return { success: false, message: 'Reset token has expired' };
    }

    // Mark token as used
    resetToken.used = true;
    this.resetTokens.set(token, resetToken);

    // In a real implementation, you would update the user's password
    // For MockAuth, we'll just return success

    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  }

  /**
   * Generate a secure reset token
   */
  private generateResetToken(email: string): string {
    const timestamp = Date.now().toString();
    const random = uuidv4();
    return Buffer.from(`${email}:${timestamp}:${random}`).toString('base64');
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    for (const [token, resetToken] of this.resetTokens.entries()) {
      if (resetToken.expiresAt < now || resetToken.used) {
        this.resetTokens.delete(token);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Get reset token statistics
   */
  getStats(): {
    total: number;
    active: number;
    expired: number;
    used: number;
  } {
    const now = new Date();
    const tokens = Array.from(this.resetTokens.values());

    return {
      total: tokens.length,
      active: tokens.filter((t) => !t.used && t.expiresAt > now).length,
      expired: tokens.filter((t) => t.expiresAt <= now).length,
      used: tokens.filter((t) => t.used).length,
    };
  }

  /**
   * Revoke all reset tokens for a user
   */
  async revokeUserTokens(userId: string): Promise<number> {
    const userTokens = this.userResetTokens.get(userId) || [];
    let revokedCount = 0;

    for (const token of userTokens) {
      if (this.resetTokens.has(token)) {
        this.resetTokens.delete(token);
        revokedCount++;
      }
    }

    this.userResetTokens.delete(userId);
    return revokedCount;
  }
}
