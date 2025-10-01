export interface User {
  id: string;
  email: string;
  username: string;
  password?: string;
  roles: string[];
  permissions: string[];
  profile?: UserProfile;
  metadata?: Record<string, any>;
  mfa?: MFAConfig;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  isLocked: boolean;
  failedLoginAttempts: number;
  lockedUntil?: Date;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  phone?: string;
  address?: Address;
  preferences?: UserPreferences;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  timezone?: string;
  notifications?: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface Role {
  name: string;
  description: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  name: string;
  description: string;
  resource: string;
  action: string;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  device?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  device?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginResponse {
  success: boolean;
  user: Omit<User, 'password'>;
  token: string;
  refreshToken: string;
  expiresIn: string;
  sessionId: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  profile?: Partial<UserProfile>;
  roles?: string[];
  permissions?: string[];
}

export interface RegisterResponse {
  success: boolean;
  user: Omit<User, 'password'>;
  token: string;
  refreshToken: string;
  expiresIn: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  token: string;
  expiresIn: string;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  roles?: string[];
  permissions?: string[];
  profile?: Partial<UserProfile>;
  metadata?: Record<string, any>;
}

export interface UpdateUserRequest {
  username?: string;
  profile?: Partial<UserProfile>;
  roles?: string[];
  permissions?: string[];
  metadata?: Record<string, any>;
  isActive?: boolean;
  mfa?: MFAConfig;
  failedLoginAttempts?: number;
  isLocked?: boolean;
  lastLoginAt?: Date;
  lockedUntil?: Date;
}

export interface MockAuthConfig {
  port: number;
  baseUrl: string;
  host?: string;
  jwtSecret: string;
  tokenExpiry?: string;
  refreshTokenExpiry?: string;
  users?: Partial<User>[];
  roles?: Role[];
  permissions?: Permission[];
  enableMFA?: boolean;
  enablePasswordReset?: boolean;
  enableAccountLockout?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  enableAuditLog?: boolean;
  maxLoginAttempts?: number;
  lockoutDuration?: string;
  passwordPolicy?: PasswordPolicy;
  webhooks?: WebhookConfig;
  cors?: CorsConfig;
  rateLimit?: RateLimitConfig;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxLength?: number;
  forbiddenPasswords?: string[];
}

export interface WebhookConfig {
  url: string;
  secret: string;
  events: WebhookEvent[];
  timeout?: number;
  retries?: number;
}

export interface WebhookEvent {
  name: string;
  description: string;
}

export interface CorsConfig {
  origin: string | string[] | boolean;
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginatedResponse<T>['pagination'];
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: Record<string, any>;
  code?: string;
  timestamp: string;
}

export interface MFAConfig {
  enabled: boolean;
  secret?: string;
  backupCodes?: string[];
  createdAt?: Date;
  lastUsed?: Date;
}

export interface MFASetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface MFAVerifyRequest {
  code: string;
  backupCode?: string;
}

export interface MFAVerifyResponse {
  success: boolean;
  backupCodes?: string[];
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  token?: string;
}

export interface PasswordResetVerifyRequest {
  token: string;
}

export interface PasswordResetCompleteRequest {
  token: string;
  newPassword: string;
}

export interface PasswordResetCompleteResponse {
  success: boolean;
  message: string;
}

export interface AccountLockoutConfig {
  maxAttempts: number;
  lockoutDuration: number; // in milliseconds
  enableLockout: boolean;
}

export interface UnlockAccountRequest {
  userId: string;
  reason?: string;
}

export interface UnlockAccountResponse {
  success: boolean;
  message: string;
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: 'connected' | 'disconnected';
    jwt: 'valid' | 'invalid';
    rateLimit: 'active' | 'inactive';
  };
}
