# 🔄 MockAuth → Better-Auth Migration Guide

This guide shows you how to migrate from MockAuth to Better-Auth while keeping the same API interface.

## 🎯 Why Better-Auth?

Better-Auth is an excellent choice for production because it offers:
- **Open Source** - Full control and transparency
- **TypeScript First** - Excellent type safety
- **Modern Architecture** - Built for modern web applications
- **Flexible** - Supports multiple databases and providers
- **Secure** - Built with security best practices
- **Easy Migration** - Similar API to MockAuth

## 🚀 Quick Migration

### 1. **Generate Migration Files**
```bash
# Generate Better-Auth migration files
npx mockauth migrate-to better-auth --output ./src/auth

# This creates:
# - ./src/auth/better-auth.js (main migration file)
# - ./src/auth/package.json (dependencies)
# - ./src/auth/.env.template (environment variables)
```

### 2. **Install Dependencies**
```bash
cd src/auth
npm install
```

### 3. **Configure Environment**
```bash
# Copy and configure environment variables
cp .env.template .env

# Edit .env with your values
DATABASE_URL=postgresql://user:password@localhost:5432/database
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-here
```

## 🔧 Step-by-Step Migration

### Step 1: Development Setup (MockAuth)
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
  }
};
```

### Step 2: Production Setup (Better-Auth)
```javascript
// src/auth/better-auth.js
import { betterAuth } from 'better-auth';
import { betterAuthClient } from 'better-auth/client';

// Server-side configuration
const auth = betterAuth({
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  }
});

// Client-side configuration
export const authClient = betterAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000'
});

// MockAuth-compatible service interface
export const authService = {
  async login(email, password) {
    try {
      const session = await auth.api.signInEmail({
        body: { email, password }
      });
      
      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          roles: session.user.roles || ['user'],
          permissions: session.user.permissions || []
        },
        token: session.token,
        refreshToken: session.refreshToken,
        success: true
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  async verifyToken(token) {
    try {
      const session = await auth.api.getSession({
        headers: { authorization: `Bearer ${token}` }
      });
      return session.user;
    } catch (error) {
      return null;
    }
  }
};
```

### Step 3: Environment-Aware Service
```javascript
// src/auth/index.js
const isDevelopment = process.env.NODE_ENV === 'development';

export const authService = isDevelopment 
  ? require('./mockauth').authService
  : require('./better-auth').authService;

// Your app code never changes!
```

## 🎨 Framework Integration Examples

### React Integration
```jsx
// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { authService } from '../auth';

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

### Vue Integration
```vue
<!-- src/composables/useAuth.js -->
<script setup>
import { ref, onMounted } from 'vue';
import { authService } from '../auth';

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
</script>
```

### Express.js Integration
```javascript
// src/middleware/auth.js
import { authService } from '../auth';

export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const user = await authService.verifyToken(token);
    if (user) {
      req.user = user;
      next();
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Token verification failed' });
  }
};
```

## 🧪 Testing Your Migration

### 1. **Test Migration Compatibility**
```bash
# Test the migration
npx mockauth test-migration --from mockauth --to better-auth
```

### 2. **Unit Tests**
```javascript
// tests/auth.test.js
import { authService } from '../src/auth';

describe('Auth Service', () => {
  test('should login user', async () => {
    const result = await authService.login('test@example.com', 'password123');
    expect(result.success).toBe(true);
    expect(result.user.email).toBe('test@example.com');
  });

  test('should verify token', async () => {
    const result = await authService.login('test@example.com', 'password123');
    const user = await authService.verifyToken(result.token);
    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });
});
```

### 3. **Integration Tests**
```javascript
// tests/integration/auth.integration.test.js
import request from 'supertest';
import app from '../src/app';

describe('Auth Integration', () => {
  test('should handle login flow', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
  });
});
```

## 🚀 Deployment

### 1. **Environment Configuration**
```bash
# Production environment variables
DATABASE_URL=postgresql://user:password@prod-db:5432/database
GOOGLE_CLIENT_ID=prod-google-client-id
GOOGLE_CLIENT_SECRET=prod-google-client-secret
GITHUB_CLIENT_ID=prod-github-client-id
GITHUB_CLIENT_SECRET=prod-github-client-secret
BETTER_AUTH_URL=https://your-domain.com
BETTER_AUTH_SECRET=your-production-secret
```

### 2. **Database Setup**
```sql
-- Create database
CREATE DATABASE better_auth;

-- Better-Auth will create the necessary tables automatically
```

### 3. **Docker Configuration**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## 🔍 Advanced Configuration

### 1. **Custom Database Schema**
```javascript
const auth = betterAuth({
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL,
    schema: {
      user: 'public.users',
      session: 'public.sessions',
      account: 'public.accounts'
    }
  }
});
```

### 2. **Custom Session Configuration**
```javascript
const auth = betterAuth({
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7 // 7 days
    }
  }
});
```

### 3. **Advanced Security**
```javascript
const auth = betterAuth({
  advanced: {
    generateId: () => crypto.randomUUID(),
    crossSubdomainCookies: {
      enabled: true,
      domain: '.yourdomain.com'
    },
    useSecureCookies: process.env.NODE_ENV === 'production'
  }
});
```

## 🎉 Migration Benefits

### ✅ **What You Gain:**
- **Production Ready** - Battle-tested authentication
- **Better Security** - Enhanced security features
- **Scalability** - Handles high traffic loads
- **Flexibility** - Multiple database and provider support
- **Community** - Active open-source community
- **Type Safety** - Full TypeScript support

### ✅ **What Stays the Same:**
- **API Interface** - Same methods and responses
- **User Experience** - No changes to your app
- **Development Flow** - Same development process
- **Testing** - Same test patterns

## 🆘 Troubleshooting

### Common Issues:

**1. Database Connection Issues**
```bash
# Check database connection
npx mockauth health --database postgresql
```

**2. Environment Variables**
```bash
# Verify environment variables
npx mockauth validate-config --provider better-auth
```

**3. Migration Testing**
```bash
# Test migration step by step
npx mockauth test-migration --from mockauth --to better-auth --verbose
```

## 📚 Additional Resources

- [Better-Auth Documentation](https://better-auth.com)
- [Better-Auth GitHub](https://github.com/better-auth/better-auth)
- [MockAuth Migration Guide](docs/migration-guide.md)
- [Developer Experience Guide](docs/developer-experience.md)

---

**Ready to migrate to Better-Auth?**

```bash
# Start your migration
npx mockauth migrate-to better-auth --output ./src/auth

# Test the migration
npx mockauth test-migration --from mockauth --to better-auth

# Deploy to production
npm run deploy
```

*MockAuth + Better-Auth = Seamless authentication development and production!* 🚀
