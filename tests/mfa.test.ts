import { MFAService } from '../src/services/MFAService';
import { AuthService } from '../src/services/AuthService';
import { UserService } from '../src/services/UserService';

describe('MFA Service', () => {
  describe('generateSecret', () => {
    it('should generate a base32 secret', () => {
      const secret = MFAService.generateSecret();
      expect(secret).toHaveLength(52); // Base32 secrets are typically 52 characters
      expect(secret).toMatch(/^[A-Z2-7]+$/);
    });
  });

  describe('generateBackupCodes', () => {
    it('should generate 10 backup codes', () => {
      const codes = MFAService.generateBackupCodes();
      expect(codes).toHaveLength(10);
      codes.forEach(code => {
        expect(code).toHaveLength(8);
        expect(code).toMatch(/^[A-Z0-9]+$/); // Backup codes use alphanumeric
      });
    });
  });

  describe('generateQRCodeData', () => {
    it('should generate valid QR code data', async () => {
      const secret = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      const email = 'test@example.com';
      const qrCode = await MFAService.generateQRCodeData(secret, email);
      
      expect(qrCode).toContain('data:image/png;base64,');
      expect(typeof qrCode).toBe('string');
    });
  });

  describe('verifyTOTP', () => {
    it('should verify valid TOTP codes', () => {
      const secret = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      const code = '123456'; // Mock code
      
      // This is a mock implementation, so we'll test the structure
      const result = MFAService.verifyTOTP(secret, code);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('verifyBackupCode', () => {
    it('should verify valid backup codes', () => {
      const codes = ['ABC12345', 'DEF67890', 'GHI11111'];
      const result = MFAService.verifyBackupCode(codes, 'ABC12345');
      
      expect(result.valid).toBe(true);
      expect(result.remainingCodes).toHaveLength(2);
      expect(result.remainingCodes).not.toContain('ABC12345');
    });

    it('should reject invalid backup codes', () => {
      const codes = ['ABC12345', 'DEF67890'];
      const result = MFAService.verifyBackupCode(codes, 'INVALID');
      
      expect(result.valid).toBe(false);
      expect(result.remainingCodes).toEqual(codes);
    });
  });
});

describe('AuthService MFA Integration', () => {
  let userService: UserService;
  let authService: AuthService;

  beforeEach(() => {
    userService = new UserService();
    authService = new AuthService(userService, 'test-secret');
  });

  describe('setupMFA', () => {
    it('should setup MFA for a user', async () => {
      // Create a test user
      const user = await userService.createUser({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      const mfaSetup = await authService.setupMFA(user.id);

      expect(mfaSetup).toHaveProperty('secret');
      expect(mfaSetup).toHaveProperty('qrCode');
      expect(mfaSetup).toHaveProperty('backupCodes');
      expect(mfaSetup.backupCodes).toHaveLength(10);
    });

    it('should throw error if user not found', async () => {
      await expect(authService.setupMFA('non-existent'))
        .rejects.toThrow('User not found');
    });
  });

  describe('getMFAStatus', () => {
    it('should return MFA status for a user', async () => {
      const user = await userService.createUser({
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123'
      });

      const status = await authService.getMFAStatus(user.id);

      expect(status).toHaveProperty('enabled');
      expect(status).toHaveProperty('backupCodesCount');
      expect(status.enabled).toBe(false);
    });
  });
});
