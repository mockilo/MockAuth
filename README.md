# MockAuth 🎭

> **Developer-first authentication simulator for dev, testing, and staging environments**

[![npm version](https://badge.fury.io/js/mockauth.svg)](https://badge.fury.io/js/mockauth)
[![npm downloads](https://img.shields.io/npm/dm/mockauth.svg)](https://www.npmjs.com/package/mockauth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/mockilo/mockauth)
[![Security](https://img.shields.io/badge/security-audited-blue.svg)](https://github.com/mockilo/mockauth/security)

MockAuth is a comprehensive authentication simulation platform designed for developers who need to test authentication flows without setting up complex auth systems. It provides a complete mock authentication service with enterprise-grade features, visual configuration tools, and seamless integration with popular frameworks.

## ✨ Features

### 🔗 **Framework Integrations** ⭐ **NEW!**
- **React Integration** - Complete TypeScript setup with Context API and modern UI
- **Vue.js Integration** - Vue 3 Composition API with authentication composables
- **Angular Support** - Framework guidance and setup instructions
- **Next.js & Nuxt.js** - SSR framework integration support
- **Svelte & SvelteKit** - Modern compile-time framework support
- **Solid.js** - Reactive library integration
- **One-Click Setup** - Generate complete projects with authentication in seconds
- **Production-Ready Code** - Beautiful UI, TypeScript, and best practices included

### 🔐 **Core Authentication**
- **JWT Token Management** - Secure token generation, validation, and refresh
- **User Registration & Login** - Complete user lifecycle management
- **Password Reset** - Email-based password recovery (mocked)
- **Account Lockout** - Configurable failed login attempt protection
- **Session Management** - Persistent and secure session handling

### 🛡️ **Security Features**
- **Multi-Factor Authentication (MFA)** - TOTP and backup codes support
- **Role-Based Access Control (RBAC)** - Hierarchical roles and permissions
- **Rate Limiting** - Configurable request throttling
- **Security Headers** - Helmet.js integration for enhanced security
- **Audit Logging** - Comprehensive activity tracking

### 🏢 **Enterprise Features**
- **Single Sign-On (SSO)** - OAuth2, SAML, OpenID Connect support
- **Advanced RBAC** - Resource ownership and policy engine
- **Compliance Monitoring** - GDPR, HIPAA, SOX, PCI-DSS tracking
- **Database Integration** - PostgreSQL, MySQL, SQLite support
- **Performance Monitoring** - Built-in metrics and health checks

### 🎨 **Developer Experience** 🚀
- **Visual Builder** - Web-based configuration interface
- **CLI Tool** - 12+ commands for project management
- **Framework Integrations** - React, Vue, Angular components
- **TypeScript Support** - Full type definitions included
- **Testing Utilities** - Jest, Cypress, Playwright integration
- **Hot Reload** - See changes instantly without restarting
- **Smart Debugging** - Real-time request/response inspection
- **Auto-completion** - Intelligent CLI with suggestions
- **Migration Tools** - Easy transition to production auth providers

### 🌐 **Ecosystem Integration** (Built-In!)
- **MockTail** - Schema-aware mock data generation for any database schema (built-in, no external deps!)
- **SchemaGhost** - Dynamic mock API server with intelligent endpoint generation (built-in, no external deps!)
- **Database Adapters** - Multi-database support with connection pooling
- **Migration System** - Automatic schema management
- **Smart Data Generation** - Context-aware mock data based on your actual schema
- **API Simulation** - Realistic API responses with configurable delays and error rates

> **Note:** MockTail and SchemaGhost are built directly into MockAuth. No external packages needed!

## 🔒 Security

MockAuth is built with security best practices and is safe to use for development and testing.

### ⚠️ Important: npm audit warnings are SAFE to ignore

When you install MockAuth, you may see security warnings. **These are false positives and completely safe to ignore**:

#### 🛡️ Why the warnings are safe:
- ✅ **MockAuth never uses the vulnerable functions**
- ✅ **Only safe validation functions are used** (`isEmail()`, `isLength()`)
- ✅ **No URL validation** - eliminates the vulnerability vector
- ✅ **All inputs are properly sanitized**
- ✅ **Follows security best practices**

#### 📋 Quick verification:
```bash
# Search for vulnerable function (you won't find it)
grep -r "isURL" node_modules/@mockilo/mockauth/
# Result: No matches found ✅
```

#### 🚀 Safe installation:
```bash
# This is completely safe despite warnings
npm install @mockilo/mockauth
# or
npx @mockilo/mockauth
```

#### 📦 About deprecated package warnings:
- These are **development dependencies only** (testing, building)
- They **don't affect runtime security** or functionality
- They're used for build processes, not in your application
- **Completely safe to ignore**

**For complete security analysis, see [SECURITY.md](SECURITY.md)**

> **💡 Pro tip**: Use `npx @mockilo/mockauth` to avoid local installation warnings entirely!

## 🚀 Quick Start

### Installation

```bash
npm install mockauth
# or
yarn add mockauth
# or
pnpm add mockauth
```

### 🔗 Framework Integrations (NEW!)

Generate complete projects with your favorite framework:

```bash
# Interactive CLI with Framework Integrations
npx mockauth

# Or use the CLI directly
npx mockauth --help
```

**Supported Frameworks:**
- ⚛️ **React** - TypeScript + Context API + Modern UI
- 🟢 **Vue.js** - Vue 3 + Composition API + TypeScript  
- 🅰️ **Angular** - Framework guidance and setup
- 🚀 **Next.js** - SSR framework integration
- 💚 **Nuxt.js** - Vue SSR framework
- 🧡 **Svelte** - Modern compile-time framework
- ⚡ **SvelteKit** - Svelte framework
- 🔵 **Solid.js** - Reactive library

### Basic Usage

```javascript
const { MockAuth } = require('mockauth');

const config = {
  port: 3001,
  jwtSecret: 'your-secret-key',
  users: [
    {
      email: 'admin@example.com',
      password: 'admin123',
      roles: ['admin'],
      permissions: ['read:users', 'write:users']
    }
  ]
};

async function startMockAuth() {
  const auth = new MockAuth(config);
  await auth.start();
  console.log('🎉 MockAuth is running!');
}

startMockAuth().catch(console.error);
```

### Using the Visual Builder

```bash
# Start the visual configuration tool
npm run builder
# or
npx mockauth builder
```

Open your browser to `http://localhost:3001` and configure MockAuth with the intuitive web interface.

## 🔄 **Easy Migration Path**

MockAuth is designed for seamless migration to production authentication providers:

```javascript
// Development
import MockAuth from 'mockauth'

// Later, in production:
import RealAuth from 'better-auth' // or clerk

// Same API! Easy migration.
```

**Supported Providers:**
- **Better-Auth** - Open-source authentication library
- **Clerk** - Modern authentication platform
- **Auth0** - Enterprise identity platform
- **Firebase Auth** - Google's authentication service
- **Supabase Auth** - Open-source backend platform

**Migration Tools:**
```bash
# Generate migration files
npx mockauth migrate-to better-auth --output ./src/auth/better-auth.js
npx mockauth migrate-to clerk --output ./src/auth/clerk.js
npx mockauth migrate-to auth0 --output ./src/auth/auth0.js
npx mockauth migrate-to firebase --output ./src/auth/firebase.js
npx mockauth migrate-to supabase --output ./src/auth/supabase.js

# Test migration compatibility
npx mockauth test-migration --from mockauth --to better-auth
npx mockauth test-migration --from mockauth --to clerk
npx mockauth test-migration --from mockauth --to auth0

# Convert configuration
npx mockauth convert-config --from mockauth --to better-auth config.json
npx mockauth convert-config --from mockauth --to clerk config.json
npx mockauth convert-config --from mockauth --to auth0 config.json

# Validate migration readiness
npx mockauth validate-migration --provider better-auth
npx mockauth validate-migration --provider clerk
npx mockauth validate-migration --provider auth0

# Generate migration report
npx mockauth migration-report --from mockauth --to better-auth --output ./migration-report.html
```

### 🔄 **Migration Examples**

#### Better-Auth Migration
```bash
# Generate Better-Auth migration
npx mockauth migrate-to better-auth --output ./src/auth/better-auth.js

# Generated file example:
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"

export const auth = betterAuth({
  database: prismaAdapter({
    prisma: prisma,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
})
```

#### Clerk Migration
```bash
# Generate Clerk migration
npx mockauth migrate-to clerk --output ./src/auth/clerk.js

# Generated file example:
import { ClerkProvider, useAuth } from '@clerk/nextjs'

export function AuthProvider({ children }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      {children}
    </ClerkProvider>
  )
}

export { useAuth }
```

#### Auth0 Migration
```bash
# Generate Auth0 migration
npx mockauth migrate-to auth0 --output ./src/auth/auth0.js

# Generated file example:
import { initAuth0 } from '@auth0/nextjs-auth0'

export default initAuth0({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
})
```

#### Firebase Migration
```bash
# Generate Firebase migration
npx mockauth migrate-to firebase --output ./src/auth/firebase.js

# Generated file example:
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
```

#### Supabase Migration
```bash
# Generate Supabase migration
npx mockauth migrate-to supabase --output ./src/auth/supabase.js

# Generated file example:
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## 📚 Documentation

### 🚀 **Enhanced Developer Experience**
- **[Developer Experience Guide](docs/developer-experience.md)** - Complete DX features and tools
- **[Migration Guide](docs/migration-guide.md)** - Seamless transition to production auth providers
- **[Getting Started](docs/getting-started.md)** - Quick start guide
- **[API Reference](docs/api-reference.md)** - Complete API documentation

### Configuration Options

```typescript
interface MockAuthConfig {
  // Basic Configuration
  port?: number;
  baseUrl?: string;
  jwtSecret?: string;
  tokenExpiry?: string;
  refreshTokenExpiry?: string;
  
  // Security Features
  enableMFA?: boolean;
  enablePasswordReset?: boolean;
  enableAccountLockout?: boolean;
  maxLoginAttempts?: number;
  lockoutDuration?: number;
  
  // Database Configuration
  database?: DatabaseConfig;
  
  // Ecosystem Integration
  ecosystem?: {
    mocktail?: {
      enabled: boolean;
      port?: number;
      schemaPath?: string;
      dataPath?: string;
    };
    schemaghost?: {
      enabled: boolean;
      port?: number;
      endpoints?: any[];
      delay?: number;
      errorRate?: number;
    };
  };
  
  // Enterprise Features
  sso?: SSOConfig;
  rbac?: RBACConfig;
  compliance?: ComplianceConfig;
  webhooks?: WebhookConfig;
  audit?: AuditConfig;
  
  // Users
  users?: User[];
}

interface DatabaseConfig {
  type: 'memory' | 'sqlite' | 'postgresql' | 'mysql';
  connectionString?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
}

interface SSOConfig {
  enableSSO: boolean;
  providers: SSOProvider[];
}

interface SSOProvider {
  name: string;
  type: 'oauth2' | 'saml' | 'oidc';
  clientId: string;
  clientSecret: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
}

interface RBACConfig {
  enableHierarchicalRoles: boolean;
  enableResourceOwnership: boolean;
  enablePolicyEngine: boolean;
  defaultRoles?: string[];
  defaultPermissions?: string[];
}

interface ComplianceConfig {
  enableAuditLogging: boolean;
  complianceStandards: ('GDPR' | 'HIPAA' | 'SOX' | 'PCI-DSS')[];
  retentionPeriod?: number;
  encryptionRequired?: boolean;
}

interface WebhookConfig {
  enabled: boolean;
  endpoints: WebhookEndpoint[];
}

interface WebhookEndpoint {
  url: string;
  events: string[];
  secret?: string;
  retryAttempts?: number;
}

interface AuditConfig {
  enabled: boolean;
  logLevel: 'info' | 'warn' | 'error';
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
}
```

### API Endpoints

#### 🔐 Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | User registration |
| POST | `/auth/login` | User login |
| POST | `/auth/refresh` | Token refresh |
| POST | `/auth/logout` | User logout |
| GET | `/auth/me` | Get current user |
| POST | `/auth/verify` | Verify token |
| GET | `/auth/sessions` | Get user sessions |
| DELETE | `/auth/sessions/:sessionId` | Revoke session |
| POST | `/auth/forgot-password` | Password reset request |
| POST | `/auth/reset-password` | Password reset confirmation |

#### 🔒 Multi-Factor Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/mfa/setup` | Setup MFA for user |
| POST | `/auth/mfa/verify` | Verify MFA code |
| GET | `/auth/mfa/status` | Get MFA status |
| DELETE | `/auth/mfa/disable` | Disable MFA |
| POST | `/auth/mfa/backup-codes/regenerate` | Regenerate backup codes |

#### 👥 User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users |
| GET | `/users/:id` | Get user by ID |
| POST | `/users` | Create user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |
| GET | `/users/stats/overview` | User statistics |

#### 🛡️ Role-Based Access Control
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/roles` | List all roles |
| GET | `/roles/:name` | Get role details |
| POST | `/roles` | Create role |
| PUT | `/roles/:name` | Update role |
| DELETE | `/roles/:name` | Delete role |
| GET | `/roles/permissions/list` | List permissions |
| POST | `/roles/permissions/assign` | Assign permissions |

#### 🔐 Advanced RBAC
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/rbac/check` | Check user permissions |
| POST | `/rbac/permissions` | Manage permissions |
| POST | `/rbac/roles` | Manage roles |
| POST | `/rbac/policies` | Manage policies |
| POST | `/rbac/resources` | Manage resources |

#### 🌐 Single Sign-On (SSO)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sso/providers` | Get available SSO providers |
| GET | `/sso/login/:provider` | Initiate SSO login |
| POST | `/sso/callback/:provider` | Handle SSO callback |
| POST | `/sso/validate` | Validate SSO token |
| POST | `/sso/cleanup` | Cleanup SSO sessions |

#### 📊 System & Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/detailed` | Detailed health status |
| GET | `/health/ready` | Readiness probe |
| GET | `/health/live` | Liveness probe |
| GET | `/metrics` | Performance metrics |

#### 🏢 Compliance & Auditing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/compliance/audit` | Create audit log |
| GET | `/compliance/violations` | Get compliance violations |
| POST | `/compliance/checks` | Run compliance checks |
| GET | `/compliance/audit` | Get audit logs |
| POST | `/compliance/reports` | Generate compliance reports |
| POST | `/compliance/rules` | Manage compliance rules |

#### 🛠️ Builder & Configuration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/builder/stats` | Builder statistics |
| POST | `/builder/config/save` | Save configuration |
| GET | `/builder/config/load` | Load configuration |
| POST | `/builder/users/bulk` | Bulk create users |
| GET | `/builder/users` | Get builder users |
| GET | `/builder/test` | Test builder connectivity |

### Framework Integrations

#### React

```jsx
import { MockAuthProvider, useMockAuth } from 'mockauth/react';

function App() {
  return (
    <MockAuthProvider config={config}>
      <LoginForm />
    </MockAuthProvider>
  );
}

function LoginForm() {
  const { login, user, isAuthenticated } = useMockAuth();
  
  if (isAuthenticated) {
    return <div>Welcome, {user.email}!</div>;
  }
  
  return <button onClick={() => login('user@example.com', 'password')}>
    Login
  </button>;
}
```

#### Vue

```vue
<template>
  <div v-if="isAuthenticated">
    Welcome, {{ user.email }}!
  </div>
  <button v-else @click="handleLogin">
    Login
  </button>
</template>

<script setup>
import { useMockAuth } from 'mockauth/vue';

const { login, user, isAuthenticated } = useMockAuth();

const handleLogin = () => {
  login('user@example.com', 'password');
};
</script>
```

#### Angular

```typescript
import { MockAuthService } from 'mockauth/angular';

@Component({
  selector: 'app-login',
  template: `
    <div *ngIf="authService.isAuthenticated$ | async">
      Welcome, {{ (authService.user$ | async)?.email }}!
    </div>
    <button *ngIf="!(authService.isAuthenticated$ | async)" 
            (click)="login()">
      Login
    </button>
  `
})
export class LoginComponent {
  constructor(public authService: MockAuthService) {}
  
  login() {
    this.authService.login('user@example.com', 'password').subscribe();
  }
}
```

## 🛠️ CLI Commands

### 🚀 **Core Commands**
```bash
# Initialize a new MockAuth project
npx mockauth init

# Start MockAuth server
npx mockauth start

# Stop MockAuth server
npx mockauth stop

# Restart MockAuth server
npx mockauth restart

# Reset server data and restart
npx mockauth reset

# Check server status and health
npx mockauth status

# List all running MockAuth servers
npx mockauth list

# Stop all running MockAuth servers
npx mockauth kill-all
```

### 🧪 **Testing & Development**
```bash
# Run MockAuth tests
npx mockauth test

# Generate mock data
npx mockauth generate

# Database migrations
npx mockauth migrate

# Launch visual configuration builder
npx mockauth builder

# Start with debug console
npx mockauth debug

# Run health checks and diagnostics
npx mockauth health
```

### 🔄 **Migration & Deployment**
```bash
# Generate migration files for production providers
npx mockauth migrate-to better-auth --output ./src/auth/better-auth.js
npx mockauth migrate-to clerk --output ./src/auth/clerk.js
npx mockauth migrate-to auth0 --output ./src/auth/auth0.js

# Test migration compatibility
npx mockauth test-migration --from mockauth --to better-auth

# Convert configuration
npx mockauth convert-config --from mockauth --to better-auth config.json
```

### 🏢 **Enterprise Commands**
```bash
# Deploy to cloud platforms (AWS, GCP, Azure)
npx mockauth deploy

# Start real-time monitoring dashboard
npx mockauth monitor

# Backup database and configuration
npx mockauth backup

# Restore from backup
npx mockauth restore

# Validate configuration and dependencies
npx mockauth validate

# Run performance benchmarks
npx mockauth benchmark

# Generate API documentation
npx mockauth docs

# Plugin management
npx mockauth plugin install <plugin-name>
```

### 🎯 **Advanced Options**
```bash
# Initialize with specific template
npx mockauth init --template enterprise

# Start with custom port
npx mockauth start --port 3002

# Start with watch mode
npx mockauth start --watch

# Start with verbose logging
npx mockauth start --verbose

# Start with specific environment
npx mockauth start --env production

# Use specific configuration profile
npx mockauth start --profile aws
```

## 🏗️ Architecture

```
MockAuth/
├── src/
│   ├── index.ts              # Main entry point
│   ├── services/             # Core services
│   │   ├── AuthService.ts    # Authentication logic
│   │   ├── MFAService.ts     # Multi-factor auth
│   │   ├── DatabaseService.ts # Database abstraction
│   │   └── ...
│   ├── routes/               # API routes
│   ├── middleware/           # Express middleware
│   ├── cli/                  # CLI commands
│   ├── web-builder/          # Visual configuration tool
│   └── components/           # Framework integrations
├── examples/                 # Usage examples
├── docs/                     # Documentation
└── tests/                    # Test suites
```

## 🧪 Testing

MockAuth includes comprehensive testing utilities:

```javascript
// Jest integration
import { createMockAuth } from 'mockauth/testing';

describe('Authentication Flow', () => {
  let mockAuth;
  
  beforeEach(async () => {
    mockAuth = await createMockAuth({
      users: [{ email: 'test@example.com', password: 'test123' }]
    });
  });
  
  afterEach(async () => {
    await mockAuth.stop();
  });
  
  test('should authenticate user', async () => {
    const response = await mockAuth.login('test@example.com', 'test123');
    expect(response.success).toBe(true);
    expect(response.token).toBeDefined();
  });
});
```

## 🔧 Configuration Examples

### Basic Setup

```javascript
const config = {
  port: 3001,
  jwtSecret: 'your-secret-key',
  users: [
    {
      email: 'admin@example.com',
      password: 'admin123',
      roles: ['admin'],
      permissions: ['read:users', 'write:users', 'delete:users']
    },
    {
      email: 'user@example.com',
      password: 'user123',
      roles: ['user'],
      permissions: ['read:profile']
    }
  ]
};
```

### Enterprise Setup

```javascript
const config = {
  port: 3001,
  jwtSecret: 'enterprise-secret-key',
  enableMFA: true,
  enableAccountLockout: true,
  maxLoginAttempts: 5,
  database: {
    type: 'postgresql',
    connectionString: 'postgresql://user:pass@localhost:5432/mockauth'
  },
  sso: {
    enableSSO: true,
    providers: [
      {
        name: 'google',
        type: 'oauth2',
        clientId: 'your-google-client-id',
        clientSecret: 'your-google-client-secret'
      }
    ]
  },
  rbac: {
    enableHierarchicalRoles: true,
    enableResourceOwnership: true,
    enablePolicyEngine: true
  },
  compliance: {
    enableAuditLogging: true,
    complianceStandards: ['GDPR', 'HIPAA', 'SOX']
  }
};
```

### Ecosystem Integration Setup

```javascript
const config = {
  port: 3001,
  jwtSecret: 'your-secret-key',
  
  // Enable MockTail for smart mock data generation
  ecosystem: {
    mocktail: {
      enabled: true,
      port: 3002,
      schemaPath: './prisma/schema.prisma', // or your schema file
      dataPath: './mock-data'
    },
    
    // Enable SchemaGhost for dynamic API simulation
    schemaghost: {
      enabled: true,
      port: 3003,
      endpoints: [
        { path: '/api/posts', method: 'GET', response: 'posts' },
        { path: '/api/users', method: 'GET', response: 'users' }
      ],
      delay: 100, // Simulate network delay
      errorRate: 0.05 // 5% error rate for realistic testing
    }
  },
  
  database: {
    type: 'postgresql',
    connectionString: 'postgresql://user:pass@localhost:5432/mockauth'
  }
};
```

### Advanced Enterprise Setup

```javascript
const config = {
  port: 3001,
  jwtSecret: 'enterprise-secret-key',
  tokenExpiry: '1h',
  refreshTokenExpiry: '7d',
  
  // Security Configuration
  enableMFA: true,
  enablePasswordReset: true,
  enableAccountLockout: true,
  maxLoginAttempts: 5,
  lockoutDuration: 300000, // 5 minutes
  
  // Database Configuration
  database: {
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    username: 'mockauth',
    password: 'secure-password',
    database: 'mockauth_prod',
    ssl: true
  },
  
  // Ecosystem Integration
  ecosystem: {
    mocktail: {
      enabled: true,
      port: 3002,
      schemaPath: './schema.sql'
    },
    schemaghost: {
      enabled: true,
      port: 3003,
      delay: 50,
      errorRate: 0.02
    }
  },
  
  // SSO Configuration
  sso: {
    enableSSO: true,
    providers: [
      {
        name: 'google',
        type: 'oauth2',
        clientId: 'your-google-client-id',
        clientSecret: 'your-google-client-secret',
        authorizationUrl: 'https://accounts.google.com/oauth/authorize',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
      },
      {
        name: 'microsoft',
        type: 'oauth2',
        clientId: 'your-microsoft-client-id',
        clientSecret: 'your-microsoft-client-secret'
      }
    ]
  },
  
  // Advanced RBAC
  rbac: {
    enableHierarchicalRoles: true,
    enableResourceOwnership: true,
    enablePolicyEngine: true,
    defaultRoles: ['user', 'admin', 'super-admin'],
    defaultPermissions: ['read:profile', 'write:profile']
  },
  
  // Compliance & Auditing
  compliance: {
    enableAuditLogging: true,
    complianceStandards: ['GDPR', 'HIPAA', 'SOX', 'PCI-DSS'],
    retentionPeriod: 2555, // 7 years in days
    encryptionRequired: true
  },
  
  // Webhook Configuration
  webhooks: {
    enabled: true,
    endpoints: [
      {
        url: 'https://your-app.com/webhooks/auth',
        events: ['user.created', 'user.updated', 'user.deleted'],
        secret: 'webhook-secret',
        retryAttempts: 3
      }
    ]
  },
  
  // Audit Configuration
  audit: {
    enabled: true,
    logLevel: 'info',
    includeRequestBody: false,
    includeResponseBody: false
  },
  
  // Initial Users
  users: [
    {
      email: 'admin@company.com',
      password: 'secure-admin-password',
      roles: ['super-admin'],
      permissions: ['*:*']
    }
  ]
};
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/mockilo/mockauth.git
cd mockauth

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development server
npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ for the developer community
- Inspired by the need for better authentication testing tools
- Thanks to all contributors and users who make this project possible

## 📞 Support

- 📖 [Documentation](https://mockauth.dev/docs)
- 🐛 [Issue Tracker](https://github.com/mockilo/mockauth/issues)
- 💬 [Discussions](https://github.com/mockilo/mockauth/discussions)
- 📧 [Email Support](mailto:support@mockauth.dev)

---

**Made with ❤️ by developers, for developers**