# MockAuth

[![npm version](https://badge.fury.io/js/mockauth.svg)](https://badge.fury.io/js/mockauth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Build Status](https://github.com/mockauth/mockauth/workflows/CI/badge.svg)](https://github.com/mockauth/mockauth/actions)

> **MockAuth** is a developer-first authentication simulator designed for development, testing, and staging environments. It provides realistic authentication and authorization flows, allowing developers and QA teams to test, prototype, and debug applications safely without relying on production authentication systems.

## 🚀 Quick Start

```bash
npm install mockauth
```

```javascript
import { MockAuth } from 'mockauth';

const auth = new MockAuth({
  port: 3001,
  jwtSecret: 'your-secret-key',
  users: [
    {
      email: 'admin@example.com',
      username: 'admin',
      password: 'admin123',
      roles: ['admin'],
      permissions: ['read:users', 'write:users']
    }
  ]
});

await auth.start();
console.log('MockAuth server running on http://localhost:3001');
```

## ✨ Features

### 🔐 **Complete Authentication Simulation**
- **Login/Logout** with JWT tokens
- **User Registration** and management
- **Token Refresh** and verification
- **Role-Based Access Control (RBAC)**

### 🛡️ **Advanced Security Features**
- **Multi-Factor Authentication (MFA)** with TOTP
- **Password Reset** flow with secure tokens
- **Account Lockout** protection
- **Session Management** with multi-device tracking

### 🎯 **Developer Experience**
- **TypeScript** support with full type definitions
- **REST API** with comprehensive documentation
- **Integration Examples** for popular frameworks
- **Testing Utilities** for Jest, Cypress, Playwright

### 🏗️ **Production Ready**
- **Error Handling** and validation
- **Rate Limiting** and security headers
- **Health Checks** and monitoring
- **Docker** support

## 📖 Documentation

- [Getting Started Guide](./docs/getting-started.md)
- [API Reference](./docs/api-reference.md)
- [Integration Examples](./docs/examples.md)
- [Technical Specifications](./docs/technical-specs.md)

## 🎯 Use Cases

### **Frontend Development**
```javascript
// Simulate different user states
const user = await auth.login('john@example.com', 'password');
const adminUser = await auth.login('admin@example.com', 'password');

// Test role-based UI rendering
if (user.hasRole('admin')) {
  renderAdminPanel();
}
```

### **Backend Development**
```javascript
// Validate protected endpoints
app.get('/api/users', auth.requireRole('admin'), (req, res) => {
  res.json(users);
});
```

### **QA & Testing**
```javascript
// Automated testing with multiple scenarios
describe('User Authentication', () => {
  test('admin can access protected route', async () => {
    const admin = await auth.createUser({
      email: 'admin@test.com',
      roles: ['admin']
    });
    
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${admin.token}`);
      
    expect(response.status).toBe(200);
  });
});
```

## 🌐 Ecosystem

MockAuth is part of the **Mockilo** developer ecosystem:

- **MockTail** → Prisma-aware mock data generator
- **SchemaGhost** → Fake API server simulating backend endpoints  
- **MockAuth** → Fake authentication layer for secure, realistic user flows

Together, these tools provide a complete sandbox for developers, enabling end-to-end testing, prototyping, and QA without touching production systems.

## 🚀 Getting Started

### **Installation**
```bash
npm install mockauth
```

### **Basic Setup**
```javascript
import { MockAuth } from 'mockauth';

const auth = new MockAuth({
  port: 3001,
  jwtSecret: 'your-secret-key',
  users: [
    {
      email: 'admin@example.com',
      username: 'admin',
      password: 'admin123',
      roles: ['admin'],
      permissions: ['read:users', 'write:users']
    }
  ]
});

await auth.start();
```

### **API Usage**
```javascript
// Login
const response = await fetch('http://localhost:3001/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
  })
});

const { data } = await response.json();
console.log('User:', data.user);
console.log('Token:', data.token);
```

## 📊 API Endpoints

### **Authentication**
- `POST /auth/login` - Login user
- `POST /auth/register` - Register new user
- `POST /auth/logout` - Logout user
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Get current user

### **Multi-Factor Authentication**
- `POST /auth/mfa/setup` - Setup MFA
- `POST /auth/mfa/verify` - Verify MFA code
- `DELETE /auth/mfa/disable` - Disable MFA
- `GET /auth/mfa/status` - Get MFA status

### **Password Reset**
- `POST /auth/password-reset/request` - Request password reset
- `POST /auth/password-reset/verify` - Verify reset token
- `POST /auth/password-reset/complete` - Complete password reset

### **User Management**
- `GET /users` - Get all users (admin)
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user (admin)
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (admin)

## 🔧 Configuration

```javascript
const auth = new MockAuth({
  // Server configuration
  port: 3001,
  baseUrl: 'http://localhost:3001',
  host: 'localhost',
  
  // Authentication settings
  jwtSecret: 'your-secret-key',
  tokenExpiry: '24h',
  refreshTokenExpiry: '7d',
  
  // Security settings
  maxLoginAttempts: 5,
  lockoutDuration: '15m',
  enableMFA: true,
  enablePasswordReset: true,
  
  // Logging
  logLevel: 'info',
  enableAuditLog: true
});
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint

# Build project
npm run build
```

## 📦 Examples

Check out the [examples](./examples/) directory for integration examples:

- [React](./examples/react/) - React integration with hooks
- [Vue.js](./examples/vue/) - Vue.js integration with Vuex
- [Angular](./examples/angular/) - Angular integration with services
- [Express.js](./examples/express/) - Express.js middleware integration
- [Cypress](./examples/cypress/) - E2E testing with Cypress
- [Playwright](./examples/playwright/) - E2E testing with Playwright

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🔗 Links

- [Documentation](https://mockauth.dev)
- [GitHub Repository](https://github.com/mockauth/mockauth)
- [NPM Package](https://www.npmjs.com/package/mockauth)
- [Discord Community](https://discord.gg/mockauth)

## 🙏 Acknowledgments

- Built with ❤️ by the MockAuth team
- Inspired by the need for better authentication testing tools
- Part of the Mockilo developer ecosystem

---

**Made with ❤️ for developers who need realistic authentication testing**
