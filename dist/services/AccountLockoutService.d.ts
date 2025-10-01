import { AccountLockoutConfig, UnlockAccountRequest, UnlockAccountResponse } from '../types';
export interface LockoutRecord {
    userId: string;
    attempts: number;
    lockedAt: Date;
    lockedUntil: Date;
    reason?: string;
    unlockedBy?: string;
    unlockedAt?: Date;
}
export declare class AccountLockoutService {
    private lockoutRecords;
    private config;
    constructor(config?: AccountLockoutConfig);
    /**
     * Record a failed login attempt
     */
    recordFailedAttempt(userId: string): Promise<{
        isLocked: boolean;
        attemptsRemaining: number;
        lockedUntil?: Date;
    }>;
    /**
     * Clear failed attempts on successful login
     */
    clearFailedAttempts(userId: string): Promise<void>;
    /**
     * Check if account is locked
     */
    isAccountLocked(userId: string): Promise<{
        isLocked: boolean;
        lockedUntil?: Date;
        attempts?: number;
    }>;
    /**
     * Unlock an account (admin function)
     */
    unlockAccount(request: UnlockAccountRequest, unlockedBy: string): Promise<UnlockAccountResponse>;
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
    getLockoutRecord(userId: string): LockoutRecord | null;
    /**
     * Clean up expired lockout records
     */
    cleanupExpiredRecords(): Promise<number>;
    /**
     * Update lockout configuration
     */
    updateConfig(newConfig: Partial<AccountLockoutConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): AccountLockoutConfig;
}
//# sourceMappingURL=AccountLockoutService.d.ts.map