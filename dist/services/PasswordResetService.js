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
exports.PasswordResetService = void 0;
const uuid_1 = require("uuid");
class PasswordResetService {
    constructor(tokenExpiry = 15 * 60 * 1000 // 15 minutes
    ) {
        this.tokenExpiry = tokenExpiry;
        this.resetTokens = new Map();
        this.userResetTokens = new Map(); // userId -> token[]
    }
    /**
     * Request password reset for a user
     */
    requestPasswordReset(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email } = request;
            // In a real implementation, you would check if the user exists
            // For MockAuth, we'll always return success to prevent email enumeration
            const token = this.generateResetToken(email);
            // Store the reset token
            this.resetTokens.set(token, {
                token,
                userId: 'mock-user-id', // In real implementation, get from user lookup
                email,
                expiresAt: new Date(Date.now() + this.tokenExpiry),
                used: false,
                createdAt: new Date()
            });
            // Add to user's reset tokens
            const userTokens = this.userResetTokens.get('mock-user-id') || [];
            userTokens.push(token);
            this.userResetTokens.set('mock-user-id', userTokens);
            return {
                success: true,
                message: 'Password reset instructions have been sent to your email',
                token // In production, don't return the token
            };
        });
    }
    /**
     * Verify password reset token
     */
    verifyResetToken(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { token } = request;
            const resetToken = this.resetTokens.get(token);
            if (!resetToken) {
                return { valid: false, message: 'Invalid reset token' };
            }
            if (resetToken.used) {
                return { valid: false, message: 'Reset token has already been used' };
            }
            if (resetToken.expiresAt < new Date()) {
                return { valid: false, message: 'Reset token has expired' };
            }
            return { valid: true, message: 'Reset token is valid' };
        });
    }
    /**
     * Complete password reset
     */
    completePasswordReset(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { token, newPassword } = request;
            const resetToken = this.resetTokens.get(token);
            if (!resetToken) {
                return { success: false, message: 'Invalid reset token' };
            }
            if (resetToken.used) {
                return { success: false, message: 'Reset token has already been used' };
            }
            if (resetToken.expiresAt < new Date()) {
                return { success: false, message: 'Reset token has expired' };
            }
            // Mark token as used
            resetToken.used = true;
            this.resetTokens.set(token, resetToken);
            // In a real implementation, you would update the user's password
            // For MockAuth, we'll just return success
            return {
                success: true,
                message: 'Password has been reset successfully'
            };
        });
    }
    /**
     * Generate a secure reset token
     */
    generateResetToken(email) {
        const timestamp = Date.now().toString();
        const random = (0, uuid_1.v4)();
        return Buffer.from(`${email}:${timestamp}:${random}`).toString('base64');
    }
    /**
     * Clean up expired tokens
     */
    cleanupExpiredTokens() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            let cleanedCount = 0;
            for (const [token, resetToken] of this.resetTokens.entries()) {
                if (resetToken.expiresAt < now || resetToken.used) {
                    this.resetTokens.delete(token);
                    cleanedCount++;
                }
            }
            return cleanedCount;
        });
    }
    /**
     * Get reset token statistics
     */
    getStats() {
        const now = new Date();
        const tokens = Array.from(this.resetTokens.values());
        return {
            total: tokens.length,
            active: tokens.filter(t => !t.used && t.expiresAt > now).length,
            expired: tokens.filter(t => t.expiresAt <= now).length,
            used: tokens.filter(t => t.used).length
        };
    }
    /**
     * Revoke all reset tokens for a user
     */
    revokeUserTokens(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const userTokens = this.userResetTokens.get(userId) || [];
            let revokedCount = 0;
            for (const token of userTokens) {
                if (this.resetTokens.has(token)) {
                    this.resetTokens.delete(token);
                    revokedCount++;
                }
            }
            this.userResetTokens.delete(userId);
            return revokedCount;
        });
    }
}
exports.PasswordResetService = PasswordResetService;
//# sourceMappingURL=PasswordResetService.js.map