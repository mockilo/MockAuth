# MockAuth Technical Specifications

This document provides detailed technical specifications for MockAuth, including architecture, API design, security considerations, and performance characteristics.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [API Specifications](#api-specifications)
- [Data Models](#data-models)
- [Security Implementation](#security-implementation)
- [Performance Characteristics](#performance-characteristics)
- [Deployment Requirements](#deployment-requirements)
- [Monitoring and Observability](#monitoring-and-observability)

## Architecture Overview

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   MockAuth      │    │   External      │
│   (Frontend)    │◄──►│   Server        │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Data Layer    │
                       │   (In-Memory)   │
                       └─────────────────┘
```

### Core Services

1. **Authentication Service** - Handles login, logout, token management
2. **User Service** - Manages user CRUD operations and permissions
3. **Session Service** - Tracks active sessions and tokens
4. **Webhook Service** - Sends event notifications
5. **Audit Service** - Logs security events and actions

### Technology Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Joi + express-validator
- **Logging**: Winston
- **Rate Limiting**: express-rate-limit
- **Security**: Helmet, CORS

## API Specifications

### Base URL Structure

```
http://localhost:3001
├── /health          # Health check endpoints
├── /auth            # Authentication endpoints
├── /users           # User management endpoints
├── /roles           # Role and permission management
└── /api             # API documentation
```

### Authentication Flow

1. **Login Request**
   ```
   POST /auth/login
   Content-Type: application/json
   
   {
     "email": "user@example.com",
     "password": "password123",
     "rememberMe": false,
     "device": "Chrome on Windows",
     "ipAddress": "192.168.1.100",
     "userAgent": "Mozilla/5.0..."
   }
   ```

2. **Login Response**
   ```
   HTTP/1.1 200 OK
   Content-Type: application/json
   
   {
     "success": true,
     "data": {
       "user": {
         "id": "user-1",
         "email": "user@example.com",
         "username": "john_doe",
         "roles": ["user"],
         "permissions": ["read:profile"],
         "profile": {
           "firstName": "John",
           "lastName": "Doe"
         }
       },
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "refreshToken": "refresh_token_here",
       "expiresIn": "24h",
       "sessionId": "session-1"
     }
   }
   ```

### JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "user-1",
    "email": "user@example.com",
    "username": "john_doe",
    "roles": ["user"],
    "permissions": ["read:profile"],
    "sessionId": "session-1",
    "iat": 1640995200,
    "exp": 1641081600
  },
  "signature": "signature_here"
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Data Models

### User Model

```typescript
interface User {
  id: string;                    // UUID v4
  email: string;                 // Unique, validated email
  username: string;              // Unique, 3-30 characters
  password?: string;             // bcrypt hashed, optional in responses
  roles: string[];               // Array of role names
  permissions: string[];         // Array of permission names
  profile?: UserProfile;         // Optional profile data
  metadata?: Record<string, any>; // Custom metadata
  createdAt: Date;              // ISO 8601 timestamp
  updatedAt: Date;              // ISO 8601 timestamp
  lastLoginAt?: Date;           // ISO 8601 timestamp
  isActive: boolean;            // Account status
  isLocked: boolean;            // Lockout status
  failedLoginAttempts: number;  // Failed login counter
  lockedUntil?: Date;           // Lockout expiration
}
```

### Session Model

```typescript
interface Session {
  id: string;                   // UUID v4
  userId: string;               // Reference to user
  token: string;                // JWT token
  refreshToken: string;         // Refresh token
  device?: string;              // Device information
  ipAddress?: string;           // Client IP address
  userAgent?: string;           // Browser user agent
  createdAt: Date;              // Session creation time
  lastActivityAt: Date;         // Last activity time
  expiresAt: Date;              // Session expiration
  isActive: boolean;            // Session status
}
```

### Role Model

```typescript
interface Role {
  name: string;                 // Role identifier
  description: string;          // Human-readable description
  permissions: string[];        // Array of permission names
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Last update timestamp
}
```

### Permission Model

```typescript
interface Permission {
  name: string;                 // Permission identifier
  description: string;          // Human-readable description
  resource: string;             // Resource being accessed
  action: string;               // Action being performed
  createdAt: Date;              // Creation timestamp
}
```

## Security Implementation

### Password Security

- **Hashing Algorithm**: bcrypt with salt rounds of 10
- **Minimum Length**: 8 characters (configurable)
- **Complexity Requirements**: Configurable (uppercase, numbers, special chars)
- **Password History**: Not implemented (can be added)
- **Password Expiry**: Not implemented (can be added)

### Account Lockout

- **Max Attempts**: 5 failed login attempts (configurable)
- **Lockout Duration**: 15 minutes (configurable)
- **Reset Conditions**: Successful login or manual unlock
- **IP-based Lockout**: Not implemented (can be added)

### Token Security

- **JWT Algorithm**: HS256 (HMAC with SHA-256)
- **Token Expiry**: 24 hours (configurable)
- **Refresh Token Expiry**: 7 days (configurable)
- **Token Rotation**: Not implemented (can be added)
- **Token Revocation**: Session-based revocation

### Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 1000 per IP
- **Headers**: Standard rate limit headers included
- **Bypass**: Not implemented (can be added for trusted IPs)

### CORS Configuration

```javascript
{
  origin: true,                    // Allow all origins in dev
  credentials: true,               // Allow credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

### Security Headers

- **Helmet.js**: Security headers middleware
- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: 1; mode=block
- **Strict-Transport-Security**: Not implemented (HTTPS only)

## Performance Characteristics

### Memory Usage

- **Base Memory**: ~50MB (Node.js + Express)
- **Per User**: ~1KB (user object + session)
- **Per Session**: ~500 bytes (session metadata)
- **Max Users**: ~10,000 (50MB limit)
- **Max Sessions**: ~20,000 (10MB limit)

### Response Times

- **Login**: < 100ms (typical)
- **Token Verification**: < 10ms (typical)
- **User Lookup**: < 5ms (typical)
- **Session Creation**: < 20ms (typical)

### Throughput

- **Requests/Second**: ~1,000 (single instance)
- **Concurrent Users**: ~500 (active sessions)
- **Database Operations**: In-memory (very fast)

### Scalability Considerations

- **Horizontal Scaling**: Not supported (in-memory storage)
- **Persistence**: Not implemented (can be added)
- **Clustering**: Not implemented (can be added)
- **Load Balancing**: Supported (stateless design)

## Deployment Requirements

### System Requirements

- **Node.js**: 16.0.0 or higher
- **Memory**: 512MB minimum, 1GB recommended
- **CPU**: 1 core minimum, 2 cores recommended
- **Disk**: 100MB for application files
- **Network**: HTTP/HTTPS access

### Environment Variables

```bash
# Required
NODE_ENV=development|production
MOCKAUTH_PORT=3001
MOCKAUTH_JWT_SECRET=your-secret-key

# Optional
MOCKAUTH_HOST=localhost
MOCKAUTH_BASE_URL=http://localhost:3001
MOCKAUTH_TOKEN_EXPIRY=24h
MOCKAUTH_REFRESH_EXPIRY=7d
MOCKAUTH_LOG_LEVEL=info
MOCKAUTH_ENABLE_AUDIT=true
MOCKAUTH_WEBHOOK_URL=https://your-app.com/webhooks
MOCKAUTH_WEBHOOK_SECRET=webhook-secret
```

### Docker Configuration

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  mockauth:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MOCKAUTH_JWT_SECRET=your-secret-key
    restart: unless-stopped
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mockauth
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mockauth
  template:
    metadata:
      labels:
        app: mockauth
    spec:
      containers:
      - name: mockauth
        image: mockauth:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: MOCKAUTH_JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: mockauth-secrets
              key: jwt-secret
---
apiVersion: v1
kind: Service
metadata:
  name: mockauth-service
spec:
  selector:
    app: mockauth
  ports:
  - port: 3001
    targetPort: 3001
  type: ClusterIP
```

## Monitoring and Observability

### Health Check Endpoints

- **Basic Health**: `GET /health`
- **Detailed Health**: `GET /health/detailed`
- **Readiness**: `GET /health/ready`
- **Liveness**: `GET /health/live`

### Metrics Available

- **Request Count**: Total API requests
- **Response Time**: Average response time
- **Error Rate**: Percentage of failed requests
- **Active Users**: Currently logged in users
- **Active Sessions**: Currently active sessions
- **Memory Usage**: Process memory consumption
- **CPU Usage**: Process CPU consumption

### Logging

- **Format**: JSON structured logging
- **Levels**: debug, info, warn, error
- **Fields**: timestamp, level, message, context
- **Audit Logs**: Security events and user actions
- **Request Logs**: HTTP request/response logging

### Example Log Entry

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "message": "User login successful",
  "context": {
    "userId": "user-1",
    "email": "user@example.com",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "sessionId": "session-1"
  }
}
```

### Alerting Recommendations

- **High Error Rate**: > 5% error rate for 5 minutes
- **High Response Time**: > 1 second average for 5 minutes
- **Memory Usage**: > 80% of available memory
- **Failed Logins**: > 100 failed logins per minute
- **Service Down**: Health check failures

### Integration with Monitoring Tools

- **Prometheus**: Custom metrics endpoint
- **Grafana**: Dashboard templates available
- **ELK Stack**: Log forwarding configuration
- **DataDog**: Custom metrics and logs
- **New Relic**: APM integration

## API Rate Limits

### Default Limits

- **Login Attempts**: 5 per 15 minutes per IP
- **API Requests**: 1000 per 15 minutes per IP
- **Registration**: 10 per hour per IP
- **Password Reset**: 5 per hour per user

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 900
```

## Webhook Events

### Available Events

- `user.created` - New user registered
- `user.updated` - User profile updated
- `user.deleted` - User account deleted
- `user.login` - User logged in
- `user.logout` - User logged out
- `session.created` - New session created
- `session.revoked` - Session revoked
- `role.created` - New role created
- `role.updated` - Role updated
- `role.deleted` - Role deleted

### Webhook Payload Format

```json
{
  "event": "user.login",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "user": {
      "id": "user-1",
      "email": "user@example.com",
      "username": "john_doe"
    },
    "session": {
      "id": "session-1",
      "device": "Chrome on Windows",
      "ipAddress": "192.168.1.100"
    }
  }
}
```

## Configuration Reference

### Complete Configuration Object

```typescript
interface MockAuthConfig {
  // Server Configuration
  port: number;                    // Server port (required)
  baseUrl: string;                 // Base URL for API calls (required)
  host?: string;                   // Host to bind to (default: localhost)
  
  // Authentication
  jwtSecret: string;               // JWT signing secret (required)
  tokenExpiry?: string;            // Token expiry time (default: 24h)
  refreshTokenExpiry?: string;     // Refresh token expiry (default: 7d)
  
  // Initial Data
  users?: Partial<User>[];         // Initial users
  roles?: Role[];                  // Available roles
  permissions?: Permission[];      // Available permissions
  
  // Features
  enableMFA?: boolean;             // Enable MFA simulation (default: false)
  enablePasswordReset?: boolean;   // Enable password reset (default: true)
  enableAccountLockout?: boolean;  // Enable account lockout (default: true)
  
  // Logging
  logLevel?: 'debug' | 'info' | 'warn' | 'error'; // Log level (default: info)
  enableAuditLog?: boolean;        // Enable audit logging (default: true)
  
  // Security
  maxLoginAttempts?: number;       // Max failed attempts (default: 5)
  lockoutDuration?: string;        // Lockout duration (default: 15m)
  passwordPolicy?: PasswordPolicy; // Password requirements
  
  // Webhooks
  webhooks?: WebhookConfig;        // Webhook configuration
  
  // CORS
  cors?: CorsConfig;               // CORS configuration
  
  // Rate Limiting
  rateLimit?: RateLimitConfig;     // Rate limiting configuration
}
```

This technical specification provides a comprehensive overview of MockAuth's architecture, implementation details, and operational characteristics. It serves as a reference for developers, system administrators, and security teams working with MockAuth.
