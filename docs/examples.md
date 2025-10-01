# MockAuth Integration Examples

This document provides practical examples of integrating MockAuth with various frameworks and testing tools.

## Table of Contents

- [React Integration](#react-integration)
- [Vue.js Integration](#vuejs-integration)
- [Angular Integration](#angular-integration)
- [Express.js Integration](#expressjs-integration)
- [Fastify Integration](#fastify-integration)
- [Cypress Testing](#cypress-testing)
- [Playwright Testing](#playwright-testing)
- [Jest Unit Testing](#jest-unit-testing)

## React Integration

### Basic Setup

```jsx
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
      localStorage.setItem('token', data.data.token);
      return data.data.user;
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

  async logout() {
    const token = localStorage.getItem('token');
    if (token) {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
    localStorage.removeItem('token');
  }
}

export default new AuthService();
```

### React Hook

```jsx
// useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import authService from './authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await authService.getCurrentUser();
      setUser(user?.data || null);
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const user = await authService.login(email, password);
      setUser(user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const hasRole = (role) => {
    return user?.roles?.includes(role) || false;
  };

  const hasPermission = (permission) => {
    return user?.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      hasRole,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Protected Route Component

```jsx
// ProtectedRoute.jsx
import { useAuth } from './useAuth';

export function ProtectedRoute({ children, requiredRole, requiredPermission }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to access this page.</div>;
  }

  if (requiredRole && !user.roles.includes(requiredRole)) {
    return <div>You don't have the required role: {requiredRole}</div>;
  }

  if (requiredPermission && !user.permissions.includes(requiredPermission)) {
    return <div>You don't have the required permission: {requiredPermission}</div>;
  }

  return children;
}
```

## Vue.js Integration

### Vuex Store

```javascript
// store/auth.js
import authService from '@/services/authService';

export const auth = {
  namespaced: true,
  state: {
    user: null,
    loading: false
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user;
    },
    SET_LOADING(state, loading) {
      state.loading = loading;
    }
  },
  actions: {
    async login({ commit }, { email, password }) {
      commit('SET_LOADING', true);
      try {
        const user = await authService.login(email, password);
        commit('SET_USER', user);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async logout({ commit }) {
      await authService.logout();
      commit('SET_USER', null);
    },
    async checkAuth({ commit }) {
      try {
        const user = await authService.getCurrentUser();
        commit('SET_USER', user?.data || null);
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    }
  },
  getters: {
    isAuthenticated: state => !!state.user,
    hasRole: state => role => state.user?.roles?.includes(role) || false,
    hasPermission: state => permission => state.user?.permissions?.includes(permission) || false
  }
};
```

### Vue Component

```vue
<!-- LoginForm.vue -->
<template>
  <div class="login-form">
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label>Email:</label>
        <input v-model="email" type="email" required />
      </div>
      <div class="form-group">
        <label>Password:</label>
        <input v-model="password" type="password" required />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>
    </form>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  data() {
    return {
      email: '',
      password: '',
      error: null
    };
  },
  computed: {
    loading() {
      return this.$store.state.auth.loading;
    }
  },
  methods: {
    ...mapActions('auth', ['login']),
    async handleLogin() {
      this.error = null;
      const result = await this.login({
        email: this.email,
        password: this.password
      });
      
      if (result.success) {
        this.$router.push('/dashboard');
      } else {
        this.error = result.error;
      }
    }
  }
};
</script>
```

## Angular Integration

### Auth Service

```typescript
// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:3001';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkAuthStatus();
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, { email, password })
      .pipe(
        tap((response: any) => {
          if (response.success) {
            localStorage.setItem('token', response.data.token);
            this.currentUserSubject.next(response.data.user);
          }
        })
      );
  }

  logout(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.post(`${this.baseUrl}/auth/logout`, {}, { headers })
      .pipe(
        tap(() => {
          localStorage.removeItem('token');
          this.currentUserSubject.next(null);
        })
      );
  }

  getCurrentUser(): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      return new Observable(observer => observer.next(null));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.baseUrl}/auth/me`, { headers })
      .pipe(
        tap((response: any) => {
          if (response.success) {
            this.currentUserSubject.next(response.data);
          }
        })
      );
  }

  private checkAuthStatus(): void {
    this.getCurrentUser().subscribe();
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.roles?.includes(role) || false;
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.permissions?.includes(permission) || false;
  }
}
```

### Auth Guard

```typescript
// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const user = this.authService.currentUserSubject.value;
    if (user) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
```

## Express.js Integration

### Basic Setup

```javascript
// server.js
const express = require('express');
const { MockAuth } = require('mockauth');

const app = express();
const mockAuth = new MockAuth({
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

// Start MockAuth
mockAuth.start();

// Auth middleware
const authenticateToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = await mockAuth.verifyToken(token);
    if (!user) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token verification failed' });
  }
};

// Role-based middleware
const requireRole = (role) => (req, res, next) => {
  if (!req.user.roles.includes(role)) {
    return res.status(403).json({ error: `Role '${role}' required` });
  }
  next();
};

// Routes
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.get('/admin', authenticateToken, requireRole('admin'), (req, res) => {
  res.json({ message: 'Admin access granted' });
});

app.listen(3000);
```

## Cypress Testing

### Commands

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
      window.localStorage.setItem('token', response.body.data.token);
    });
});

Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('token');
});
```

### Test Example

```javascript
// cypress/integration/auth.spec.js
describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should allow admin to access admin panel', () => {
    cy.loginAs('admin');
    cy.visit('/admin');
    cy.get('[data-testid="admin-panel"]').should('be.visible');
  });

  it('should deny regular user access to admin panel', () => {
    cy.loginAs('user');
    cy.visit('/admin');
    cy.get('[data-testid="access-denied"]').should('be.visible');
  });

  it('should logout successfully', () => {
    cy.loginAs('admin');
    cy.visit('/dashboard');
    cy.get('[data-testid="logout-btn"]').click();
    cy.url().should('include', '/login');
  });
});
```

## Playwright Testing

### Setup

```javascript
// playwright.config.js
module.exports = {
  use: {
    baseURL: 'http://localhost:3000',
    extraHTTPHeaders: {
      'Authorization': 'Bearer your-test-token'
    }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
};
```

### Test Example

```javascript
// tests/auth.spec.js
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login and access protected content', async ({ page }) => {
    // Mock login API call
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: '1', email: 'test@example.com', roles: ['user'] },
            token: 'mock-token'
          }
        })
      });
    });

    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-btn"]');
    
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });
});
```

## Jest Unit Testing

### Mock Setup

```javascript
// __mocks__/mockauth.js
const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    username: 'admin',
    roles: ['admin'],
    permissions: ['read:users', 'write:users']
  }
];

const MockAuth = {
  async login(email, password) {
    const user = mockUsers.find(u => u.email === email);
    if (user && password === 'password123') {
      return {
        success: true,
        user,
        token: 'mock-token'
      };
    }
    throw new Error('Invalid credentials');
  },
  
  async verifyToken(token) {
    if (token === 'mock-token') {
      return mockUsers[0];
    }
    return null;
  }
};

module.exports = { MockAuth };
```

### Test Example

```javascript
// auth.test.js
const { MockAuth } = require('mockauth');

describe('AuthService', () => {
  let authService;

  beforeEach(() => {
    authService = new MockAuth({
      jwtSecret: 'test-secret',
      users: []
    });
  });

  test('should login with valid credentials', async () => {
    const result = await authService.login('admin@example.com', 'password123');
    expect(result.success).toBe(true);
    expect(result.user.email).toBe('admin@example.com');
  });

  test('should reject invalid credentials', async () => {
    await expect(
      authService.login('admin@example.com', 'wrong-password')
    ).rejects.toThrow('Invalid credentials');
  });
});
```

## Best Practices

### 1. Environment Configuration

```javascript
// config/auth.js
const config = {
  development: {
    mockAuthUrl: 'http://localhost:3001',
    jwtSecret: 'dev-secret'
  },
  test: {
    mockAuthUrl: 'http://localhost:3001',
    jwtSecret: 'test-secret'
  },
  production: {
    mockAuthUrl: process.env.MOCKAUTH_URL,
    jwtSecret: process.env.JWT_SECRET
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

### 2. Error Handling

```javascript
// utils/authErrorHandler.js
export function handleAuthError(error) {
  if (error.response?.status === 401) {
    // Redirect to login
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    // Show access denied message
    showNotification('Access denied', 'error');
  } else {
    // Show generic error
    showNotification('Authentication error', 'error');
  }
}
```

### 3. Token Refresh

```javascript
// utils/tokenManager.js
export class TokenManager {
  constructor(authService) {
    this.authService = authService;
    this.refreshPromise = null;
  }

  async getValidToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      // Try to verify current token
      const user = await this.authService.verifyToken(token);
      if (user) return token;
    } catch (error) {
      // Token is invalid, try to refresh
      return this.refreshToken();
    }
  }

  async refreshToken() {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  async performRefresh() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
      const response = await this.authService.refreshToken(refreshToken);
      localStorage.setItem('token', response.token);
      return response.token;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return null;
    }
  }
}
```

These examples provide a comprehensive foundation for integrating MockAuth with various frameworks and testing tools. Choose the approach that best fits your project's architecture and requirements.
