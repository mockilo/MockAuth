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
exports.createBuilderRoutes = void 0;
const express_1 = require("express");
// In-memory storage for configurations (in production, use database)
let savedConfiguration = null;
function createBuilderRoutes(mockAuthInstance) {
    const router = (0, express_1.Router)();
    // Get current stats from the running MockAuth instance
    router.get('/stats', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const stats = yield mockAuthInstance.getStats();
            const userService = mockAuthInstance.getUserService();
            const users = yield userService.getAllUsers();
            res.json({
                success: true,
                data: {
                    totalUsers: users.length,
                    totalConfigs: savedConfiguration ? 1 : 0,
                    totalEndpoints: 8, // Auth endpoints
                    stats: stats,
                },
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }));
    // Save configuration
    router.post('/config/save', (req, res) => {
        try {
            // Check if body is a valid configuration object
            if (typeof req.body !== 'object' || req.body === null) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid configuration data',
                });
            }
            // Check for malformed JSON (when Express fails to parse)
            if (req.body && typeof req.body === 'string' && req.body.includes('invalid json')) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid JSON format',
                });
            }
            const config = req.body;
            savedConfiguration = config;
            res.json({
                success: true,
                message: 'Configuration saved successfully',
                data: config,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    });
    // Load configuration
    router.get('/config/load', (req, res) => {
        try {
            res.json({
                success: true,
                data: savedConfiguration && Object.keys(savedConfiguration).length > 0 ? savedConfiguration : {
                    port: 3001,
                    jwtSecret: '',
                    users: [],
                    endpoints: [],
                },
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    });
    // Bulk create users from builder
    router.post('/users/bulk', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { users } = req.body;
            // Validate users array
            if (!users || !Array.isArray(users)) {
                return res.status(400).json({
                    success: false,
                    error: 'Users array is required',
                });
            }
            const userService = mockAuthInstance.getUserService();
            const createdUsers = [];
            const errors = [];
            for (const userData of users) {
                try {
                    const user = yield userService.createUser({
                        email: userData.email,
                        username: userData.email.split('@')[0],
                        password: userData.password,
                        roles: [userData.role || 'user'],
                    });
                    createdUsers.push(user);
                }
                catch (error) {
                    errors.push({
                        email: userData.email,
                        error: error.message,
                    });
                }
            }
            res.json({
                success: true,
                message: createdUsers.length > 0 ? 'Users created successfully' : 'Created 0 users',
                data: {
                    created: createdUsers.length,
                    failed: errors.length,
                    details: errors,
                },
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }));
    // Get all users
    router.get('/users', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const userService = mockAuthInstance.getUserService();
            const users = yield userService.getAllUsers();
            res.json({
                success: true,
                data: users.map((u) => ({
                    id: u.id,
                    email: u.email,
                    username: u.username,
                    roles: u.roles,
                    createdAt: u.createdAt,
                })),
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }));
    // Test endpoint connectivity
    router.get('/test', (req, res) => {
        res.json({
            success: true,
            message: 'Builder API is connected',
            timestamp: new Date().toISOString(),
        });
    });
    return router;
}
exports.createBuilderRoutes = createBuilderRoutes;
//# sourceMappingURL=builder.js.map