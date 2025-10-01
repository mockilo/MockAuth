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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.UserService = exports.MockAuth = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const UserService_1 = require("./services/UserService");
const AuthService_1 = require("./services/AuthService");
const auth_1 = require("./routes/auth");
const users_1 = require("./routes/users");
const roles_1 = require("./routes/roles");
const health_1 = require("./routes/health");
const WebhookService_1 = require("./services/WebhookService");
const AuditService_1 = require("./services/AuditService");
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
// TypeScript service refresh comment
class MockAuth {
    constructor(config) {
        this.config = this.validateConfig(config);
        this.app = (0, express_1.default)();
        this.userService = new UserService_1.UserService(config.users || []);
        this.authService = new AuthService_1.AuthService(this.userService, config.jwtSecret, config.tokenExpiry, config.refreshTokenExpiry);
        this.webhookService = (0, WebhookService_1.createWebhookService)(config.webhooks);
        this.auditService = (0, AuditService_1.createAuditService)(config.enableAuditLog);
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
        // Initialize users synchronously
        this.initializeUsersSync();
    }
    validateConfig(config) {
        if (!config.jwtSecret) {
            throw new Error('JWT secret is required');
        }
        if (!config.port) {
            throw new Error('Port is required');
        }
        return Object.assign({ tokenExpiry: '24h', refreshTokenExpiry: '7d', enableMFA: false, enablePasswordReset: true, enableAccountLockout: true, logLevel: 'info', enableAuditLog: true, maxLoginAttempts: 5, lockoutDuration: '15m', passwordPolicy: {
                minLength: 8,
                requireUppercase: true,
                requireNumbers: true,
                requireSpecialChars: false,
            }, cors: {
                origin: true,
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization'],
            }, rateLimit: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 1000, // limit each IP to 1000 requests per windowMs
                message: 'Too many requests from this IP, please try again later.',
                standardHeaders: true,
                legacyHeaders: false,
            } }, config);
    }
    setupMiddleware() {
        // Security middleware
        this.app.use((0, helmet_1.default)());
        // CORS
        this.app.use((0, cors_1.default)(this.config.cors));
        // Compression
        this.app.use((0, compression_1.default)());
        // Request logging
        this.app.use((0, morgan_1.default)('combined'));
        // Rate limiting
        this.app.use((0, express_rate_limit_1.default)(this.config.rateLimit));
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Custom middleware
        this.app.use(requestLogger_1.requestLogger);
    }
    setupRoutes() {
        // Health check
        this.app.use('/health', (0, health_1.createHealthRoutes)());
        // Authentication routes
        this.app.use('/auth', (0, auth_1.createAuthRoutes)(this.authService, this.userService, this.webhookService, this.auditService));
        // User management routes
        this.app.use('/users', (0, users_1.createUserRoutes)(this.userService, this.authService, this.webhookService, this.auditService));
        // Role management routes
        this.app.use('/roles', (0, roles_1.createRoleRoutes)(this.userService, this.authService, this.webhookService, this.auditService));
        // API documentation
        this.app.get('/api', (_req, res) => {
            res.json({
                name: 'MockAuth API',
                version: '1.0.0',
                description: 'Developer-first authentication simulator',
                endpoints: {
                    health: '/health',
                    auth: '/auth',
                    users: '/users',
                    roles: '/roles',
                },
                documentation: 'https://mockauth.dev/docs',
            });
        });
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint not found',
                path: req.originalUrl,
                method: req.method,
            });
        });
    }
    setupErrorHandling() {
        this.app.use(errorHandler_1.errorHandler);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    this.server = this.app.listen(this.config.port, this.config.host || 'localhost', () => {
                        console.log(`🚀 MockAuth server running on http://${this.config.host || 'localhost'}:${this.config.port}`);
                        console.log(`📚 API Documentation: ${this.config.baseUrl}/api`);
                        console.log(`❤️  Health Check: ${this.config.baseUrl}/health`);
                        // Start cleanup interval for expired sessions
                        setInterval(() => __awaiter(this, void 0, void 0, function* () {
                            const cleaned = yield this.authService.cleanupExpiredSessions();
                            if (cleaned > 0) {
                                console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
                            }
                        }), 5 * 60 * 1000); // Every 5 minutes
                        resolve();
                    });
                    this.server.on('error', (error) => {
                        if (error.code === 'EADDRINUSE') {
                            reject(new Error(`Port ${this.config.port} is already in use`));
                        }
                        else {
                            reject(error);
                        }
                    });
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                if (this.server) {
                    this.server.close(() => {
                        console.log('🛑 MockAuth server stopped');
                        resolve();
                    });
                }
                else {
                    resolve();
                }
            });
        });
    }
    // Public API methods
    getUserService() {
        return this.userService;
    }
    getAuthService() {
        return this.authService;
    }
    getConfig() {
        return Object.assign({}, this.config);
    }
    createUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.userService.createUser(userData);
        });
    }
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.authService.login({
                email,
                password,
                device: 'MockAuth API',
                ipAddress: '127.0.0.1',
                userAgent: 'MockAuth/1.0.0',
            });
            return {
                user: response.user,
                token: response.token,
                refreshToken: response.refreshToken,
                expiresIn: response.expiresIn,
            };
        });
    }
    verifyToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.authService.verifyToken(token);
        });
    }
    getStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const [userStats, sessionStats, healthStats] = yield Promise.all([
                this.userService.getUserStats(),
                this.authService.getSessionStats(),
                this.getHealthStatus(),
            ]);
            return {
                users: userStats,
                sessions: sessionStats,
                health: healthStats,
            };
        });
    }
    getHealthStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                status: 'healthy',
                uptime: process.uptime(),
                version: '1.0.0',
                environment: process.env['NODE_ENV'] || 'development',
            };
        });
    }
    initializeUsersSync() {
        if (this.config.users && this.config.users.length > 0) {
            for (const userData of this.config.users) {
                try {
                    // Create user directly in the user service
                    this.userService.createUserSync(userData);
                }
                catch (error) {
                    console.warn(`Failed to initialize user ${userData.email}:`, error);
                }
            }
        }
    }
}
exports.MockAuth = MockAuth;
// Export types and classes
__exportStar(require("./types"), exports);
var UserService_2 = require("./services/UserService");
Object.defineProperty(exports, "UserService", { enumerable: true, get: function () { return UserService_2.UserService; } });
var AuthService_2 = require("./services/AuthService");
Object.defineProperty(exports, "AuthService", { enumerable: true, get: function () { return AuthService_2.AuthService; } });
// Default export
exports.default = MockAuth;
//# sourceMappingURL=index.js.map