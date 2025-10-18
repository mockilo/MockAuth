# Framework Integrations

MockAuth provides ready-to-use components and services for popular frontend frameworks, making it easy to integrate authentication into your applications.

## React Integration

### Installation

```bash
npm install mockauth react
```

### Basic Usage

```tsx
import React from 'react';
import { MockAuthProvider, useMockAuth } from 'mockauth/components/react/MockAuthProvider';
import { MockAuthLoginForm, MockAuthUserProfile } from 'mockauth/components/react/MockAuthComponents';

const App = () => {
  return (
    <MockAuthProvider config={{ baseUrl: 'http://localhost:3001' }}>
      <AuthApp />
    </MockAuthProvider>
  );
};

const AuthApp = () => {
  const { isAuthenticated, user } = useMockAuth();

  return (
    <div>
      {!isAuthenticated ? (
        <MockAuthLoginForm />
      ) : (
        <MockAuthUserProfile />
      )}
    </div>
  );
};
```

### Available Components

- **MockAuthProvider**: Context provider for authentication state
- **MockAuthLoginForm**: Pre-built login form
- **MockAuthRegisterForm**: Pre-built registration form
- **MockAuthUserProfile**: User profile management component
- **MockAuthStatus**: Authentication status display
- **MockAuthProtectedRoute**: Route protection component

### Hooks

- **useMockAuth()**: Access authentication state and methods
- **useMockAuthRole(roles)**: Check if user has required roles
- **useMockAuthPermission(permissions)**: Check if user has required permissions

### Example with Route Protection

```tsx
import { withMockAuth } from 'mockauth/components/react/MockAuthProvider';

const ProtectedPage = () => <div>Admin only content</div>;

export default withMockAuth(ProtectedPage, ['admin']);
```

## Vue 3 Integration

### Installation

```bash
npm install mockauth vue@^3.0.0
```

### Basic Usage

```js
import { createApp } from 'vue'
import { MockAuthPlugin } from 'mockauth/components/vue/MockAuthPlugin'
import App from './App.vue'

const app = createApp(App)

app.use(MockAuthPlugin, {
  baseUrl: 'http://localhost:3001',
  autoRefresh: true
})

app.mount('#app')
```

### Using in Components

```vue
<template>
  <div>
    <MockAuthComponents 
      :show-login="!isAuthenticated"
      :show-profile="isAuthenticated"
      @login-success="handleLoginSuccess"
    />
  </div>
</template>

<script>
import { useMockAuth } from 'mockauth/components/vue/MockAuthPlugin'
import MockAuthComponents from 'mockauth/components/vue/MockAuthComponents.vue'

export default {
  components: {
    MockAuthComponents
  },
  setup() {
    const mockAuth = useMockAuth()
    
    return {
      isAuthenticated: mockAuth.isAuthenticated,
      handleLoginSuccess: () => {
        console.log('Login successful!')
      }
    }
  }
}
</script>
```

### Composables

- **useMockAuth()**: Access authentication service
- **useMockAuthRole(roles)**: Reactive role checking
- **useMockAuthPermission(permissions)**: Reactive permission checking

## Angular Integration

### Installation

```bash
npm install mockauth @angular/core @angular/common @angular/forms @angular/router rxjs
```

### Module Setup

```typescript
import { NgModule } from '@angular/core';
import { MockAuthModule } from 'mockauth/components/angular/mock-auth.module';

@NgModule({
  imports: [
    MockAuthModule.forRoot({
      baseUrl: 'http://localhost:3001',
      autoRefresh: true,
      refreshInterval: 300000
    })
  ]
})
export class AppModule { }
```

### Service Usage

```typescript
import { Component, OnInit } from '@angular/core';
import { MockAuthService } from 'mockauth/components/angular/mock-auth.service';

@Component({
  selector: 'app-login',
  template: `
    <mock-auth-login (loginSuccess)="onLoginSuccess()"></mock-auth-login>
  `
})
export class LoginComponent implements OnInit {
  constructor(private mockAuthService: MockAuthService) {}

  ngOnInit() {
    this.mockAuthService.initialize({
      baseUrl: 'http://localhost:3001'
    });
  }

  onLoginSuccess() {
    console.log('Login successful!');
  }
}
```

### Available Components

- **mock-auth-login**: Login form component
- **mock-auth-register**: Registration form component
- **mock-auth-profile**: User profile component
- **mock-auth-status**: Authentication status component

### Guards

- **MockAuthGuard**: Basic authentication guard
- **MockAuthRoleGuard**: Role-based route protection
- **MockAuthPermissionGuard**: Permission-based route protection

### Route Protection

```typescript
import { Routes } from '@angular/router';
import { MockAuthGuard, MockAuthRoleGuard } from 'mockauth/components/angular/guards/mock-auth.guard';

const routes: Routes = [
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [MockAuthRoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [MockAuthGuard]
  }
];
```

## Configuration Options

All framework integrations support the following configuration options:

```typescript
interface MockAuthConfig {
  baseUrl: string;                    // MockAuth server URL
  tokenKey?: string;                  // localStorage key for token (default: 'mockauth_token')
  userKey?: string;                   // localStorage key for user (default: 'mockauth_user')
  autoRefresh?: boolean;              // Auto-refresh tokens (default: true)
  refreshInterval?: number;           // Refresh interval in ms (default: 300000)
}
```

## Examples

Complete working examples are available in the `examples/` directory:

- **React Example**: `examples/react-example/`
- **Vue Example**: `examples/vue-example/`
- **Angular Example**: `examples/angular-example/`

To run an example:

```bash
# Start MockAuth server
npm start

# In another terminal, run the example
cd examples/react-example
npm install
npm start
```

## TypeScript Support

All framework integrations include full TypeScript support with:

- Type definitions for all components and services
- IntelliSense support in your IDE
- Compile-time type checking
- Generic type parameters for custom user types

## Customization

### Custom Styling

All components include default CSS that can be overridden:

```css
/* Override default styles */
.mockauth-login-form {
  max-width: 500px;
  background: #f8f9fa;
}

.mockauth-submit-btn {
  background-color: #28a745;
}
```

### Custom User Types

```typescript
interface CustomUser {
  id: string;
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
  customField: string; // Your custom fields
}

// Use with React
const { user } = useMockAuth<CustomUser>();

// Use with Vue
const mockAuth = useMockAuth<CustomUser>();

// Use with Angular
constructor(private mockAuthService: MockAuthService<CustomUser>) {}
```

## Best Practices

1. **Error Handling**: Always handle authentication errors gracefully
2. **Loading States**: Show loading indicators during authentication operations
3. **Token Refresh**: Enable auto-refresh for better user experience
4. **Route Protection**: Use guards to protect sensitive routes
5. **Type Safety**: Leverage TypeScript for better development experience

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure MockAuth server allows your frontend origin
2. **Token Expiry**: Check token expiry settings and refresh logic
3. **Route Guards**: Verify guard configuration and user permissions
4. **Build Errors**: Ensure all peer dependencies are installed

### Debug Mode

Enable debug logging:

```typescript
const config = {
  baseUrl: 'http://localhost:3001',
  debug: true // Enable debug logging
};
```

For more help, check the [GitHub Issues](https://github.com/mockilo/mockauth/issues) or [Documentation](https://mockauth.dev/docs).
