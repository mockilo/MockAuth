import { User } from '../types';
export declare class MFAService {
    private static instance;
    static getInstance(): MFAService;
    static generateSecret(): string;
    static generateQRCodeData(secret: string, email: string): Promise<string>;
    generateSecret(user: User): {
        secret: string;
        qrCode: string;
    };
    generateQRCode(secret: string, user: User): Promise<string>;
    verifyToken(secret: string, token: string): boolean;
    generateBackupCodes(count?: number): string[];
    private generateRandomCode;
    verifyBackupCode(backupCodes: string[], code: string): {
        valid: boolean;
        remainingCodes: string[];
    };
    static setupMFA(user: User): {
        secret: string;
        qrCode: string;
        backupCodes: string[];
    };
    static createMFAConfig(user: User): {
        secret: string;
        qrCode: string;
        backupCodes: string[];
    };
    static verifyTOTP(secret: string, token: string): boolean;
    static verifyBackupCode(backupCodes: string[], code: string): {
        valid: boolean;
        remainingCodes: string[];
    };
    static disableMFA(user: User): any;
    static isMFAEnabled(user: User): boolean;
    static getRemainingBackupCodes(user: User): number;
    static generateBackupCodes(): string[];
}
export declare function createMFAService(): MFAService;
//# sourceMappingURL=MFAService.d.ts.map