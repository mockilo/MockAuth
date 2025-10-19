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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
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
const path = __importStar(require("path"));
const UserService_1 = require("./services/UserService");
const AuthService_1 = require("./services/AuthService");
const auth_1 = require("./routes/auth");
const users_1 = require("./routes/users");
const roles_1 = require("./routes/roles");
const health_1 = require("./routes/health");
const debug_1 = require("./routes/debug");
const sso_1 = require("./routes/sso");
const rbac_1 = require("./routes/rbac");
const compliance_1 = require("./routes/compliance");
const builder_1 = require("./routes/builder");
const WebhookService_1 = require("./services/WebhookService");
const AuditService_1 = require("./services/AuditService");
const EcosystemService_1 = require("./services/EcosystemService");
const DatabaseService_1 = require("./services/DatabaseService");
const SSOService_1 = require("./services/SSOService");
const AdvancedRBACService_1 = require("./services/AdvancedRBACService");
const ComplianceService_1 = require("./services/ComplianceService");
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
const performance_1 = require("./middleware/performance");
// TypeScript service refresh comment
class MockAuth {
    constructor(config) {
        this.ssoService = null;
        this.rbacService = null;
        this.complianceService = null;
        this.cleanupInterval = null;
        this.config = this.validateConfig(config);
        this.app = (0, express_1.default)();
        this.userService = new UserService_1.UserService(config.users || []);
        this.authService = new AuthService_1.AuthService(this.userService, config.jwtSecret, config.tokenExpiry, config.refreshTokenExpiry);
        this.webhookService = (0, WebhookService_1.createWebhookService)(config.webhooks);
        this.auditService = (0, AuditService_1.createAuditService)(config.enableAuditLog);
        this.ecosystemService = (0, EcosystemService_1.createEcosystemService)({
            mocktail: config.ecosystem?.mocktail || { enabled: false },
            schemaghost: config.ecosystem?.schemaghost || { enabled: false },
        });
        this.databaseService = (0, DatabaseService_1.createDatabaseService)(config.database || { type: 'memory' });
        // Initialize enterprise services
        if (this.config.sso) {
            this.ssoService = (0, SSOService_1.createSSOService)(this.config.sso);
        }
        if (this.config.rbac) {
            this.rbacService = (0, AdvancedRBACService_1.createAdvancedRBACService)(this.config.rbac);
        }
        if (this.config.compliance) {
            this.complianceService = (0, ComplianceService_1.createComplianceService)(this.config.compliance);
        }
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
        // Validate JWT secret strength (minimum 32 characters for security)
        if (config.jwtSecret.length < 32) {
            throw new Error('JWT secret must be at least 32 characters long for security. Current length: ' +
                config.jwtSecret.length);
        }
        if (!config.port) {
            throw new Error('Port is required');
        }
        return {
            tokenExpiry: '24h',
            refreshTokenExpiry: '7d',
            enableMFA: false,
            enablePasswordReset: true,
            enableAccountLockout: true,
            logLevel: 'info',
            enableAuditLog: true,
            maxLoginAttempts: 5,
            lockoutDuration: '15m',
            passwordPolicy: {
                minLength: 8,
                requireUppercase: true,
                requireNumbers: true,
                requireSpecialChars: false,
            },
            cors: {
                origin: true,
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization'],
            },
            rateLimit: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 1000, // limit each IP to 1000 requests per windowMs
                message: 'Too many requests from this IP, please try again later.',
                standardHeaders: true,
                legacyHeaders: false,
            },
            ...config,
        };
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
        this.app.use(performance_1.performanceMiddleware);
        this.app.use(performance_1.errorTrackingMiddleware);
    }
    setupRoutes() {
        // Health check
        this.app.use('/health', (0, health_1.createHealthRoutes)());
        // Debug console routes
        this.app.use('/debug', (0, debug_1.createDebugRoutes)());
        // Authentication routes
        this.app.use('/auth', (0, auth_1.createAuthRoutes)(this.authService, this.userService, this.webhookService, this.auditService));
        // User management routes
        this.app.use('/users', (0, users_1.createUserRoutes)(this.userService, this.authService, this.webhookService, this.auditService));
        // Role management routes
        this.app.use('/roles', (0, roles_1.createRoleRoutes)(this.userService, this.authService, this.webhookService, this.auditService));
        // Builder API routes
        this.app.use('/api/builder', (0, builder_1.createBuilderRoutes)(this));
        // Enterprise routes
        if (this.ssoService) {
            this.app.use('/sso', (0, sso_1.createSSORoutes)(this.ssoService));
        }
        if (this.rbacService) {
            this.app.use('/rbac', (0, rbac_1.createRBACRoutes)(this.rbacService));
        }
        if (this.complianceService) {
            this.app.use('/compliance', (0, compliance_1.createComplianceRoutes)(this.complianceService));
        }
        // Web Interface Routes - Serve your existing HTML files
        this.setupWebInterface();
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
                    metrics: '/metrics',
                    dashboard: '/dashboard',
                    login: '/login',
                },
                documentation: 'https://mockauth.dev/docs',
            });
        });
        // Performance metrics endpoint
        this.app.get('/metrics', (_req, res) => {
            const { performanceMonitor } = require('./middleware/performance');
            res.json({
                success: true,
                data: performanceMonitor.getMetrics(),
                timestamp: new Date().toISOString(),
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
    setupWebInterface() {
        // Serve your existing HTML files from web-builder directory
        // The web-builder files are copied to dist during build
        const webBuilderPath = path.join(__dirname, 'web-builder');
        // Serve static files (JS, CSS, images) from web-builder directory
        this.app.use(express_1.default.static(webBuilderPath));
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(webBuilderPath, 'dashboard.html'));
        });
        this.app.get('/dashboard', (req, res) => {
            res.sendFile(path.join(webBuilderPath, 'dashboard.html'));
        });
        this.app.get('/login', (req, res) => {
            res.sendFile(path.join(webBuilderPath, 'login.html'));
        });
        this.app.get('/signup', (req, res) => {
            res.sendFile(path.join(webBuilderPath, 'signup.html'));
        });
        this.app.get('/forgot-password', (req, res) => {
            res.sendFile(path.join(webBuilderPath, 'forgot-password.html'));
        });
        this.app.get('/builder', (req, res) => {
            res.sendFile(path.join(webBuilderPath, 'index.html'));
        });
        // Serve JavaScript files explicitly
        this.app.get('/builder.js', (req, res) => {
            res.sendFile(path.join(webBuilderPath, 'builder.js'));
        });
        this.app.get('/dashboard.js', (req, res) => {
            res.sendFile(path.join(webBuilderPath, 'dashboard.js'));
        });
        this.app.get('/login.js', (req, res) => {
            res.sendFile(path.join(webBuilderPath, 'login.js'));
        });
        this.app.get('/signup.js', (req, res) => {
            res.sendFile(path.join(webBuilderPath, 'signup.js'));
        });
        this.app.get('/forgot-password.js', (req, res) => {
            res.sendFile(path.join(webBuilderPath, 'forgot-password.js'));
        });
    }
    setupErrorHandling() {
        this.app.use(errorHandler_1.errorHandler);
    }
    async start() {
        return new Promise(async (resolve, reject) => {
            try {
                // Initialize database first
                await this.databaseService.connect();
                // Initialize ecosystem services (non-blocking)
                try {
                    await this.ecosystemService.initialize();
                }
                catch (error) {
                    console.warn('⚠️ Some ecosystem services failed to start, but MockAuth will continue');
                    console.log('💡 You can check the logs above for specific service issues');
                }
                this.server = this.app.listen(this.config.port, this.config.host || 'localhost', () => {
                    console.log(`🚀 MockAuth server running on http://${this.config.host || 'localhost'}:${this.config.port}`);
                    console.log(`📚 API Documentation: ${this.config.baseUrl}/api`);
                    console.log(`❤️  Health Check: ${this.config.baseUrl}/health`);
                    // Log ecosystem status
                    if (this.config.ecosystem?.mocktail?.enabled) {
                        console.log(`🎭 MockTail: Mock data generation enabled`);
                    }
                    if (this.config.ecosystem?.schemaghost?.enabled) {
                        console.log(`👻 SchemaGhost: Mock API server enabled`);
                    }
                    // Start cleanup interval for expired sessions with error handling
                    this.cleanupInterval = setInterval(async () => {
                        try {
                            const cleaned = await this.authService.cleanupExpiredSessions();
                            if (cleaned > 0) {
                                console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
                            }
                        }
                        catch (error) {
                            console.error('❌ Session cleanup failed:', error);
                        }
                    }, 5 * 60 * 1000); // Every 5 minutes
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
    }
    async stop() {
        return new Promise(async (resolve) => {
            // Clear cleanup interval to prevent memory leaks
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
                this.cleanupInterval = null;
                console.log('🧹 Cleanup interval cleared');
            }
            // Stop ecosystem services first
            await this.ecosystemService.stop();
            // Disconnect from database
            await this.databaseService.disconnect();
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
    }
    // Public API methods
    getUserService() {
        return this.userService;
    }
    getAuthService() {
        return this.authService;
    }
    getConfig() {
        return { ...this.config };
    }
    getEcosystemService() {
        return this.ecosystemService;
    }
    getDatabaseService() {
        return this.databaseService;
    }
    async createUser(userData) {
        return this.userService.createUser(userData);
    }
    async login(email, password) {
        const response = await this.authService.login({
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
    }
    async verifyToken(token) {
        return this.authService.verifyToken(token);
    }
    async getStats() {
        const [userStats, sessionStats, healthStats] = await Promise.all([
            this.userService.getUserStats(),
            this.authService.getSessionStats(),
            this.getHealthStatus(),
        ]);
        return {
            users: userStats,
            sessions: sessionStats,
            health: healthStats,
        };
    }
    async getHealthStatus() {
        return {
            status: 'healthy',
            uptime: process.uptime(),
            version: '1.0.0',
            environment: process.env['NODE_ENV'] || 'development',
        };
    }
    initializeUsersSync() {
        if (this.config.users && this.config.users.length > 0) {
            console.log(`📝 Initializing ${this.config.users.length} user(s)...`);
            let successCount = 0;
            let failCount = 0;
            for (const userData of this.config.users) {
                try {
                    // Create user directly in the user service
                    this.userService.createUserSync(userData);
                    successCount++;
                }
                catch (error) {
                    failCount++;
                    console.error(`❌ Failed to initialize user ${userData.email}:`, error);
                }
            }
            console.log(`✅ Successfully initialized ${successCount} user(s)`);
            if (failCount > 0) {
                console.warn(`⚠️  Failed to initialize ${failCount} user(s)`);
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