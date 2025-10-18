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
    login: (email: string, password: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    logout: () => Promise<void>;
    register: (userData: RegisterData) => Promise<{
        success: boolean;
        error?: string;
    }>;
    refreshToken: () => Promise<boolean>;
    updateProfile: (profile: Partial<MockAuthUser['profile']>) => Promise<boolean>;
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
export declare const MockAuthPlugin: MockAuthPlugin;
export declare function useMockAuth(): MockAuthService;
export declare function useMockAuthRole(requiredRoles: string[]): any;
export declare function useMockAuthPermission(requiredPermissions: string[]): any;
export declare function createMockAuthPlugin(config: MockAuthConfig): MockAuthPlugin;
//# sourceMappingURL=MockAuthPlugin.d.ts.map