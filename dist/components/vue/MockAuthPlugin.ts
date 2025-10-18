import { App } from 'vue';
import { MockAuthService } from './MockAuthService';

export interface MockAuthConfig {
  baseUrl: string;
  tokenKey?: string;
  userKey?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface MockAuthUser {
  id: string;
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

export interface MockAuthState {
  user: MockAuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface MockAuthMethods {
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (
    userData: RegisterData
  ) => Promise<{ success: boolean; error?: string }>;
  refreshToken: () => Promise<boolean>;
  updateProfile: (
    profile: Partial<MockAuthUser['profile']>
  ) => Promise<boolean>;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export type MockAuthPlugin = {
  install: (app: App, config: MockAuthConfig) => void;
  $mockAuth: MockAuthService;
};

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $mockAuth: MockAuthService;
  }
}

export const MockAuthPlugin: MockAuthPlugin = {
  install(app: App, config: MockAuthConfig) {
    const mockAuthService = new MockAuthService(config);

    app.config.globalProperties.$mockAuth = mockAuthService;
    app.provide('mockAuth', mockAuthService);

    // Initialize auth state
    mockAuthService.initialize();
  },
  $mockAuth: null as any,
};

// Composable for using MockAuth in Composition API
export function useMockAuth(): MockAuthService {
  const { inject } = require('vue');
  const mockAuth = inject('mockAuth');

  if (!mockAuth) {
    throw new Error(
      'MockAuth plugin not installed. Make sure to use app.use(MockAuthPlugin, config)'
    );
  }

  return mockAuth;
}

// Composable for role-based access control
export function useMockAuthRole(requiredRoles: string[]) {
  const { computed } = require('vue');
  const mockAuth = useMockAuth();

  return computed(() => {
    if (!mockAuth.user.value) return false;
    return requiredRoles.some((role) =>
      mockAuth.user.value?.roles.includes(role)
    );
  });
}

// Composable for permission-based access control
export function useMockAuthPermission(requiredPermissions: string[]) {
  const { computed } = require('vue');
  const mockAuth = useMockAuth();

  return computed(() => {
    if (!mockAuth.user.value) return false;
    return requiredPermissions.every((permission) =>
      mockAuth.user.value?.permissions.includes(permission)
    );
  });
}

// Helper function to create the plugin
export function createMockAuthPlugin(config: MockAuthConfig): MockAuthPlugin {
  return {
    ...MockAuthPlugin,
    install(app: App) {
      MockAuthPlugin.install(app, config);
    },
  };
}
