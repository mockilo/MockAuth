import { Ref } from 'vue';
import { MockAuthConfig, MockAuthUser, RegisterData } from './MockAuthPlugin';
export declare class MockAuthService {
    private config;
    private userRef;
    private tokenRef;
    private isLoadingRef;
    constructor(config: MockAuthConfig);
    get isAuthenticated(): import("vue").ComputedRef<boolean>;
    get user(): Ref<MockAuthUser | null, MockAuthUser | null>;
    get token(): Ref<string | null, string | null>;
    get isLoading(): Ref<boolean, boolean>;
    initialize(): Promise<void>;
    private verifyToken;
    login(email: string, password: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    logout(): Promise<void>;
    register(userData: RegisterData): Promise<{
        success: boolean;
        error?: string;
    }>;
    refreshToken(): Promise<boolean>;
    updateProfile(profile: Partial<MockAuthUser['profile']>): Promise<boolean>;
    hasRole(role: string): boolean;
    hasAnyRole(roles: string[]): boolean;
    hasAllRoles(roles: string[]): boolean;
    hasPermission(permission: string): boolean;
    hasAnyPermission(permissions: string[]): boolean;
    hasAllPermissions(permissions: string[]): boolean;
}
//# sourceMappingURL=MockAuthService.d.ts.map