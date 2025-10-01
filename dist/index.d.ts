import { MockAuthConfig, User } from './types';
import { UserService } from './services/UserService';
import { AuthService } from './services/AuthService';
export declare class MockAuth {
    private app;
    private server;
    private userService;
    private authService;
    private webhookService;
    private auditService;
    private config;
    constructor(config: MockAuthConfig);
    private validateConfig;
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    start(): Promise<void>;
    stop(): Promise<void>;
    getUserService(): UserService;
    getAuthService(): AuthService;
    getConfig(): MockAuthConfig;
    createUser(userData: {
        email: string;
        username: string;
        password: string;
        roles?: string[];
        permissions?: string[];
        profile?: any;
        metadata?: Record<string, any>;
    }): Promise<User>;
    login(email: string, password: string): Promise<{
        user: Omit<User, 'password'>;
        token: string;
        refreshToken: string;
        expiresIn: string;
    }>;
    verifyToken(token: string): Promise<User | null>;
    getStats(): Promise<{
        users: any;
        sessions: any;
        health: any;
    }>;
    private getHealthStatus;
    private initializeUsersSync;
}
export * from './types';
export { UserService } from './services/UserService';
export { AuthService } from './services/AuthService';
export default MockAuth;
//# sourceMappingURL=index.d.ts.map