# Enterprise Features

MockAuth provides comprehensive enterprise-grade features for organizations that need advanced authentication, authorization, and compliance capabilities.

## 🏢 Enterprise Overview

MockAuth Enterprise includes:

- **Single Sign-On (SSO)** - OAuth2, SAML, and OpenID Connect support
- **Advanced RBAC** - Hierarchical roles, resource ownership, and policy engine
- **Compliance Monitoring** - GDPR, HIPAA, SOX, PCI-DSS compliance tracking
- **Enhanced Security** - Advanced password policies, session monitoring, audit logging
- **Enterprise Integration** - Webhooks, API management, and ecosystem services

## 🔐 Single Sign-On (SSO)

### Supported Providers

- **Google OAuth2** - Google Workspace integration
- **Microsoft Azure AD** - Enterprise Microsoft accounts
- **Custom OAuth2** - Any OAuth2-compliant provider
- **SAML 2.0** - Enterprise SAML identity providers
- **OpenID Connect** - Modern identity standard

### Configuration

```javascript
const config = {
  sso: {
    enableSSO: true,
    ssoSecret: 'your-sso-secret-key',
    callbackUrl: 'http://localhost:3001/sso/callback',
    providers: [
      {
        name: 'google',
        type: 'oauth2',
        clientId: 'your-google-client-id',
        clientSecret: 'your-google-client-secret',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scope: ['openid', 'email', 'profile'],
        redirectUri: 'http://localhost:3001/sso/callback/google'
      }
    ]
  }
};
```

### SSO Endpoints

- `GET /sso/providers` - List available SSO providers
- `GET /sso/login/:provider` - Initiate SSO login
- `POST /sso/callback/:provider` - Handle SSO callback
- `POST /sso/validate` - Validate SSO token

### Usage Example

```javascript
// Get available providers
const providers = await fetch('/sso/providers').then(r => r.json());

// Initiate SSO login
const authUrl = await fetch('/sso/login/google?redirect_url=/dashboard')
  .then(r => r.json());

// Redirect user to authUrl.data.authUrl
window.location.href = authUrl.data.authUrl;
```

## 🛡️ Advanced RBAC (Role-Based Access Control)

### Features

- **Hierarchical Roles** - Roles can inherit from other roles
- **Resource Ownership** - Users can own resources with special permissions
- **Policy Engine** - Fine-grained access control policies
- **Dynamic Permissions** - Context-aware permission evaluation
- **Audit Logging** - Complete access decision logging

### Configuration

```javascript
const config = {
  rbac: {
    enableHierarchicalRoles: true,
    enableResourceOwnership: true,
    enablePolicyEngine: true,
    defaultDeny: false,
    auditLogging: true
  }
};
```

### RBAC Endpoints

- `POST /rbac/check` - Check user permissions
- `POST /rbac/permissions` - Create new permission
- `POST /rbac/roles` - Create new role
- `POST /rbac/policies` - Create new policy
- `POST /rbac/resources` - Create new resource

### Permission Check Example

```javascript
const decision = await fetch('/rbac/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user: { id: 'user1', roles: ['admin'] },
    action: 'read',
    resource: { id: 'user2', type: 'user' },
    context: { department: 'engineering' }
  })
}).then(r => r.json());

console.log(decision.data.allowed); // true/false
console.log(decision.data.reason); // Why access was granted/denied
```

### Hierarchical Roles Example

```javascript
// Create roles with inheritance
const adminRole = {
  name: 'admin',
  permissions: ['admin_all'],
  inherits: ['manager']
};

const managerRole = {
  name: 'manager',
  permissions: ['manage_team'],
  inherits: ['user']
};

const userRole = {
  name: 'user',
  permissions: ['read_profile']
};
```

## 📊 Compliance Monitoring

### Supported Standards

- **GDPR** - General Data Protection Regulation
- **HIPAA** - Health Insurance Portability and Accountability Act
- **SOX** - Sarbanes-Oxley Act
- **PCI-DSS** - Payment Card Industry Data Security Standard

### Features

- **Audit Logging** - Complete activity tracking
- **Violation Detection** - Automatic compliance violation detection
- **Reporting** - Compliance reports and dashboards
- **Data Retention** - Configurable audit log retention
- **Encryption Monitoring** - Data encryption compliance tracking

### Configuration

```javascript
const config = {
  compliance: {
    enableAuditLogging: true,
    auditRetentionDays: 90,
    enablePasswordPolicy: true,
    enableSessionMonitoring: true,
    enableDataEncryption: true,
    enableAccessControl: true,
    complianceStandards: ['GDPR', 'HIPAA', 'SOX', 'PCI-DSS'],
    reportingInterval: 30
  }
};
```

### Compliance Endpoints

- `POST /compliance/audit` - Log audit event
- `GET /compliance/violations` - Get compliance violations
- `POST /compliance/violations/:id/resolve` - Resolve violation
- `GET /compliance/audit` - Get audit logs
- `POST /compliance/reports` - Generate compliance report
- `POST /compliance/rules` - Create compliance rule

### Audit Logging Example

```javascript
// Log an audit event
await fetch('/compliance/audit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user1',
    action: 'login',
    resource: 'auth',
    success: true,
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    details: { loginMethod: 'password' }
  })
});
```

### Compliance Report Example

```javascript
// Generate compliance report
const report = await fetch('/compliance/reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'security',
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  })
}).then(r => r.json());

console.log(report.data.summary);
// {
//   totalViolations: 5,
//   criticalViolations: 1,
//   highViolations: 2,
//   mediumViolations: 1,
//   lowViolations: 1
// }
```

## 🔒 Enhanced Security

### Password Policies

```javascript
const config = {
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true
  }
};
```

### Session Monitoring

- **Session Timeout** - Automatic session expiration
- **Concurrent Sessions** - Limit concurrent user sessions
- **Session Analytics** - Session duration and activity tracking
- **Suspicious Activity** - Detection of unusual login patterns

### Account Security

- **Account Lockout** - Automatic account locking after failed attempts
- **Password History** - Prevent password reuse
- **Multi-Factor Authentication** - TOTP, SMS, and backup codes
- **Device Management** - Track and manage user devices

## 🌐 Enterprise Integration

### Webhooks

```javascript
const config = {
  webhooks: {
    userRegistered: 'https://your-system.com/webhooks/user-registered',
    userLoggedIn: 'https://your-system.com/webhooks/user-logged-in',
    userLoggedOut: 'https://your-system.com/webhooks/user-logged-out',
    passwordChanged: 'https://your-system.com/webhooks/password-changed',
    accountLocked: 'https://your-system.com/webhooks/account-locked'
  }
};
```

### API Management

- **Rate Limiting** - Configurable API rate limits
- **API Keys** - Enterprise API key management
- **Request Logging** - Complete API request/response logging
- **Performance Monitoring** - API performance metrics

### Ecosystem Integration

- **MockTail** - Advanced mock data generation
- **SchemaGhost** - Enterprise API simulation
- **Database Integration** - PostgreSQL, MySQL, SQLite support
- **Caching** - Redis and in-memory caching

## 📈 Monitoring and Analytics

### Metrics Endpoint

```javascript
// Get system metrics
const metrics = await fetch('/metrics').then(r => r.json());

console.log(metrics.data);
// {
//   requests: { total: 1000, success: 950, errors: 50 },
//   users: { total: 100, active: 85, locked: 2 },
//   performance: { avgResponseTime: 45, p95ResponseTime: 120 },
//   compliance: { violations: 5, resolved: 3 }
// }
```

### Health Monitoring

- **System Health** - CPU, memory, and disk usage
- **Service Status** - Database, cache, and external service status
- **Performance Metrics** - Response times and throughput
- **Error Tracking** - Error rates and types

## 🚀 Getting Started

### 1. Install MockAuth

```bash
npm install mockauth
```

### 2. Configure Enterprise Features

```javascript
const { MockAuth } = require('mockauth');

const config = {
  port: 3001,
  baseUrl: 'http://localhost:3001',
  jwtSecret: 'your-secret-key',
  
  // Enable enterprise features
  sso: { /* SSO config */ },
  rbac: { /* RBAC config */ },
  compliance: { /* Compliance config */ },
  
  // Enhanced security
  passwordPolicy: { /* Password policy */ },
  enableMFA: true,
  enableAccountLockout: true,
  
  // Enterprise users
  users: [
    {
      email: 'admin@company.com',
      username: 'admin',
      password: 'SecurePassword123!',
      roles: ['admin'],
      permissions: ['*']
    }
  ]
};

const auth = new MockAuth(config);
await auth.start();
```

### 3. Test Enterprise Features

```bash
# Test SSO providers
curl http://localhost:3001/sso/providers

# Test RBAC
curl -X POST http://localhost:3001/rbac/check \
  -H "Content-Type: application/json" \
  -d '{"user":{"id":"1","roles":["admin"]},"action":"read","resource":{"id":"user1","type":"user"}}'

# Test compliance
curl -X POST http://localhost:3001/compliance/audit \
  -H "Content-Type: application/json" \
  -d '{"userId":"1","action":"login","resource":"auth","success":true}'
```

## 📚 Examples

Complete enterprise examples are available:

- **Enterprise Example**: `examples/enterprise-example.js`
- **SSO Integration**: `examples/sso-integration.js`
- **RBAC Implementation**: `examples/rbac-implementation.js`
- **Compliance Monitoring**: `examples/compliance-monitoring.js`

## 🔧 Troubleshooting

### Common Issues

1. **SSO Configuration** - Verify provider URLs and credentials
2. **RBAC Policies** - Check role inheritance and permission mapping
3. **Compliance Violations** - Review audit logs and violation details
4. **Performance** - Monitor metrics and optimize database queries

### Debug Mode

Enable debug logging for troubleshooting:

```javascript
const config = {
  logLevel: 'debug',
  // ... other config
};
```

## 📞 Support

For enterprise support and custom implementations:

- **Documentation**: https://mockauth.dev/docs/enterprise
- **GitHub Issues**: https://github.com/mockilo/mockauth/issues
- **Enterprise Support**: enterprise@mockauth.dev

## 🏆 Enterprise Benefits

- **Security** - Enterprise-grade security features
- **Compliance** - Built-in compliance monitoring
- **Scalability** - Handles enterprise-scale workloads
- **Integration** - Seamless integration with existing systems
- **Support** - Dedicated enterprise support
- **Customization** - Flexible configuration for any use case
