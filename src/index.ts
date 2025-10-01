import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { MockAuthConfig, User } from './types';
import { UserService } from './services/UserService';
import { AuthService } from './services/AuthService';
import { createAuthRoutes } from './routes/auth';
import { createUserRoutes } from './routes/users';
import { createRoleRoutes } from './routes/roles';
import { createHealthRoutes } from './routes/health';
import { createWebhookService } from './services/WebhookService';
import { createAuditService } from './services/AuditService';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// TypeScript service refresh comment

export class MockAuth {
  private app: express.Application;
  private server: any;
  private userService: UserService;
  private authService: AuthService;
  private webhookService: any;
  private auditService: any;
  private config: MockAuthConfig;

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
  }

  private setupRoutes(): void {
    // Health check
    this.app.use('/health', createHealthRoutes());

    // Authentication routes
    this.app.use('/auth', createAuthRoutes(this.authService, this.userService, this.webhookService, this.auditService));

    // User management routes
    this.app.use('/users', createUserRoutes(this.userService, this.authService, this.webhookService, this.auditService));

    // Role management routes
    this.app.use('/roles', createRoleRoutes(this.userService, this.authService, this.webhookService, this.auditService));

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

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, this.config.host || 'localhost', () => {
          console.log(`🚀 MockAuth server running on http://${this.config.host || 'localhost'}:${this.config.port}`);
          console.log(`📚 API Documentation: ${this.config.baseUrl}/api`);
          console.log(`❤️  Health Check: ${this.config.baseUrl}/health`);
          
          // Start cleanup interval for expired sessions
          setInterval(async () => {
            const cleaned = await this.authService.cleanupExpiredSessions();
            if (cleaned > 0) {
              console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
            }
          }, 5 * 60 * 1000); // Every 5 minutes

          resolve();
        });

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
    return new Promise((resolve) => {
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

  async login(email: string, password: string): Promise<{
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
      for (const userData of this.config.users) {
        try {
          // Create user directly in the user service
          this.userService.createUserSync(userData);
        } catch (error) {
          console.warn(`Failed to initialize user ${userData.email}:`, error);
        }
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
