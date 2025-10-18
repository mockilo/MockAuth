import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { User } from '../types';

export class MFAService {
  private static instance: MFAService;

  static getInstance(): MFAService {
    if (!MFAService.instance) {
      MFAService.instance = new MFAService();
    }
    return MFAService.instance;
  }

  // Static method for tests
  static generateSecret(): string {
    const secret = speakeasy.generateSecret({
      name: 'test@example.com',
      issuer: 'MockAuth',
      length: 32,
    });
    return secret.base32;
  }

  // Static method for tests
  static async generateQRCodeData(
    secret: string,
    email: string
  ): Promise<string> {
    const otpauthUrl = `otpauth://totp/MockAuth:${email}?secret=${secret}&issuer=MockAuth`;

    try {
      const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataURL;
    } catch (error) {
      throw new Error(
        `Failed to generate QR code: ${(error as Error).message}`
      );
    }
  }

  generateSecret(user: User): { secret: string; qrCode: string } {
    const secret = speakeasy.generateSecret({
      name: user.email,
      issuer: 'MockAuth',
      length: 32,
    });

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url || '',
    };
  }

  async generateQRCode(secret: string, user: User): Promise<string> {
    const otpauthUrl = `otpauth://totp/MockAuth:${user.email}?secret=${secret}&issuer=MockAuth`;

    try {
      const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataURL;
    } catch (error) {
      throw new Error(
        `Failed to generate QR code: ${(error as Error).message}`
      );
    }
  }

  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps (60 seconds) of variance
    });
  }

  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(this.generateRandomCode());
    }
    return codes;
  }

  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  verifyBackupCode(
    backupCodes: string[],
    code: string
  ): { valid: boolean; remainingCodes: string[] } {
    const index = backupCodes.indexOf(code);
    if (index !== -1) {
      // Remove used backup code
      backupCodes.splice(index, 1);
      return { valid: true, remainingCodes: [...backupCodes] };
    }
    return { valid: false, remainingCodes: [...backupCodes] };
  }

  // Static methods for AuthService compatibility
  static setupMFA(user: User): {
    secret: string;
    qrCode: string;
    backupCodes: string[];
  } {
    const instance = MFAService.getInstance();
    const secret = instance.generateSecret(user);
    const backupCodes = instance.generateBackupCodes();
    return { ...secret, backupCodes };
  }

  static createMFAConfig(user: User): {
    secret: string;
    qrCode: string;
    backupCodes: string[];
  } {
    return MFAService.setupMFA(user);
  }

  static verifyTOTP(secret: string, token: string): boolean {
    return MFAService.getInstance().verifyToken(secret, token);
  }

  static verifyBackupCode(
    backupCodes: string[],
    code: string
  ): { valid: boolean; remainingCodes: string[] } {
    return MFAService.getInstance().verifyBackupCode(backupCodes, code);
  }

  static disableMFA(user: User): any {
    // Implementation for disabling MFA
    console.log(`MFA disabled for user: ${user.email}`);
    return undefined;
  }

  static isMFAEnabled(user: User): boolean {
    return user.mfa?.enabled || false;
  }

  static getRemainingBackupCodes(user: User): number {
    return user.mfa?.backupCodes?.length || 0;
  }

  static generateBackupCodes(): string[] {
    return MFAService.getInstance().generateBackupCodes();
  }
}

export function createMFAService(): MFAService {
  return MFAService.getInstance();
}
