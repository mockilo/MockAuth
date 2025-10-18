import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
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
export interface MockAuthConfig {
    baseUrl: string;
    tokenKey?: string;
    userKey?: string;
    autoRefresh?: boolean;
    refreshInterval?: number;
}
export interface RegisterData {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
}
export interface LoginResponse {
    success: boolean;
    data?: {
        user: MockAuthUser;
        token: string;
    };
    error?: string;
}
export interface RegisterResponse {
    success: boolean;
    error?: string;
}
export declare class MockAuthService {
    private http;
    private config;
    private userSubject;
    private tokenSubject;
    private loadingSubject;
    private refreshTimer?;
    user$: Observable<MockAuthUser | null>;
    token$: Observable<string | null>;
    loading$: Observable<boolean>;
    constructor(http: HttpClient);
    initialize(config: MockAuthConfig): void;
    get user(): MockAuthUser | null;
    get token(): string | null;
    get isLoading(): boolean;
    get isAuthenticated(): boolean;
    private initializeAuth;
    private verifyToken;
    login(email: string, password: string): Observable<LoginResponse>;
    logout(): Observable<void>;
    register(userData: RegisterData): Observable<RegisterResponse>;
    refreshToken(): Observable<boolean>;
    updateProfile(profile: Partial<MockAuthUser['profile']>): Observable<boolean>;
    hasRole(role: string): boolean;
    hasAnyRole(roles: string[]): boolean;
    hasAllRoles(roles: string[]): boolean;
    hasPermission(permission: string): boolean;
    hasAnyPermission(permissions: string[]): boolean;
    hasAllPermissions(permissions: string[]): boolean;
    private clearAuthState;
    private startTokenRefresh;
    private stopTokenRefresh;
}
//# sourceMappingURL=mock-auth.service.d.ts.map