"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.createMFAService = exports.MFAService = void 0;
const speakeasy = __importStar(require("speakeasy"));
const QRCode = __importStar(require("qrcode"));
class MFAService {
    static getInstance() {
        if (!MFAService.instance) {
            MFAService.instance = new MFAService();
        }
        return MFAService.instance;
    }
    // Static method for tests
    static generateSecret() {
        const secret = speakeasy.generateSecret({
            name: 'test@example.com',
            issuer: 'MockAuth',
            length: 32,
        });
        return secret.base32;
    }
    // Static method for tests
    static generateQRCodeData(secret, email) {
        return __awaiter(this, void 0, void 0, function* () {
            const otpauthUrl = `otpauth://totp/MockAuth:${email}?secret=${secret}&issuer=MockAuth`;
            try {
                const qrCodeDataURL = yield QRCode.toDataURL(otpauthUrl);
                return qrCodeDataURL;
            }
            catch (error) {
                throw new Error(`Failed to generate QR code: ${error.message}`);
            }
        });
    }
    generateSecret(user) {
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
    generateQRCode(secret, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const otpauthUrl = `otpauth://totp/MockAuth:${user.email}?secret=${secret}&issuer=MockAuth`;
            try {
                const qrCodeDataURL = yield QRCode.toDataURL(otpauthUrl);
                return qrCodeDataURL;
            }
            catch (error) {
                throw new Error(`Failed to generate QR code: ${error.message}`);
            }
        });
    }
    verifyToken(secret, token) {
        return speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 2, // Allow 2 time steps (60 seconds) of variance
        });
    }
    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            codes.push(this.generateRandomCode());
        }
        return codes;
    }
    generateRandomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    verifyBackupCode(backupCodes, code) {
        const index = backupCodes.indexOf(code);
        if (index !== -1) {
            // Remove used backup code
            backupCodes.splice(index, 1);
            return { valid: true, remainingCodes: [...backupCodes] };
        }
        return { valid: false, remainingCodes: [...backupCodes] };
    }
    // Static methods for AuthService compatibility
    static setupMFA(user) {
        const instance = MFAService.getInstance();
        const secret = instance.generateSecret(user);
        const backupCodes = instance.generateBackupCodes();
        return Object.assign(Object.assign({}, secret), { backupCodes });
    }
    static createMFAConfig(user) {
        return MFAService.setupMFA(user);
    }
    static verifyTOTP(secret, token) {
        return MFAService.getInstance().verifyToken(secret, token);
    }
    static verifyBackupCode(backupCodes, code) {
        return MFAService.getInstance().verifyBackupCode(backupCodes, code);
    }
    static disableMFA(user) {
        // Implementation for disabling MFA
        console.log(`MFA disabled for user: ${user.email}`);
        return undefined;
    }
    static isMFAEnabled(user) {
        var _a;
        return ((_a = user.mfa) === null || _a === void 0 ? void 0 : _a.enabled) || false;
    }
    static getRemainingBackupCodes(user) {
        var _a, _b;
        return ((_b = (_a = user.mfa) === null || _a === void 0 ? void 0 : _a.backupCodes) === null || _b === void 0 ? void 0 : _b.length) || 0;
    }
    static generateBackupCodes() {
        return MFAService.getInstance().generateBackupCodes();
    }
}
exports.MFAService = MFAService;
function createMFAService() {
    return MFAService.getInstance();
}
exports.createMFAService = createMFAService;
//# sourceMappingURL=MFAService.js.map