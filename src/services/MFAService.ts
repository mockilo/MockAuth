import { v4 as uuidv4 } from 'uuid';
import { MFAConfig, MFASetupResponse, MFAVerifyRequest, MFAVerifyResponse } from '../types';

export class MFAService {
  private static readonly TOTP_WINDOW = 1; // Allow 1 time step tolerance
  private static readonly BACKUP_CODE_LENGTH = 8;
  private static readonly BACKUP_CODE_COUNT = 10;

  /**
   * Generate a random secret for TOTP
   */
  static generateSecret(): string {
    // Generate a 32-character base32 secret
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  /**
   * Generate backup codes for MFA
   */
  static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      codes.push(this.generateBackupCode());
    }
    return codes;
  }

  /**
   * Generate a single backup code
   */
  private static generateBackupCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let code = '';
    for (let i = 0; i < this.BACKUP_CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate QR code data for authenticator app setup
   */
  static generateQRCodeData(secret: string, email: string, issuer: string = 'MockAuth'): string {
    const encodedEmail = encodeURIComponent(email);
    const encodedIssuer = encodeURIComponent(issuer);
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}`;
  }

  /**
   * Setup MFA for a user
   */
  static setupMFA(userId: string, email: string): MFASetupResponse {
    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes();
    const qrCode = this.generateQRCodeData(secret, email);

    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Verify TOTP code
   */
  static verifyTOTP(secret: string, code: string): boolean {
    // In a real implementation, you would use a proper TOTP library
    // For MockAuth, we'll simulate verification with a simple check
    // This is a mock implementation - in production, use a proper TOTP library
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeStep = 30; // 30-second time steps
    
    // Check current time step and previous/next for tolerance
    for (let i = -this.TOTP_WINDOW; i <= this.TOTP_WINDOW; i++) {
      const time = currentTime + (i * timeStep);
      const expectedCode = this.generateTOTPCode(secret, time);
      if (expectedCode === code) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Generate TOTP code for a given time (mock implementation)
   */
  private static generateTOTPCode(secret: string, time: number): string {
    // This is a simplified mock implementation
    // In production, use a proper TOTP library like 'otplib'
    
    const timeStep = Math.floor(time / 30);
    const hash = this.simpleHash(secret + timeStep);
    const code = (hash % 1000000).toString().padStart(6, '0');
    return code;
  }

  /**
   * Simple hash function for mock TOTP (not cryptographically secure)
   */
  private static simpleHash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Verify backup code
   */
  static verifyBackupCode(backupCodes: string[], code: string): { valid: boolean; remainingCodes: string[] } {
    const index = backupCodes.indexOf(code);
    if (index === -1) {
      return { valid: false, remainingCodes: backupCodes };
    }

    // Remove used backup code
    const remainingCodes = backupCodes.filter((_, i) => i !== index);
    return { valid: true, remainingCodes };
  }

  /**
   * Create MFA configuration
   */
  static createMFAConfig(secret: string, backupCodes: string[]): MFAConfig {
    return {
      enabled: true,
      secret,
      backupCodes,
      createdAt: new Date(),
    };
  }

  /**
   * Disable MFA for a user
   */
  static disableMFA(): MFAConfig {
    return {
      enabled: false,
    };
  }

  /**
   * Check if MFA is enabled for a user
   */
  static isMFAEnabled(mfaConfig?: MFAConfig): boolean {
    return mfaConfig?.enabled === true;
  }

  /**
   * Get remaining backup codes count
   */
  static getRemainingBackupCodes(mfaConfig?: MFAConfig): number {
    return mfaConfig?.backupCodes?.length || 0;
  }
}
