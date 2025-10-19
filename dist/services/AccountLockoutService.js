"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountLockoutService = void 0;
class AccountLockoutService {
    constructor(config = {
        maxAttempts: 5,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
        enableLockout: true,
    }) {
        this.lockoutRecords = new Map();
        this.config = config;
    }
    /**
     * Record a failed login attempt
     */
    async recordFailedAttempt(userId) {
        if (!this.config.enableLockout) {
            return { isLocked: false, attemptsRemaining: this.config.maxAttempts };
        }
        const existingRecord = this.lockoutRecords.get(userId);
        const now = new Date();
        if (existingRecord) {
            // Check if lockout has expired
            if (existingRecord.lockedUntil && existingRecord.lockedUntil < now) {
                // Reset the record
                this.lockoutRecords.delete(userId);
                return this.recordFailedAttempt(userId);
            }
            // Check if already locked
            if (existingRecord.lockedUntil && existingRecord.lockedUntil > now) {
                return {
                    isLocked: true,
                    attemptsRemaining: 0,
                    lockedUntil: existingRecord.lockedUntil,
                };
            }
            // Increment attempts
            const newAttempts = existingRecord.attempts + 1;
            const isLocked = newAttempts >= this.config.maxAttempts;
            const lockedUntil = isLocked
                ? new Date(now.getTime() + this.config.lockoutDuration)
                : undefined;
            const updatedRecord = {
                ...existingRecord,
                attempts: newAttempts,
                lockedAt: isLocked ? now : existingRecord.lockedAt,
                lockedUntil: lockedUntil || existingRecord.lockedUntil,
            };
            this.lockoutRecords.set(userId, updatedRecord);
            return {
                isLocked,
                attemptsRemaining: Math.max(0, this.config.maxAttempts - newAttempts),
                lockedUntil,
            };
        }
        else {
            // First failed attempt
            const newAttempts = 1;
            const isLocked = newAttempts >= this.config.maxAttempts;
            const lockedUntil = isLocked
                ? new Date(now.getTime() + this.config.lockoutDuration)
                : undefined;
            const newRecord = {
                userId,
                attempts: newAttempts,
                lockedAt: isLocked ? now : now,
                lockedUntil: lockedUntil,
            };
            this.lockoutRecords.set(userId, newRecord);
            return {
                isLocked,
                attemptsRemaining: Math.max(0, this.config.maxAttempts - newAttempts),
                lockedUntil,
            };
        }
    }
    /**
     * Clear failed attempts on successful login
     */
    async clearFailedAttempts(userId) {
        this.lockoutRecords.delete(userId);
    }
    /**
     * Check if account is locked
     */
    async isAccountLocked(userId) {
        const record = this.lockoutRecords.get(userId);
        if (!record) {
            return { isLocked: false, attempts: 0, lockedUntil: undefined };
        }
        const now = new Date();
        // If no lockedUntil, the account is not locked
        if (!record.lockedUntil) {
            return { isLocked: false, attempts: record.attempts, lockedUntil: undefined };
        }
        if (record.lockedUntil && record.lockedUntil < now) {
            // Lockout has expired, clean up
            this.lockoutRecords.delete(userId);
            return { isLocked: false, attempts: 0, lockedUntil: undefined };
        }
        return {
            isLocked: true,
            lockedUntil: record.lockedUntil,
            attempts: record.attempts,
        };
    }
    /**
     * Unlock an account (admin function)
     */
    async unlockAccount(request, unlockedBy) {
        const { userId, reason } = request;
        const record = this.lockoutRecords.get(userId);
        if (!record) {
            return {
                success: false,
                message: 'Account is not locked',
            };
        }
        const now = new Date();
        // Remove the lockout record to unlock the account
        this.lockoutRecords.delete(userId);
        return {
            success: true,
            message: 'Account unlocked successfully',
        };
    }
    /**
     * Get lockout statistics
     */
    getLockoutStats() {
        const records = Array.from(this.lockoutRecords.values());
        const now = new Date();
        const activeRecords = records.filter((r) => r.lockedUntil && r.lockedUntil > now);
        const totalAttempts = activeRecords.reduce((sum, r) => sum + r.attempts, 0);
        const byReason = {};
        activeRecords.forEach((record) => {
            const reason = record.reason || 'unknown';
            byReason[reason] = (byReason[reason] || 0) + 1;
        });
        return {
            totalLocked: activeRecords.length,
            totalAttempts,
            averageAttempts: activeRecords.length > 0 ? totalAttempts / activeRecords.length : 0,
            byReason,
        };
    }
    /**
     * Get lockout record for a user
     */
    getLockoutRecord(userId) {
        const record = this.lockoutRecords.get(userId);
        if (!record) {
            return null;
        }
        const now = new Date();
        if (record.lockedUntil && record.lockedUntil < now) {
            // Lockout has expired, clean up
            this.lockoutRecords.delete(userId);
            return null;
        }
        return record;
    }
    /**
     * Clean up expired lockout records
     */
    async cleanupExpiredRecords() {
        const now = new Date();
        let cleanedCount = 0;
        for (const [userId, record] of this.lockoutRecords.entries()) {
            if (record.lockedUntil && record.lockedUntil < now) {
                this.lockoutRecords.delete(userId);
                cleanedCount++;
            }
        }
        return cleanedCount;
    }
    /**
     * Update lockout configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
exports.AccountLockoutService = AccountLockoutService;
//# sourceMappingURL=AccountLockoutService.js.map