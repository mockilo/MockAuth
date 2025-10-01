# MockAuth - Developer Authentication Simulator

[![npm version](https://badge.fury.io/js/mockauth.svg)](https://badge.fury.io/js/mockauth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> **MockAuth** is a developer-first authentication simulator designed for development, testing, and staging environments. It provides realistic authentication and authorization flows, allowing developers and QA teams to test, prototype, and debug applications safely without relying on production authentication systems.

## 🚀 Quick Start

```bash
npm install mockauth
# or
yarn add mockauth
```

```javascript
import { MockAuth } from 'mockauth';

const auth = new MockAuth({
  port: 3001,
  users: [
    {
      id: 'user-1',
      email: 'john@example.com',
      username: 'john_doe',
      roles: ['admin'],
      permissions: ['read:users', 'write:users']
    }
  ]
});

await auth.start();
```

## ✨ Key Features

### 🔐 Mock User Management
- Dynamic creation, editing, and deletion of mock users
- Rich user attributes: email, username, profile data, roles, permissions, custom metadata
- User groups and multi-user simulation for complex hierarchies
- Multiple simultaneous user sessions for realistic scenarios

### 🔑 Authentication Flow Simulation
- Complete simulation of login, signup, logout, password reset, and token refresh
- Configurable error states (invalid credentials, locked accounts, expired tokens)
- Optional multi-factor authentication (MFA) simulation
- Edge-case testing for account recovery and verification flows

### 👥 Role-Based Access Control (RBAC)
- Granular roles and permissions for APIs, routes, or features
- Test protected endpoints and UI access dynamically
- Simulate restricted or escalated access safely
- Seamless integration with frontend and backend frameworks

### 🎫 Token & Session Handling
- Generate mock JWT, session tokens, or API keys
- Token expiration, renewal, revocation, and multi-device sessions
- Realistic session lifecycle for robust testing

### 🛠️ Developer-Friendly API
- Programmatic API for creating/updating users, roles, and tokens
- Works with React, Vue, Angular, Node.js, Django, Rails
- Easy integration with Jest, Cypress, Playwright test suites
- CI/CD pipeline ready

### 🔒 Security & Isolation
- Operates entirely in dev/staging environments
- No sensitive user data required
- Safe for QA pipelines and sandboxed environments
- Complete isolation from production systems

## 🎯 Use Cases

### Frontend Development
```javascript
// Simulate different user states
const user = await auth.login('john@example.com', 'password');
const adminUser = await auth.login('admin@example.com', 'password');

// Test role-based UI rendering
if (user.hasRole('admin')) {
  renderAdminPanel();
}
```

### Backend Development
```javascript
// Validate protected endpoints
app.get('/api/users', auth.requireRole('admin'), (req, res) => {
  res.json(users);
});

// Test token expiry scenarios
const expiredToken = auth.createToken(user, { expiresIn: '1ms' });
```

### QA & Testing
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

## 📖 Documentation

- [Getting Started Guide](./docs/getting-started.md)
- [API Reference](./docs/api-reference.md)
- [Integration Examples](./docs/examples.md)
- [Workflow Diagrams](./docs/workflows.md)
- [Technical Specifications](./docs/technical-specs.md)

## 🔄 Workflow Example

```
[Developer] → [MockAuth API] → [Frontend App] → [Backend API]
     ↓              ↓              ↓              ↓
Define Users    Consume Mock    Validate      Logs &
Roles & Perms   Tokens &        Tokens &      Metrics
                Sessions        RBAC
```

## 🌐 Ecosystem Positioning

MockAuth is part of the complete developer sandbox ecosystem:

- **Mocktail** → Prisma-aware mock data generator
- **SchemaGhost** → Fake API server simulating backend endpoints  
- **MockAuth** → Fake authentication layer for secure, realistic user flows

Together, these tools provide a complete sandbox for developers, enabling end-to-end testing, prototyping, and QA without touching production systems.

## 🚀 Advanced Features

- **Configurable Auth Policies**: Password rules, MFA, account lockout policies
- **Multi-Tenant Simulation**: Test SaaS apps with multiple tenants and user hierarchies
- **Analytics & Audit Logs**: Track user behavior and test results
- **CI/CD Integration**: Automate authentication testing in pipelines
- **Pluggable OAuth/SSO Providers**: Simulate social logins and enterprise SSO flows

## 🎯 Mission Statement

To empower developers and QA teams by providing a safe, fast, and realistic authentication simulation, reducing development friction, accelerating prototyping, and ensuring robust testing before production deployment.

## 📋 Technical Specifications

- **API Type**: REST / GraphQL
- **Token Types**: JWT, Session Tokens, API Keys
- **Environment**: Local, Dev, Staging
- **Programming Support**: Node.js, Python, Ruby, PHP, JS Frontend Frameworks
- **Testing Integration**: Jest, Cypress, Playwright, Selenium

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🔗 Links

- [Documentation](https://mockauth.dev)
- [GitHub Repository](https://github.com/mockauth/mockauth)
- [NPM Package](https://www.npmjs.com/package/mockauth)
- [Discord Community](https://discord.gg/mockauth)
