"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRoutes = void 0;
const express_1 = require("express");
// SECURITY NOTE: Using express-validator which depends on validator package.
// The validator package has a known URL validation vulnerability (GHSA-9965-vmph-33xx).
// This does NOT affect MockAuth as we only use isEmail() and isLength() functions,
// which are not affected by the vulnerability. The isURL() function is never used.
// See SECURITY.md for more details.
const express_validator_1 = require("express-validator");
function createAuthRoutes(authService, userService, webhookService, auditService) {
    const router = (0, express_1.Router)();
    // Login endpoint
    router.post('/login', [
        (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
        (0, express_validator_1.body)('password').isLength({ min: 1 }),
    ], async (req, res) => {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString(),
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
            const response = await authService.login(loginRequest);
            // Log audit event
            if (auditService) {
                await auditService.log({
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
                await webhookService.send('user.login', {
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
                await auditService.log({
                    action: 'user.login',
                    resource: 'auth',
                    details: {
                        email: req.body.email,
                        success: false,
                        error: error.message,
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    success: false,
                    error: error.message,
                });
            }
            // Check if it's an account lockout error
            const isLockoutError = error.message.includes('Account is locked') ||
                error.message.includes('Account locked due to too many failed attempts');
            const statusCode = isLockoutError ? 423 : 401;
            res.status(statusCode).json({
                success: false,
                error: error.message || 'Login failed',
            });
        }
    });
    // Register endpoint
    router.post('/register', [
        (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
        (0, express_validator_1.body)('password').isLength({ min: 8 }),
        (0, express_validator_1.body)('username').isLength({ min: 3, max: 30 }),
    ], async (req, res) => {
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
            const response = await authService.register(registerRequest);
            // Log audit event
            if (auditService) {
                await auditService.log({
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
                await webhookService.send('user.created', {
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
                await auditService.log({
                    action: 'user.created',
                    resource: 'auth',
                    details: {
                        email: req.body.email,
                        success: false,
                        error: error.message,
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    success: false,
                    error: error.message,
                });
            }
            // Check if it's a duplicate email error
            const isDuplicateEmail = error.message.includes('already exists') ||
                error.message.includes('Email already registered');
            const statusCode = isDuplicateEmail ? 409 : 400;
            res.status(statusCode).json({
                success: false,
                error: error.message || 'Registration failed',
            });
        }
    });
    // Logout endpoint
    router.post('/logout', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = await authService.verifyToken(token);
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
            const success = await authService.logout(sessionId);
            if (success) {
                // Log audit event
                if (auditService) {
                    await auditService.log({
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
                    await webhookService.send('user.logout', {
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
    });
    // Refresh token endpoint
    router.post('/refresh', [(0, express_validator_1.body)('refreshToken').isLength({ min: 1 })], async (req, res) => {
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
            const response = await authService.refreshToken({ refreshToken });
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
    });
    // Get current user endpoint
    router.get('/me', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = await authService.getCurrentUser(token);
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
    });
    // Verify token endpoint
    router.post('/verify', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = await authService.verifyToken(token);
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
    });
    // Get user sessions endpoint
    router.get('/sessions', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = await authService.verifyToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
            }
            const sessions = await authService.getUserSessions(user.id);
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
    });
    // Revoke session endpoint
    router.delete('/sessions/:sessionId', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = await authService.verifyToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
            }
            const { sessionId } = req.params;
            const success = await authService.revokeSession(sessionId, user.id);
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
    });
    // MFA Routes
    // Setup MFA
    router.post('/mfa/setup', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = await authService.verifyToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
            }
            const mfaSetup = await authService.setupMFA(user.id);
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
    });
    // Verify MFA setup
    router.post('/mfa/verify-setup', [
        (0, express_validator_1.body)('code').isLength({ min: 6, max: 6 }),
        (0, express_validator_1.body)('backupCode').optional().isLength({ min: 8, max: 8 }),
    ], async (req, res) => {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                });
            }
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = await authService.verifyToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
            }
            const { code, backupCode } = req.body;
            const request = { code, backupCode };
            const result = await authService.verifyMFASetup(user.id, request);
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
    });
    // Verify MFA during login
    router.post('/mfa/verify', [
        (0, express_validator_1.body)('code').isLength({ min: 6, max: 6 }),
        (0, express_validator_1.body)('backupCode').optional().isLength({ min: 8, max: 8 }),
    ], async (req, res) => {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                });
            }
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = await authService.verifyToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
            }
            const { code, backupCode } = req.body;
            const request = { code, backupCode };
            const result = await authService.verifyMFA(user.id, request);
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
    });
    // Disable MFA
    router.delete('/mfa/disable', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = await authService.verifyToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
            }
            await authService.disableMFA(user.id);
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
    });
    // Get MFA status
    router.get('/mfa/status', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = await authService.verifyToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
            }
            const status = await authService.getMFAStatus(user.id);
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
    });
    // Regenerate backup codes
    router.post('/mfa/backup-codes/regenerate', async (req, res) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'No token provided',
                });
            }
            const user = await authService.verifyToken(token);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid token',
                });
            }
            const backupCodes = await authService.regenerateBackupCodes(user.id);
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
    });
    // Password Reset Routes
    // Request password reset
    router.post('/password-reset/request', [(0, express_validator_1.body)('email').isEmail().normalizeEmail()], async (req, res) => {
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
            const result = await authService.requestPasswordReset(request);
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
    });
    // Verify password reset token
    router.post('/password-reset/verify', [(0, express_validator_1.body)('token').isLength({ min: 1 })], async (req, res) => {
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
            const result = await authService.verifyPasswordResetToken(request);
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
    });
    // Complete password reset
    router.post('/password-reset/complete', [
        (0, express_validator_1.body)('token').isLength({ min: 1 }),
        (0, express_validator_1.body)('newPassword').isLength({ min: 8 }),
    ], async (req, res) => {
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
            const result = await authService.completePasswordReset(request);
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
    });
    return router;
}
exports.createAuthRoutes = createAuthRoutes;
//# sourceMappingURL=auth.js.map