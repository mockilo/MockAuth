# 🔄 Show the Transition Path

MockAuth is designed to make your transition from development to production seamless. This guide shows you exactly how to migrate from MockAuth to production authentication providers while keeping the same API.

## 🎯 The Migration Philosophy

**Same API, Different Provider** - Write your authentication code once, switch providers easily.

```javascript
// Development
import MockAuth from 'mockauth'

// Later, in production:
import RealAuth from 'clerk' // or better-auth

// Same API! Easy migration.
```

## 🚀 Quick Migration Examples

### 1. **MockAuth → Clerk**

#### Development Setup (MockAuth)
```javascript
// src/auth/mockauth.js
import { MockAuth } from 'mockauth';

const auth = new MockAuth({
  port: 3001,
  jwtSecret: 'dev-secret',
  users: [
    { email: 'admin@test.com', password: 'admin123', roles: ['admin'] },
    { email: 'user@test.com', password: 'user123', roles: ['user'] }
  ]
});

export const authService = {
  async login(email, password) {
    const result = await auth.login(email, password);
    return {
      user: result.user,
      token: result.token,
      success: true
    };
  },
  
  async verifyToken(token) {
    return await auth.verifyToken(token);
  },
  
  async logout(token) {
    return await auth.logout(token);
  }
};
```

#### Production Setup (Clerk)
```javascript
// src/auth/clerk.js
import { Clerk } from '@clerk/clerk-sdk-node';

const clerk = new Clerk({
  secretKey: process.env.CLERK_SECRET_KEY
});

export const authService = {
  async login(email, password) {
    // Clerk handles this differently, but same interface
    const user = await clerk.users.authenticate({ email, password });
    const token = await clerk.sessions.createToken(user.id);
    
    return {
      user: {
        id: user.id,
        email: user.emailAddresses[0].emailAddress,
        roles: user.publicMetadata.roles || ['user']
      },
      token,
      success: true
    };
  },
  
  async verifyToken(token) {
    const session = await clerk.sessions.verifyToken(token);
    return session.user;
  },
  
  async logout(token) {
    await clerk.sessions.revokeSession(token);
    return { success: true };
  }
};
```

#### Unified Interface
```javascript
// src/auth/index.js
const isDevelopment = process.env.NODE_ENV === 'development';

export const authService = isDevelopment 
  ? require('./mockauth').authService
  : require('./clerk').authService;

// Your app code never changes!
```

### 2. **MockAuth → Better-Auth** ⭐ *Recommended*

#### Development Setup (MockAuth)
```javascript
// src/auth/mockauth.js
import { MockAuth } from 'mockauth';

const auth = new MockAuth({
  port: 3001,
  jwtSecret: 'dev-secret',
  users: [
    { email: 'admin@test.com', password: 'admin123', roles: ['admin'] }
  ]
});

export const authService = {
  async login(email, password) {
    return await auth.login(email, password);
  },
  
  async register(userData) {
    return await auth.createUser(userData);
  },
  
  async verifyToken(token) {
    return await auth.verifyToken(token);
  }
};
```

#### Production Setup (Better-Auth)
```javascript
// src/auth/better-auth.js
import { betterAuth } from 'better-auth';

const auth = betterAuth({
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL
  },
  emailAndPassword: {
    enabled: true
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }
  }
});

export const authService = {
  async login(email, password) {
    const session = await auth.api.signInEmail({
      body: { email, password }
    });
    return session;
  },
  
  async register(userData) {
    const session = await auth.api.signUpEmail({
      body: userData
    });
    return session;
  },
  
  async verifyToken(token) {
    const session = await auth.api.getSession({
      headers: { authorization: `Bearer ${token}` }
    });
    return session;
  }
};
```

### 3. **MockAuth → Auth0**

#### Development Setup (MockAuth)
```javascript
// src/auth/mockauth.js
import { MockAuth } from 'mockauth';

const auth = new MockAuth({
  port: 3001,
  jwtSecret: 'dev-secret',
  users: [
    { email: 'admin@test.com', password: 'admin123', roles: ['admin'] }
  ]
});

export const authService = {
  async login(email, password) {
    return await auth.login(email, password);
  },
  
  async verifyToken(token) {
    return await auth.verifyToken(token);
  }
};
```

#### Production Setup (Auth0)
```javascript
// src/auth/auth0.js
import { ManagementClient } from 'auth0';

const auth0 = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET
});

export const authService = {
  async login(email, password) {
    // Auth0 handles login through their hosted login page
    // This is a simplified example
    const user = await auth0.users.getByEmail(email);
    return {
      user: {
        id: user.user_id,
        email: user.email,
        roles: user.app_metadata?.roles || ['user']
      },
      token: 'auth0-token', // Simplified
      success: true
    };
  },
  
  async verifyToken(token) {
    // Verify JWT token with Auth0
    const decoded = jwt.verify(token, process.env.AUTH0_PUBLIC_KEY);
    return decoded;
  }
};
```

## 🔧 Framework-Specific Migration Examples

### React Migration

#### Development (MockAuth)
```jsx
// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { authService } from '../auth/mockauth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authService.verifyToken(token).then(setUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    if (result.success) {
      localStorage.setItem('token', result.token);
      setUser(result.user);
    }
    return result;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return { user, login, logout, loading };
};
```

#### Production (Clerk)
```jsx
// src/hooks/useAuth.js
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

export const useAuth = () => {
  const { user } = useUser();
  const { signOut } = useClerkAuth();

  const login = async (email, password) => {
    // Clerk handles this through their components
    // This is a simplified example
    return { success: true, user };
  };

  const logout = () => {
    signOut();
  };

  return { 
    user: user ? {
      id: user.id,
      email: user.emailAddresses[0].emailAddress,
      roles: user.publicMetadata.roles || ['user']
    } : null, 
    login, 
    logout, 
    loading: false 
  };
};
```

### Vue Migration

#### Development (MockAuth)
```vue
<!-- src/composables/useAuth.js -->
import { ref, onMounted } from 'vue';
import { authService } from '../auth/mockauth';

export const useAuth = () => {
  const user = ref(null);
  const loading = ref(true);

  onMounted(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      user.value = await authService.verifyToken(token);
    }
    loading.value = false;
  });

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    if (result.success) {
      localStorage.setItem('token', result.token);
      user.value = result.user;
    }
    return result;
  };

  const logout = () => {
    localStorage.removeItem('token');
    user.value = null;
  };

  return { user, login, logout, loading };
};
```

#### Production (Better-Auth)
```vue
<!-- src/composables/useAuth.js -->
import { ref, onMounted } from 'vue';
import { authService } from '../auth/better-auth';

export const useAuth = () => {
  const user = ref(null);
  const loading = ref(true);

  onMounted(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      user.value = await authService.verifyToken(token);
    }
    loading.value = false;
  });

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    if (result.success) {
      localStorage.setItem('token', result.token);
      user.value = result.user;
    }
    return result;
  };

  const logout = () => {
    localStorage.removeItem('token');
    user.value = null;
  };

  return { user, login, logout, loading };
};
```

## 🛠️ Migration Tools & Utilities

### 1. **Automatic Migration Generator**
```bash
# Generate migration files automatically
npx mockauth migrate --to clerk --output ./src/auth/clerk.js
npx mockauth migrate --to better-auth --output ./src/auth/better-auth.js
npx mockauth migrate --to auth0 --output ./src/auth/auth0.js
```

### 2. **Configuration Converter**
```bash
# Convert MockAuth config to production provider
npx mockauth convert-config --from mockauth --to clerk mockauth.config.json
npx mockauth convert-config --from mockauth --to better-auth mockauth.config.json
```

### 3. **Migration Testing**
```bash
# Test your migration before going live
npx mockauth test-migration --from mockauth --to clerk
npx mockauth test-migration --from mockauth --to better-auth
```

## 📋 Step-by-Step Migration Checklist

### Phase 1: Preparation
- [ ] **Audit Current Implementation**
  ```bash
  npx mockauth audit --current-setup
  ```

- [ ] **Export MockAuth Configuration**
  ```bash
  npx mockauth export-config --format json > mockauth.config.json
  ```

- [ ] **Generate Migration Plan**
  ```bash
  npx mockauth migration-plan --to clerk --output migration-plan.md
  ```

### Phase 2: Development
- [ ] **Create Production Auth Service**
  ```bash
  npx mockauth generate --provider clerk --output ./src/auth/clerk.js
  ```

- [ ] **Implement Environment Switching**
  ```javascript
  const authService = process.env.NODE_ENV === 'development' 
    ? require('./mockauth').authService
    : require('./clerk').authService;
  ```

- [ ] **Test Both Implementations**
  ```bash
  npm test -- --testNamePattern="auth"
  ```

### Phase 3: Staging
- [ ] **Deploy to Staging Environment**
  ```bash
  npx mockauth deploy --environment staging --provider clerk
  ```

- [ ] **Run Integration Tests**
  ```bash
  npx mockauth test --integration --provider clerk
  ```

- [ ] **Performance Testing**
  ```bash
  npx mockauth benchmark --provider clerk
  ```

### Phase 4: Production
- [ ] **Deploy to Production**
  ```bash
  npx mockauth deploy --environment production --provider clerk
  ```

- [ ] **Monitor Migration**
  ```bash
  npx mockauth monitor --migration --provider clerk
  ```

## 🔍 Migration Validation

### 1. **API Compatibility Check**
```bash
# Ensure API compatibility
npx mockauth validate-api --source mockauth --target clerk
```

### 2. **Feature Parity Check**
```bash
# Check feature parity
npx mockauth compare-features --source mockauth --target clerk
```

### 3. **Performance Comparison**
```bash
# Compare performance
npx mockauth benchmark --compare mockauth clerk
```

## 🚨 Common Migration Pitfalls

### 1. **Token Format Differences**
```javascript
// MockAuth tokens
const mockAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Clerk tokens (different format)
const clerkToken = 'clerk_session_abc123...';

// Solution: Use adapter pattern
const tokenAdapter = {
  toClerk: (mockAuthToken) => {
    // Convert MockAuth token to Clerk format
    return clerkToken;
  },
  fromClerk: (clerkToken) => {
    // Convert Clerk token to MockAuth format
    return mockAuthToken;
  }
};
```

### 2. **User Schema Differences**
```javascript
// MockAuth user schema
const mockAuthUser = {
  id: 'user-1',
  email: 'user@example.com',
  roles: ['user'],
  permissions: ['read:profile']
};

// Clerk user schema
const clerkUser = {
  id: 'user_abc123',
  emailAddresses: [{ emailAddress: 'user@example.com' }],
  publicMetadata: { roles: ['user'] }
};

// Solution: Use mapper functions
const userMapper = {
  toClerk: (mockAuthUser) => ({
    id: mockAuthUser.id,
    emailAddresses: [{ emailAddress: mockAuthUser.email }],
    publicMetadata: { roles: mockAuthUser.roles }
  }),
  fromClerk: (clerkUser) => ({
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0].emailAddress,
    roles: clerkUser.publicMetadata.roles || ['user']
  })
};
```

### 3. **Environment Variable Management**
```javascript
// .env.development
AUTH_PROVIDER=mockauth
MOCKAUTH_PORT=3001
MOCKAUTH_SECRET=dev-secret

// .env.production
AUTH_PROVIDER=clerk
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...

// Environment-aware configuration
const authConfig = {
  development: {
    provider: 'mockauth',
    config: {
      port: process.env.MOCKAUTH_PORT,
      jwtSecret: process.env.MOCKAUTH_SECRET
    }
  },
  production: {
    provider: 'clerk',
    config: {
      secretKey: process.env.CLERK_SECRET_KEY,
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY
    }
  }
};
```

## 🎯 Migration Best Practices

### 1. **Gradual Migration**
```javascript
// Start with feature flags
const useProductionAuth = process.env.USE_PRODUCTION_AUTH === 'true';

export const authService = useProductionAuth 
  ? require('./clerk').authService
  : require('./mockauth').authService;
```

### 2. **A/B Testing**
```javascript
// Test both implementations
const authService = process.env.AUTH_PROVIDER === 'clerk'
  ? require('./clerk').authService
  : require('./mockauth').authService;
```

### 3. **Rollback Strategy**
```javascript
// Easy rollback
const authService = process.env.AUTH_PROVIDER === 'clerk'
  ? require('./clerk').authService
  : require('./mockauth').authService;

// Keep MockAuth as fallback
if (authService === 'clerk' && process.env.CLERK_FALLBACK === 'true') {
  authService = require('./mockauth').authService;
}
```

## 🎉 Success Stories

### "We migrated from MockAuth to Clerk in 2 days"
> "The migration was seamless. We kept the same API and just switched the provider. Our tests continued to work without any changes." - *Sarah, Frontend Developer*

### "MockAuth made our auth testing so much easier"
> "We could test complex auth flows without setting up a real auth system. When we were ready for production, the migration was straightforward." - *Mike, Full-Stack Developer*

### "The visual builder saved us hours"
> "Instead of writing configuration files, we used the visual builder. It was so much faster and less error-prone." - *Alex, DevOps Engineer*

---

**Ready to start your migration journey?**

```bash
# Generate your migration plan
npx mockauth migration-plan --to clerk

# Start the migration
npx mockauth migrate --to clerk --output ./src/auth/clerk.js
```

*MockAuth: Making authentication development and migration effortless.*
