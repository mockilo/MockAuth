"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountLockoutService = void 0;
class AccountLockoutService {
    constructor(config = {
        maxAttempts: 5,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
        enableLockout: true
    }) {
        this.lockoutRecords = new Map();
        this.config = config;
    }
    /**
     * Record a failed login attempt
     */
    recordFailedAttempt(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.config.enableLockout) {
                return { isLocked: false, attemptsRemaining: this.config.maxAttempts };
            }
            const existingRecord = this.lockoutRecords.get(userId);
            const now = new Date();
            if (existingRecord) {
                // Check if lockout has expired
                if (existingRecord.lockedUntil < now) {
                    // Reset the record
                    this.lockoutRecords.delete(userId);
                    return this.recordFailedAttempt(userId);
                }
                // Check if already locked
                if (existingRecord.lockedUntil > now) {
                    return {
                        isLocked: true,
                        attemptsRemaining: 0,
                        lockedUntil: existingRecord.lockedUntil
                    };
                }
                // Increment attempts
                const newAttempts = existingRecord.attempts + 1;
                const isLocked = newAttempts >= this.config.maxAttempts;
                const lockedUntil = isLocked ? new Date(now.getTime() + this.config.lockoutDuration) : undefined;
                const updatedRecord = Object.assign(Object.assign({}, existingRecord), { attempts: newAttempts, lockedAt: isLocked ? now : existingRecord.lockedAt, lockedUntil: lockedUntil || existingRecord.lockedUntil });
                this.lockoutRecords.set(userId, updatedRecord);
                return {
                    isLocked,
                    attemptsRemaining: Math.max(0, this.config.maxAttempts - newAttempts),
                    lockedUntil
                };
            }
            else {
                // First failed attempt
                const newAttempts = 1;
                const isLocked = newAttempts >= this.config.maxAttempts;
                const lockedUntil = isLocked ? new Date(now.getTime() + this.config.lockoutDuration) : undefined;
                const newRecord = {
                    userId,
                    attempts: newAttempts,
                    lockedAt: isLocked ? now : now,
                    lockedUntil: lockedUntil || new Date(now.getTime() + this.config.lockoutDuration)
                };
                this.lockoutRecords.set(userId, newRecord);
                return {
                    isLocked,
                    attemptsRemaining: this.config.maxAttempts - newAttempts,
                    lockedUntil
                };
            }
        });
    }
    /**
     * Clear failed attempts on successful login
     */
    clearFailedAttempts(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.lockoutRecords.delete(userId);
        });
    }
    /**
     * Check if account is locked
     */
    isAccountLocked(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const record = this.lockoutRecords.get(userId);
            if (!record) {
                return { isLocked: false };
            }
            const now = new Date();
            if (record.lockedUntil < now) {
                // Lockout has expired, clean up
                this.lockoutRecords.delete(userId);
                return { isLocked: false };
            }
            return {
                isLocked: true,
                lockedUntil: record.lockedUntil,
                attempts: record.attempts
            };
        });
    }
    /**
     * Unlock an account (admin function)
     */
    unlockAccount(request, unlockedBy) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, reason } = request;
            const record = this.lockoutRecords.get(userId);
            if (!record) {
                return {
                    success: false,
                    message: 'Account is not locked'
                };
            }
            const now = new Date();
            const updatedRecord = Object.assign(Object.assign({}, record), { unlockedBy, unlockedAt: now, reason: reason || record.reason });
            this.lockoutRecords.set(userId, updatedRecord);
            return {
                success: true,
                message: 'Account unlocked successfully'
            };
        });
    }
    /**
     * Get lockout statistics
     */
    getLockoutStats() {
        const records = Array.from(this.lockoutRecords.values());
        const now = new Date();
        const activeRecords = records.filter(r => r.lockedUntil > now);
        const totalAttempts = activeRecords.reduce((sum, r) => sum + r.attempts, 0);
        const byReason = {};
        activeRecords.forEach(record => {
            const reason = record.reason || 'unknown';
            byReason[reason] = (byReason[reason] || 0) + 1;
        });
        return {
            totalLocked: activeRecords.length,
            totalAttempts,
            averageAttempts: activeRecords.length > 0 ? totalAttempts / activeRecords.length : 0,
            byReason
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
        if (record.lockedUntil < now) {
            // Lockout has expired, clean up
            this.lockoutRecords.delete(userId);
            return null;
        }
        return record;
    }
    /**
     * Clean up expired lockout records
     */
    cleanupExpiredRecords() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            let cleanedCount = 0;
            for (const [userId, record] of this.lockoutRecords.entries()) {
                if (record.lockedUntil < now) {
                    this.lockoutRecords.delete(userId);
                    cleanedCount++;
                }
            }
            return cleanedCount;
        });
    }
    /**
     * Update lockout configuration
     */
    updateConfig(newConfig) {
        this.config = Object.assign(Object.assign({}, this.config), newConfig);
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return Object.assign({}, this.config);
    }
}
exports.AccountLockoutService = AccountLockoutService;
//# sourceMappingURL=AccountLockoutService.js.map