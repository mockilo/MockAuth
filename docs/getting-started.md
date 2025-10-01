# Getting Started with MockAuth

This guide will help you get up and running with MockAuth in your development environment.

## Installation

### NPM
```bash
npm install mockauth
```

### Yarn
```bash
yarn add mockauth
```

### PNPM
```bash
pnpm add mockauth
```

## Basic Setup

### 1. Initialize MockAuth

```javascript
import { MockAuth } from 'mockauth';

const auth = new MockAuth({
  port: 3001,
  baseUrl: 'http://localhost:3001',
  users: [
    {
      id: 'user-1',
      email: 'john@example.com',
      username: 'john_doe',
      password: 'password123',
      roles: ['user'],
      permissions: ['read:profile']
    },
    {
      id: 'admin-1',
      email: 'admin@example.com',
      username: 'admin',
      password: 'admin123',
      roles: ['admin'],
      permissions: ['read:users', 'write:users', 'delete:users']
    }
  ]
});

await auth.start();
console.log('MockAuth server running on http://localhost:3001');
```

### 2. Configure Your Application

#### Frontend Integration (React Example)

```javascript
// authService.js
class AuthService {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async login(email, password) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      return data.user;
    }
    throw new Error('Login failed');
  }

  async getCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const response = await fetch(`${this.baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return response.ok ? await response.json() : null;
  }
}

export default new AuthService();
```

#### Backend Integration (Express.js Example)

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify token with MockAuth
    const response = await fetch('http://localhost:3001/auth/verify', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      req.user = await response.json();
      next();
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Token verification failed' });
  }
};

module.exports = authMiddleware;
```

## Configuration Options

### MockAuth Constructor Options

```javascript
const auth = new MockAuth({
  // Server configuration
  port: 3001,                    // Port for MockAuth server
  baseUrl: 'http://localhost:3001', // Base URL for API calls
  host: 'localhost',             // Host to bind to
  
  // Authentication settings
  jwtSecret: 'your-secret-key',  // JWT signing secret
  tokenExpiry: '24h',           // Default token expiry time
  refreshTokenExpiry: '7d',     // Refresh token expiry time
  
  // User management
  users: [...],                 // Initial users array
  roles: [...],                 // Available roles
  permissions: [...],           // Available permissions
  
  // Features
  enableMFA: false,             // Enable MFA simulation
  enablePasswordReset: true,    // Enable password reset flow
  enableAccountLockout: true,   // Enable account lockout after failed attempts
  
  // Logging
  logLevel: 'info',             // 'debug', 'info', 'warn', 'error'
  enableAuditLog: true,         // Enable audit logging
  
  // Security
  maxLoginAttempts: 5,          // Max failed login attempts before lockout
  lockoutDuration: '15m',       // Account lockout duration
  passwordPolicy: {             // Password policy rules
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false
  }
});
```

## Common Use Cases

### 1. Frontend Development

```javascript
// Simulate different user states
const scenarios = [
  { user: 'john@example.com', role: 'user' },
  { user: 'admin@example.com', role: 'admin' },
  { user: 'guest@example.com', role: 'guest' }
];

scenarios.forEach(async (scenario) => {
  const user = await auth.login(scenario.user, 'password');
  console.log(`Logged in as ${user.email} with role: ${user.roles[0]}`);
});
```

### 2. Backend API Testing

```javascript
// Test protected endpoints
describe('Protected API Endpoints', () => {
  test('admin can access user list', async () => {
    const admin = await auth.createUser({
      email: 'test-admin@example.com',
      roles: ['admin']
    });
    
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${admin.token}`);
      
    expect(response.status).toBe(200);
  });
  
  test('regular user cannot access admin routes', async () => {
    const user = await auth.createUser({
      email: 'test-user@example.com',
      roles: ['user']
    });
    
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${user.token}`);
      
    expect(response.status).toBe(403);
  });
});
```

### 3. E2E Testing with Cypress

```javascript
// cypress/support/commands.js
Cypress.Commands.add('loginAs', (userType) => {
  const users = {
    admin: { email: 'admin@example.com', password: 'admin123' },
    user: { email: 'user@example.com', password: 'password123' }
  };
  
  const user = users[userType];
  cy.request('POST', 'http://localhost:3001/auth/login', user)
    .then((response) => {
      window.localStorage.setItem('token', response.body.token);
    });
});

// cypress/integration/admin.spec.js
describe('Admin Panel', () => {
  it('should allow admin to manage users', () => {
    cy.loginAs('admin');
    cy.visit('/admin');
    cy.get('[data-testid="user-list"]').should('be.visible');
  });
});
```

## Next Steps

- [API Reference](./api-reference.md) - Complete API documentation
- [Integration Examples](./examples.md) - Framework-specific examples
- [Workflow Diagrams](./workflows.md) - Visual workflow explanations
- [Technical Specifications](./technical-specs.md) - Detailed technical specs

## Troubleshooting

### Common Issues

**MockAuth server won't start**
- Check if port 3001 is available
- Verify your configuration object is valid
- Check console for error messages

**Authentication not working**
- Ensure MockAuth server is running
- Verify baseUrl matches your MockAuth server URL
- Check token format and headers

**Users not persisting**
- MockAuth runs in-memory by default
- Use database persistence for production-like behavior
- Check user creation API calls

### Getting Help

- [GitHub Issues](https://github.com/mockauth/mockauth/issues)
- [Discord Community](https://discord.gg/mockauth)
- [Documentation](https://mockauth.dev)
