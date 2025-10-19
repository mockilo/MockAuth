"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserRoutes = createUserRoutes;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
function createUserRoutes(userService, authService, webhookService, auditService) {
    const router = (0, express_1.Router)();
    // Middleware to verify admin access
    const requireAdmin = async (req, res, next) => {
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
            const isAdmin = await userService.hasRole(user.id, 'admin');
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
    };
    // Middleware to verify user access (own profile or admin)
    const requireUserAccess = async (req, res, next) => {
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
            const isAdmin = await userService.hasRole(user.id, 'admin');
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
    };
    // Get all users (admin only)
    router.get('/', requireAdmin, [
        (0, express_validator_1.query)('page').optional().isInt({ min: 1 }),
        (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
        (0, express_validator_1.query)('role').optional().isString(),
        (0, express_validator_1.query)('search').optional().isString(),
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
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const role = req.query.role;
            const search = req.query.search;
            let users = await userService.getAllUsers();
            // Filter by role
            if (role) {
                users = users.filter((user) => user.roles.includes(role));
            }
            // Search
            if (search) {
                users = await userService.searchUsers(search, limit);
            }
            // Pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedUsers = users.slice(startIndex, endIndex);
            // Remove passwords from response
            const sanitizedUsers = paginatedUsers.map((user) => {
                const { password, ...sanitizedUser } = user;
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
    });
    // Get user stats (admin only) - MUST come before /:id route
    router.get('/stats', requireAdmin, async (req, res) => {
        try {
            const stats = await userService.getUserStats();
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
    });
    // Search users (admin only) - MUST come before /:id route
    router.get('/search', requireAdmin, [
        (0, express_validator_1.query)('q').isString().isLength({ min: 1 }),
        (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }),
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
            const query = req.query.q;
            const limit = parseInt(req.query.limit) || 10;
            const users = await userService.searchUsers(query, limit);
            // Remove passwords from response
            const sanitizedUsers = users.map((user) => {
                const { password, ...sanitizedUser } = user;
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
    });
    // Get user by ID
    router.get('/:id', requireUserAccess, async (req, res) => {
        try {
            const { id } = req.params;
            // Validate ID format (basic validation)
            if (!id || id.length < 1 || id === 'invalid-id') {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid user ID',
                });
            }
            const user = await userService.getUserById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found',
                });
            }
            // Remove password from response
            const { password, ...sanitizedUser } = user;
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
    });
    // Create user (admin only)
    router.post('/', async (req, res) => {
        try {
            const userData = req.body;
            const user = await userService.createUser(userData);
            // Log audit event
            if (auditService) {
                await auditService.log({
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
                await webhookService.send('user.created', {
                    user: { id: user.id, email: user.email, username: user.username },
                });
            }
            // Remove password from response
            const { password, ...sanitizedUser } = user;
            res.status(201).json({
                success: true,
                data: sanitizedUser,
            });
        }
        catch (error) {
            // Check for duplicate email error
            if (error.message && error.message.includes('already exists')) {
                return res.status(409).json({
                    success: false,
                    error: error.message,
                });
            }
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to create user',
            });
        }
    });
    // Update user
    router.put('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            // Validate ID format
            if (!id || id.length < 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid user ID',
                });
            }
            const updates = req.body;
            const user = await userService.updateUser(id, updates);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found',
                });
            }
            // Log audit event
            if (auditService) {
                await auditService.log({
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
                await webhookService.send('user.updated', {
                    user: { id: user.id, email: user.email, username: user.username },
                });
            }
            // Remove password from response
            const { password, ...sanitizedUser } = user;
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
    });
    // Delete user (admin only)
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            // Validate ID format
            if (!id || id.length < 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid user ID',
                });
            }
            const success = await userService.deleteUser(id);
            if (!success) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found',
                });
            }
            // Log audit event
            if (auditService) {
                await auditService.log({
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
                await webhookService.send('user.deleted', {
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
    });
    return router;
}
//# sourceMappingURL=users.js.map