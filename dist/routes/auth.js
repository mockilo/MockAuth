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
exports.createAuthRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
function createAuthRoutes(authService, userService, webhookService, auditService) {
    const router = (0, express_1.Router)();
    // Login endpoint
    router.post('/login', [
        (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
        (0, express_validator_1.body)('password').isLength({ min: 1 }),
    ], (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                });
            }
            const { email, password, rememberMe, device, ipAddress, userAgent } = req.body;
            const loginRequest = {
                email,
                password,
                rememberMe,
                device: device || req.get('User-Agent'),
                ipAddress: ipAddress || req.ip,
                userAgent: userAgent || req.get('User-Agent'),
            };
            const response = yield authService.login(loginRequest);
            // Log audit event
            if (auditService) {
                yield auditService.log({
                    action: 'user.login',
                    resource: 'auth',
                    details: { email, success: true },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    success: true,
                });
            }
            // Send webhook
            if (webhookService) {
                yield webhookService.send('user.login', {
                    user: response.user,
                    session: { id: response.sessionId },
                });
            }
            res.json({
                success: true,
                data: response,
            });
        }
        catch (error) {
            // Log failed login
            if (auditService) {
                yield auditService.log({
                    action: 'user.login',
                    resource: 'auth',
                    details: { email: req.body.email, success: false, error: error.message },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    success: false,
                    error: error.message,
                });
            }
            res.status(401).json({
                success: false,
                error: error.message || 'Login failed',
            });
        }
    }));
    // Register endpoint
    router.post('/register', [
        (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
        (0, express_validator_1.body)('password').isLength({ min: 8 }),
        (0, express_validator_1.body)('username').isLength({ min: 3, max: 30 }),
    ], (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                });
            }
            const { email, password, username, profile, roles, permissions } = req.body;
            const registerRequest = {
                email,
                password,
                username,
                profile,
                roles,
                permissions,
            };
            const response = yield authService.register(registerRequest);
            // Log audit event
            if (auditService) {
                yield auditService.log({
                    action: 'user.created',
                    resource: 'auth',
                    details: { email, username, success: true },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    success: true,
                });
            }
            // Send webhook
            if (webhookService) {
                yield webhookService.send('user.created', {
                    user: response.user,
                });
            }
            res.status(201).json({
                success: true,
                data: response,
            });
        }
        catch (error) {
            // Log failed registration
            if (auditService) {
                yield auditService.log({
                    action: 'user.created',
                    resource: 'auth',
                    details: { email: req.body.email, success: false, error: error.message },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    success: false,
                    error: error.message,
                });
            }
            res.status(400).json({
                success: false,
                error: error.message || 'Registration failed',
            });
        }
    }));
    // Logout endpoint
    router.post('/logout', (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = yield authService.verifyToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
            }
            // Get session ID from token
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token format',
                });
            }
            const decoded = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            const sessionId = decoded.sessionId;
            const success = yield authService.logout(sessionId);
            if (success) {
                // Log audit event
                if (auditService) {
                    yield auditService.log({
                        action: 'user.logout',
                        resource: 'auth',
                        details: { userId: user.id, success: true },
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent'),
                        success: true,
                    });
                }
                // Send webhook
                if (webhookService) {
                    yield webhookService.send('user.logout', {
                        user: { id: user.id, email: user.email },
                    });
                }
                return res.json({
                    success: true,
                    message: 'Logged out successfully',
                });
            }
            else {
                return res.status(400).json({
                    success: false,
                    error: 'Logout failed',
                });
            }
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: 'Logout failed',
            });
        }
    }));
    // Refresh token endpoint
    router.post('/refresh', [
        (0, express_validator_1.body)('refreshToken').isLength({ min: 1 }),
    ], (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                });
            }
            const { refreshToken } = req.body;
            const response = yield authService.refreshToken({ refreshToken });
            res.json({
                success: true,
                data: response,
            });
        }
        catch (error) {
            res.status(401).json({
                success: false,
                error: error.message || 'Token refresh failed',
            });
        }
    }));
    // Get current user endpoint
    router.get('/me', (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _b;
        try {
            const token = (_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = yield authService.getCurrentUser(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
            }
            return res.json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: 'Failed to get user information',
            });
        }
    }));
    // Verify token endpoint
    router.post('/verify', (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _c;
        try {
            const token = (_c = req.headers.authorization) === null || _c === void 0 ? void 0 : _c.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = yield authService.verifyToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
            }
            res.json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Token verification failed',
            });
        }
    }));
    // Get user sessions endpoint
    router.get('/sessions', (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _d;
        try {
            const token = (_d = req.headers.authorization) === null || _d === void 0 ? void 0 : _d.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = yield authService.verifyToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
            }
            const sessions = yield authService.getUserSessions(user.id);
            res.json({
                success: true,
                data: sessions,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to get user sessions',
            });
        }
    }));
    // Revoke session endpoint
    router.delete('/sessions/:sessionId', (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _e;
        try {
            const token = (_e = req.headers.authorization) === null || _e === void 0 ? void 0 : _e.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = yield authService.verifyToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
            }
            const { sessionId } = req.params;
            const success = yield authService.revokeSession(sessionId, user.id);
            if (success) {
                res.json({
                    success: true,
                    message: 'Session revoked successfully',
                });
            }
            else {
                res.status(404).json({
                    success: false,
                    error: 'Session not found',
                });
            }
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to revoke session',
            });
        }
    }));
    // MFA Routes
    // Setup MFA
    router.post('/mfa/setup', (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _f;
        try {
            const token = (_f = req.headers.authorization) === null || _f === void 0 ? void 0 : _f.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = yield authService.verifyToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
            }
            const mfaSetup = yield authService.setupMFA(user.id);
            res.json({
                success: true,
                data: mfaSetup,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'MFA setup failed',
            });
        }
    }));
    // Verify MFA setup
    router.post('/mfa/verify-setup', [
        (0, express_validator_1.body)('code').isLength({ min: 6, max: 6 }),
        (0, express_validator_1.body)('backupCode').optional().isLength({ min: 8, max: 8 }),
    ], (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _g;
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                });
            }
            const token = (_g = req.headers.authorization) === null || _g === void 0 ? void 0 : _g.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = yield authService.verifyToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
            }
            const { code, backupCode } = req.body;
            const request = { code, backupCode };
            const result = yield authService.verifyMFASetup(user.id, request);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'MFA verification failed',
            });
        }
    }));
    // Verify MFA during login
    router.post('/mfa/verify', [
        (0, express_validator_1.body)('code').isLength({ min: 6, max: 6 }),
        (0, express_validator_1.body)('backupCode').optional().isLength({ min: 8, max: 8 }),
    ], (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _h;
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                });
            }
            const token = (_h = req.headers.authorization) === null || _h === void 0 ? void 0 : _h.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = yield authService.verifyToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
            }
            const { code, backupCode } = req.body;
            const request = { code, backupCode };
            const result = yield authService.verifyMFA(user.id, request);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'MFA verification failed',
            });
        }
    }));
    // Disable MFA
    router.delete('/mfa/disable', (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _j;
        try {
            const token = (_j = req.headers.authorization) === null || _j === void 0 ? void 0 : _j.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = yield authService.verifyToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
            }
            yield authService.disableMFA(user.id);
            res.json({
                success: true,
                message: 'MFA disabled successfully',
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to disable MFA',
            });
        }
    }));
    // Get MFA status
    router.get('/mfa/status', (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _k;
        try {
            const token = (_k = req.headers.authorization) === null || _k === void 0 ? void 0 : _k.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = yield authService.verifyToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
            }
            const status = yield authService.getMFAStatus(user.id);
            res.json({
                success: true,
                data: status,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to get MFA status',
            });
        }
    }));
    // Regenerate backup codes
    router.post('/mfa/backup-codes/regenerate', (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _l;
        try {
            const token = (_l = req.headers.authorization) === null || _l === void 0 ? void 0 : _l.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = yield authService.verifyToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
            }
            const backupCodes = yield authService.regenerateBackupCodes(user.id);
            res.json({
                success: true,
                data: { backupCodes },
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to regenerate backup codes',
            });
        }
    }));
    // Password Reset Routes
    // Request password reset
    router.post('/password-reset/request', [
        (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    ], (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                });
            }
            const { email } = req.body;
            const request = { email };
            const result = yield authService.requestPasswordReset(request);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Password reset request failed',
            });
        }
    }));
    // Verify password reset token
    router.post('/password-reset/verify', [
        (0, express_validator_1.body)('token').isLength({ min: 1 }),
    ], (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                });
            }
            const { token } = req.body;
            const request = { token };
            const result = yield authService.verifyPasswordResetToken(request);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Token verification failed',
            });
        }
    }));
    // Complete password reset
    router.post('/password-reset/complete', [
        (0, express_validator_1.body)('token').isLength({ min: 1 }),
        (0, express_validator_1.body)('newPassword').isLength({ min: 8 }),
    ], (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                });
            }
            const { token, newPassword } = req.body;
            const request = { token, newPassword };
            const result = yield authService.completePasswordReset(request);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Password reset failed',
            });
        }
    }));
    return router;
}
exports.createAuthRoutes = createAuthRoutes;
//# sourceMappingURL=auth.js.map