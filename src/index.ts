import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import * as path from 'path';
import {
  MockAuthConfig,
  User,
  WebhookService,
  AuditService,
  EcosystemService,
  DatabaseService,
} from './types';
import { UserService } from './services/UserService';
import { AuthService } from './services/AuthService';
import { createAuthRoutes } from './routes/auth';
import { createUserRoutes } from './routes/users';
import { createRoleRoutes } from './routes/roles';
import { createHealthRoutes } from './routes/health';
import { createDebugRoutes } from './routes/debug';
import { createSSORoutes } from './routes/sso';
import { createRBACRoutes } from './routes/rbac';
import { createComplianceRoutes } from './routes/compliance';
import { createBuilderRoutes } from './routes/builder';
import { createWebhookService } from './services/WebhookService';
import { createAuditService } from './services/AuditService';
import { createEcosystemService } from './services/EcosystemService';
import { createDatabaseService } from './services/DatabaseService';
import { createSSOService } from './services/SSOService';
import { createAdvancedRBACService } from './services/AdvancedRBACService';
import { createComplianceService } from './services/ComplianceService';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import {
  performanceMiddleware,
  errorTrackingMiddleware,
} from './middleware/performance';

// TypeScript service refresh comment

export class MockAuth {
  private app: express.Application;
  private server: any;
  private userService: UserService;
  private authService: AuthService;
  private webhookService: WebhookService | null;
  private auditService: AuditService | null;
  private ecosystemService: EcosystemService;
  private databaseService: DatabaseService;
  private ssoService: any = null;
  private rbacService: any = null;
  private complianceService: any = null;
  private config: MockAuthConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: MockAuthConfig) {
    this.config = this.validateConfig(config);
    this.app = express();
    this.userService = new UserService(config.users || []);
    this.authService = new AuthService(
      this.userService,
      config.jwtSecret,
      config.tokenExpiry,
      config.refreshTokenExpiry
    );
    this.webhookService = createWebhookService(config.webhooks);
    this.auditService = createAuditService(config.enableAuditLog);
    this.ecosystemService = createEcosystemService({
      mocktail: config.ecosystem?.mocktail || { enabled: false },
      schemaghost: config.ecosystem?.schemaghost || { enabled: false },
    });
    this.databaseService = createDatabaseService(
      config.database || { type: 'memory' }
    );

    // Initialize enterprise services
    if (this.config.sso) {
      this.ssoService = createSSOService(this.config.sso);
    }
    if (this.config.rbac) {
      this.rbacService = createAdvancedRBACService(this.config.rbac);
    }
    if (this.config.compliance) {
      this.complianceService = createComplianceService(this.config.compliance);
    }

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();

    // Initialize users synchronously
    this.initializeUsersSync();
  }

  private validateConfig(config: MockAuthConfig): MockAuthConfig {
    if (!config.jwtSecret) {
      throw new Error('JWT secret is required');
    }

    // Validate JWT secret strength (minimum 32 characters for security)
    if (config.jwtSecret.length < 32) {
      throw new Error(
        'JWT secret must be at least 32 characters long for security. Current length: ' +
          config.jwtSecret.length
      );
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

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS
    this.app.use(cors(this.config.cors));

    // Compression
    this.app.use(compression());

    // Request logging
    this.app.use(morgan('combined'));

    // Rate limiting
    this.app.use(rateLimit(this.config.rateLimit));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Custom middleware
    this.app.use(requestLogger);
    this.app.use(performanceMiddleware);
    this.app.use(errorTrackingMiddleware);
  }

  private setupRoutes(): void {
    // Health check
    this.app.use('/health', createHealthRoutes());

    // Debug console routes
    this.app.use('/debug', createDebugRoutes());

    // Authentication routes
    this.app.use(
      '/auth',
      createAuthRoutes(
        this.authService,
        this.userService,
        this.webhookService,
        this.auditService
      )
    );

    // User management routes
    this.app.use(
      '/users',
      createUserRoutes(
        this.userService,
        this.authService,
        this.webhookService,
        this.auditService
      )
    );

    // Role management routes
    this.app.use(
      '/roles',
      createRoleRoutes(
        this.userService,
        this.authService,
        this.webhookService,
        this.auditService
      )
    );

    // Builder API routes
    this.app.use('/api/builder', createBuilderRoutes(this));

    // Enterprise routes
    if (this.ssoService) {
      this.app.use('/sso', createSSORoutes(this.ssoService));
    }
    if (this.rbacService) {
      this.app.use('/rbac', createRBACRoutes(this.rbacService));
    }
    if (this.complianceService) {
      this.app.use(
        '/compliance',
        createComplianceRoutes(this.complianceService)
      );
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

  private setupWebInterface(): void {
    // Serve your existing HTML files from web-builder directory
    // The web-builder files are in the source directory, not dist
    const webBuilderPath = path.join(__dirname, '..', 'src', 'web-builder');

    // Serve static files (JS, CSS, images) from web-builder directory
    this.app.use(express.static(webBuilderPath));

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

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  async start(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Initialize database first
        await this.databaseService.connect();
        // Initialize ecosystem services (non-blocking)
        try {
          await this.ecosystemService.initialize();
        } catch (error) {
          console.warn('⚠️ Some ecosystem services failed to start, but MockAuth will continue');
          console.log('💡 You can check the logs above for specific service issues');
        }

        this.server = this.app.listen(
          this.config.port,
          this.config.host || 'localhost',
          () => {
            console.log(
              `🚀 MockAuth server running on http://${this.config.host || 'localhost'}:${this.config.port}`
            );
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
            this.cleanupInterval = setInterval(
              async () => {
                try {
                  const cleaned =
                    await this.authService.cleanupExpiredSessions();
                  if (cleaned > 0) {
                    console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
                  }
                } catch (error) {
                  console.error('❌ Session cleanup failed:', error);
                }
              },
              5 * 60 * 1000
            ); // Every 5 minutes

            resolve();
          }
        );

        this.server.on('error', (error: any) => {
          if (error.code === 'EADDRINUSE') {
            reject(new Error(`Port ${this.config.port} is already in use`));
          } else {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
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
      } else {
        resolve();
      }
    });
  }

  // Public API methods
  getUserService(): UserService {
    return this.userService;
  }

  getAuthService(): AuthService {
    return this.authService;
  }

  getConfig(): MockAuthConfig {
    return { ...this.config };
  }

  getEcosystemService(): EcosystemService {
    return this.ecosystemService;
  }

  getDatabaseService(): DatabaseService {
    return this.databaseService;
  }

  async createUser(userData: {
    email: string;
    username: string;
    password: string;
    roles?: string[];
    permissions?: string[];
    profile?: any;
    metadata?: Record<string, any>;
  }): Promise<User> {
    return this.userService.createUser(userData);
  }

  async login(
    email: string,
    password: string
  ): Promise<{
    user: Omit<User, 'password'>;
    token: string;
    refreshToken: string;
    expiresIn: string;
  }> {
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

  async verifyToken(token: string): Promise<User | null> {
    return this.authService.verifyToken(token);
  }

  async getStats(): Promise<{
    users: any;
    sessions: any;
    health: any;
  }> {
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

  private async getHealthStatus(): Promise<{
    status: string;
    uptime: number;
    version: string;
    environment: string;
  }> {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env['NODE_ENV'] || 'development',
    };
  }

  private initializeUsersSync(): void {
    if (this.config.users && this.config.users.length > 0) {
      console.log(`📝 Initializing ${this.config.users.length} user(s)...`);
      let successCount = 0;
      let failCount = 0;

      for (const userData of this.config.users) {
        try {
          // Create user directly in the user service
          this.userService.createUserSync(userData);
          successCount++;
        } catch (error) {
          failCount++;
          console.error(
            `❌ Failed to initialize user ${userData.email}:`,
            error
          );
        }
      }

      console.log(`✅ Successfully initialized ${successCount} user(s)`);
      if (failCount > 0) {
        console.warn(`⚠️  Failed to initialize ${failCount} user(s)`);
      }
    }
  }
}

// Export types and classes
export * from './types';
export { UserService } from './services/UserService';
export { AuthService } from './services/AuthService';

// Default export
export default MockAuth;
