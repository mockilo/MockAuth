import { MFAConfig, MFASetupResponse } from '../types';
export declare class MFAService {
    private static readonly TOTP_WINDOW;
    private static readonly BACKUP_CODE_LENGTH;
    private static readonly BACKUP_CODE_COUNT;
    /**
     * Generate a random secret for TOTP
     */
    static generateSecret(): string;
    /**
     * Generate backup codes for MFA
     */
    static generateBackupCodes(): string[];
    /**
     * Generate a single backup code
     */
    private static generateBackupCode;
    /**
     * Generate QR code data for authenticator app setup
     */
    static generateQRCodeData(secret: string, email: string, issuer?: string): string;
    /**
     * Setup MFA for a user
     */
    static setupMFA(userId: string, email: string): MFASetupResponse;
    /**
     * Verify TOTP code
     */
    static verifyTOTP(secret: string, code: string): boolean;
    /**
     * Generate TOTP code for a given time (mock implementation)
     */
    private static generateTOTPCode;
    /**
     * Simple hash function for mock TOTP (not cryptographically secure)
     */
    private static simpleHash;
    /**
     * Verify backup code
     */
    static verifyBackupCode(backupCodes: string[], code: string): {
        valid: boolean;
        remainingCodes: string[];
    };
    /**
     * Create MFA configuration
     */
    static createMFAConfig(secret: string, backupCodes: string[]): MFAConfig;
    /**
     * Disable MFA for a user
     */
    static disableMFA(): MFAConfig;
    /**
     * Check if MFA is enabled for a user
     */
    static isMFAEnabled(mfaConfig?: MFAConfig): boolean;
    /**
     * Get remaining backup codes count
     */
    static getRemainingBackupCodes(mfaConfig?: MFAConfig): number;
}
//# sourceMappingURL=MFAService.d.ts.map