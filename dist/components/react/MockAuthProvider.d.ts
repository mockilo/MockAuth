import React, { ReactNode } from 'react';
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
export interface MockAuthContextType {
    user: MockAuthUser | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
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
export interface MockAuthConfig {
    baseUrl: string;
    tokenKey?: string;
    userKey?: string;
    autoRefresh?: boolean;
    refreshInterval?: number;
}
export declare const useMockAuth: () => MockAuthContextType;
interface MockAuthProviderProps {
    children: ReactNode;
    config: MockAuthConfig;
}
export declare const MockAuthProvider: React.FC<MockAuthProviderProps>;
export declare const withMockAuth: <P extends object>(Component: React.ComponentType<P>, requiredRoles?: string[]) => (props: P) => import("react/jsx-runtime").JSX.Element;
export declare const useMockAuthRole: (requiredRoles: string[]) => boolean;
export declare const useMockAuthPermission: (requiredPermissions: string[]) => boolean;
export {};
//# sourceMappingURL=MockAuthProvider.d.ts.map