import { PasswordResetRequest, PasswordResetResponse, PasswordResetVerifyRequest, PasswordResetCompleteRequest, PasswordResetCompleteResponse } from '../types';
export interface PasswordResetToken {
    token: string;
    userId: string;
    email: string;
    expiresAt: Date;
    used: boolean;
    createdAt: Date;
}
export declare class PasswordResetService {
    private tokenExpiry;
    private resetTokens;
    private userResetTokens;
    constructor(tokenExpiry?: number);
    /**
     * Request password reset for a user
     */
    requestPasswordReset(request: PasswordResetRequest): Promise<PasswordResetResponse>;
    /**
     * Verify password reset token
     */
    verifyResetToken(request: PasswordResetVerifyRequest): Promise<{
        valid: boolean;
        message: string;
    }>;
    /**
     * Complete password reset
     */
    completePasswordReset(request: PasswordResetCompleteRequest): Promise<PasswordResetCompleteResponse>;
    /**
     * Generate a secure reset token
     */
    private generateResetToken;
    /**
     * Clean up expired tokens
     */
    cleanupExpiredTokens(): Promise<number>;
    /**
     * Get reset token statistics
     */
    getStats(): {
        total: number;
        active: number;
        expired: number;
        used: number;
    };
    /**
     * Revoke all reset tokens for a user
     */
    revokeUserTokens(userId: string): Promise<number>;
}
//# sourceMappingURL=PasswordResetService.d.ts.map