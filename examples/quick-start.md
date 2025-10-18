# 🚀 MockAuth Quick Start

## 30-Second Setup

```bash
# 1. Install MockAuth
npm install mockauth

# 2. Initialize project
npx mockauth init

# 3. Start server
npx mockauth start

# 🎉 Done! Your auth server is running at http://localhost:3001
```

## Test Your Auth Server

```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user1@example.com", "password": "password123"}'

# Register new user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com", "password": "newpass123", "username": "newuser"}'
```

## Frontend Integration

### React
```jsx
import { MockAuthProvider, useMockAuth } from 'mockauth/react';

function App() {
  return (
    <MockAuthProvider config={{ baseUrl: 'http://localhost:3001' }}>
      <LoginForm />
    </MockAuthProvider>
  );
}

function LoginForm() {
  const { login, user, isAuthenticated } = useMockAuth();
  
  if (isAuthenticated) {
    return <div>Welcome, {user.email}!</div>;
  }
  
  return (
    <button onClick={() => login('user1@example.com', 'password123')}>
      Login
    </button>
  );
}
```

### Vue
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
  login('user1@example.com', 'password123');
};
</script>
```

### Angular
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
    this.authService.login('user1@example.com', 'password123').subscribe();
  }
}
```

## Migration to Production

When you're ready for production:

```bash
# Generate Better-Auth migration
npx mockauth migrate-to better-auth --output ./src/auth/better-auth.js

# Generate Clerk migration
npx mockauth migrate-to clerk --output ./src/auth/clerk.js

# Generate Auth0 migration
npx mockauth migrate-to auth0 --output ./src/auth/auth0.js
```

## CLI Commands

```bash
# Start server
npx mockauth start

# Stop server
npx mockauth stop

# Health check
npx mockauth health

# Generate mock data
npx mockauth generate

# Run tests
npx mockauth test

# Visual builder
npx mockauth builder

# Migration tools
npx mockauth migrate-to better-auth
npx mockauth migrate-to clerk
npx mockauth migrate-to auth0
```

## That's It! 🎉

You now have a complete authentication system running in 30 seconds!

- ✅ **JWT tokens** working
- ✅ **User management** ready
- ✅ **Frontend integration** simple
- ✅ **Migration path** clear
- ✅ **FREE forever** - no hidden costs
