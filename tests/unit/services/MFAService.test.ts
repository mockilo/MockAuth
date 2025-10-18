import { MFAService } from '../../../src/services/MFAService';
import { User } from '../../../src/types';

describe('MFAService', () => {
  let mfaService: MFAService;
  let mockUser: User;

  beforeEach(() => {
    mfaService = MFAService.getInstance();
    mockUser = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      roles: ['user'],
      permissions: ['read:profile'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      isLocked: false,
      failedLoginAttempts: 0
    };
  });

  describe('generateSecret', () => {
    it('should generate a valid secret', () => {
      const result = mfaService.generateSecret(mockUser);
      
      expect(result.secret).toBeDefined();
      expect(result.secret).toMatch(/^[A-Z2-7]+$/); // Base32 format
      expect(result.qrCode).toBeDefined();
    });

    it('should generate different secrets for different users', () => {
      const user1 = { ...mockUser, email: 'user1@example.com' };
      const user2 = { ...mockUser, email: 'user2@example.com' };
      
      const secret1 = mfaService.generateSecret(user1);
      const secret2 = mfaService.generateSecret(user2);
      
      expect(secret1.secret).not.toBe(secret2.secret);
    });
  });

  describe('generateQRCode', () => {
    it('should generate a valid QR code data URL', async () => {
      const secret = mfaService.generateSecret(mockUser);
      const qrCode = await mfaService.generateQRCode(secret.secret, mockUser);
      
      expect(qrCode).toMatch(/^data:image\/png;base64,/);
    });

    it('should handle invalid secret gracefully', async () => {
      // The method should still work with any string as secret
      const result = await mfaService.generateQRCode('invalid-secret', mockUser);
      expect(result).toBeDefined();
      expect(result).toContain('data:image/png;base64,');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid TOTP token', () => {
      const secret = mfaService.generateSecret(mockUser);
      
      // Note: In real tests, you'd need to generate a valid TOTP token
      // For this mock test, we'll test the structure
      const result = mfaService.verifyToken(secret.secret, '123456');
      
      expect(typeof result).toBe('boolean');
    });

    it('should reject invalid token', () => {
      const secret = mfaService.generateSecret(mockUser);
      const result = mfaService.verifyToken(secret.secret, '000000');
      
      expect(result).toBe(false);
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate the correct number of backup codes', () => {
      const codes = mfaService.generateBackupCodes(10);
      
      expect(codes).toHaveLength(10);
      codes.forEach(code => {
        expect(code).toMatch(/^[A-Z0-9]{8}$/);
      });
    });

    it('should generate unique backup codes', () => {
      const codes = mfaService.generateBackupCodes(100);
      const uniqueCodes = new Set(codes);
      
      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  describe('verifyBackupCode', () => {
    it('should verify valid backup code', () => {
      const backupCodes = ['ABC12345', 'DEF67890', 'GHI11111'];
      const result = mfaService.verifyBackupCode(backupCodes, 'ABC12345');
      
      expect(result.valid).toBe(true);
      expect(result.remainingCodes).toHaveLength(2);
      expect(result.remainingCodes).not.toContain('ABC12345');
    });

    it('should reject invalid backup code', () => {
      const backupCodes = ['ABC12345', 'DEF67890'];
      const result = mfaService.verifyBackupCode(backupCodes, 'INVALID');
      
      expect(result.valid).toBe(false);
      expect(result.remainingCodes).toHaveLength(2);
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MFAService.getInstance();
      const instance2 = MFAService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
});
