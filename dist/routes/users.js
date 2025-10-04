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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
function createUserRoutes(userService, authService, webhookService, auditService) {
    const router = (0, express_1.Router)();
    // Middleware to verify admin access
    const requireAdmin = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
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
            const isAdmin = yield userService.hasRole(user.id, 'admin');
            if (!isAdmin) {
                return res.status(403).json({
                    success: false,
                    error: 'Admin access required',
                });
            }
            req.user = user;
            next();
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Authentication failed',
            });
        }
    });
    // Middleware to verify user access (own profile or admin)
    const requireUserAccess = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        var _b;
        try {
            const token = (_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.replace('Bearer ', '');
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
            const isAdmin = yield userService.hasRole(user.id, 'admin');
            const isOwnProfile = req.params.id === user.id;
            if (!isAdmin && !isOwnProfile) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied',
                });
            }
            req.user = user;
            next();
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Authentication failed',
            });
        }
    });
    // Get all users (admin only)
    router.get('/', requireAdmin, [
        (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
        (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
        (0, express_validator_1.query)('role').optional().isString(),
        (0, express_validator_1.query)('search').optional().isString(),
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
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const role = req.query.role;
            const search = req.query.search;
            let users = yield userService.getAllUsers();
            // Filter by role
            if (role) {
                users = users.filter(user => user.roles.includes(role));
            }
            // Search
            if (search) {
                users = yield userService.searchUsers(search, limit);
            }
            // Pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedUsers = users.slice(startIndex, endIndex);
            // Remove passwords from response
            const sanitizedUsers = paginatedUsers.map(user => {
                const { password } = user, sanitizedUser = __rest(user, ["password"]);
                return sanitizedUser;
            });
            res.json({
                success: true,
                data: sanitizedUsers,
                pagination: {
                    page,
                    limit,
                    total: users.length,
                    pages: Math.ceil(users.length / limit),
                },
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to get users',
            });
        }
    }));
    // Get user by ID
    router.get('/:id', requireUserAccess, (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const user = yield userService.getUserById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found',
                });
            }
            // Remove password from response
            const { password } = user, sanitizedUser = __rest(user, ["password"]);
            res.json({
                success: true,
                data: sanitizedUser,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to get user',
            });
        }
    }));
    // Create user (admin only)
    router.post('/', requireAdmin, [
        (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
        (0, express_validator_1.body)('username').isLength({ min: 3, max: 30 }),
        (0, express_validator_1.body)('password').isLength({ min: 8 }),
        (0, express_validator_1.body)('roles').optional().isArray(),
        (0, express_validator_1.body)('permissions').optional().isArray(),
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
            const userData = req.body;
            const user = yield userService.createUser(userData);
            // Log audit event
            if (auditService) {
                yield auditService.log({
                    action: 'user.created',
                    resource: 'users',
                    details: { userId: user.id, email: user.email, success: true },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    success: true,
                });
            }
            // Send webhook
            if (webhookService) {
                yield webhookService.send('user.created', {
                    user: { id: user.id, email: user.email, username: user.username },
                });
            }
            // Remove password from response
            const { password } = user, sanitizedUser = __rest(user, ["password"]);
            res.status(201).json({
                success: true,
                data: sanitizedUser,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to create user',
            });
        }
    }));
    // Update user
    router.put('/:id', requireUserAccess, [
        (0, express_validator_1.body)('username').optional().isLength({ min: 3, max: 30 }),
        (0, express_validator_1.body)('profile').optional().isObject(),
        (0, express_validator_1.body)('roles').optional().isArray(),
        (0, express_validator_1.body)('permissions').optional().isArray(),
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
            const { id } = req.params;
            const updates = req.body;
            const user = yield userService.updateUser(id, updates);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found',
                });
            }
            // Log audit event
            if (auditService) {
                yield auditService.log({
                    action: 'user.updated',
                    resource: 'users',
                    details: { userId: user.id, updates, success: true },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    success: true,
                });
            }
            // Send webhook
            if (webhookService) {
                yield webhookService.send('user.updated', {
                    user: { id: user.id, email: user.email, username: user.username },
                });
            }
            // Remove password from response
            const { password } = user, sanitizedUser = __rest(user, ["password"]);
            res.json({
                success: true,
                data: sanitizedUser,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to update user',
            });
        }
    }));
    // Delete user (admin only)
    router.delete('/:id', requireAdmin, (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { id } = req.params;
            const success = yield userService.deleteUser(id);
            if (!success) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found',
                });
            }
            // Log audit event
            if (auditService) {
                yield auditService.log({
                    action: 'user.deleted',
                    resource: 'users',
                    details: { userId: id, success: true },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    success: true,
                });
            }
            // Send webhook
            if (webhookService) {
                yield webhookService.send('user.deleted', {
                    user: { id },
                });
            }
            res.json({
                success: true,
                message: 'User deleted successfully',
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to delete user',
            });
        }
    }));
    // Get user stats (admin only)
    router.get('/stats/overview', requireAdmin, (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const stats = yield userService.getUserStats();
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to get user stats',
            });
        }
    }));
    // Search users (admin only)
    router.get('/search/query', requireAdmin, [
        (0, express_validator_1.query)('q').isString().isLength({ min: 1 }),
        (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
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
            const query = req.query.q;
            const limit = parseInt(req.query.limit) || 10;
            const users = yield userService.searchUsers(query, limit);
            // Remove passwords from response
            const sanitizedUsers = users.map(user => {
                const { password } = user, sanitizedUser = __rest(user, ["password"]);
                return sanitizedUser;
            });
            res.json({
                success: true,
                data: sanitizedUsers,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to search users',
            });
        }
    }));
    return router;
}
exports.createUserRoutes = createUserRoutes;
//# sourceMappingURL=users.js.map