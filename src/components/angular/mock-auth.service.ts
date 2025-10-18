import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, catchError, tap } from 'rxjs/operators';

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

@Injectable({
  providedIn: 'root',
})
export class MockAuthService {
  private config: MockAuthConfig;
  private userSubject = new BehaviorSubject<MockAuthUser | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true);
  private refreshTimer?: any;

  public user$ = this.userSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.config = {
      baseUrl: 'http://localhost:3001',
      tokenKey: 'mockauth_token',
      userKey: 'mockauth_user',
      autoRefresh: true,
      refreshInterval: 300000, // 5 minutes
    };
  }

  // Initialize the service with configuration
  initialize(config: MockAuthConfig): void {
    this.config = { ...this.config, ...config };
    this.initializeAuth();
  }

  // Get current values
  get user(): MockAuthUser | null {
    return this.userSubject.value;
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.user && !!this.token;
  }

  // Initialize auth state from localStorage
  private async initializeAuth(): Promise<void> {
    try {
      const storedToken = localStorage.getItem(this.config.tokenKey!);
      const storedUser = localStorage.getItem(this.config.userKey!);

      if (storedToken && storedUser) {
        this.tokenSubject.next(storedToken);
        this.userSubject.next(JSON.parse(storedUser));

        // Verify token is still valid
        const isValid = await this.verifyToken(storedToken);
        if (!isValid) {
          await this.logout();
        } else if (this.config.autoRefresh) {
          this.startTokenRefresh();
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      await this.logout();
    } finally {
      this.loadingSubject.next(false);
    }
  }

  private verifyToken(token: string): Promise<boolean> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return this.http
      .get(`${this.config.baseUrl}/auth/verify`, { headers })
      .pipe(
        map(() => true),
        catchError(() => [false])
      )
      .toPromise() as Promise<boolean>;
  }

  // Login method
  login(email: string, password: string): Observable<LoginResponse> {
    this.loadingSubject.next(true);

    return this.http
      .post<LoginResponse>(`${this.config.baseUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            const { user, token } = response.data;

            this.userSubject.next(user);
            this.tokenSubject.next(token);

            localStorage.setItem(this.config.tokenKey!, token);
            localStorage.setItem(this.config.userKey!, JSON.stringify(user));

            if (this.config.autoRefresh) {
              this.startTokenRefresh();
            }
          }
        }),
        catchError((error) => {
          console.error('Login error:', error);
          return throwError(() => error);
        }),
        tap(() => this.loadingSubject.next(false))
      );
  }

  // Logout method
  logout(): Observable<void> {
    return new Observable((observer) => {
      try {
        if (this.token) {
          const headers = new HttpHeaders({
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          });

          this.http
            .post(`${this.config.baseUrl}/auth/logout`, {}, { headers })
            .subscribe({
              next: () => observer.next(),
              error: (error) => {
                console.error('Logout error:', error);
                observer.next();
              },
            });
        } else {
          observer.next();
        }
      } catch (error) {
        console.error('Logout error:', error);
        observer.next();
      } finally {
        this.clearAuthState();
        observer.complete();
      }
    });
  }

  // Register method
  register(userData: RegisterData): Observable<RegisterResponse> {
    this.loadingSubject.next(true);

    return this.http
      .post<RegisterResponse>(`${this.config.baseUrl}/auth/register`, userData)
      .pipe(
        catchError((error) => {
          console.error('Registration error:', error);
          return throwError(() => error);
        }),
        tap(() => this.loadingSubject.next(false))
      );
  }

  // Refresh token method
  refreshToken(): Observable<boolean> {
    if (!this.token) {
      return throwError(() => new Error('No token to refresh'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    });

    return this.http
      .post<LoginResponse>(
        `${this.config.baseUrl}/auth/refresh`,
        {},
        { headers }
      )
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            const newToken = response.data.token;
            this.tokenSubject.next(newToken);
            localStorage.setItem(this.config.tokenKey!, newToken);
            return true;
          }
          return false;
        }),
        catchError((error) => {
          console.error('Token refresh error:', error);
          return throwError(() => error);
        })
      );
  }

  // Update profile method
  updateProfile(
    profile: Partial<MockAuthUser['profile']>
  ): Observable<boolean> {
    if (!this.token || !this.user) {
      return throwError(() => new Error('Not authenticated'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    });

    return this.http
      .put<any>(
        `${this.config.baseUrl}/users/${this.user.id}`,
        { profile },
        { headers }
      )
      .pipe(
        map((response) => {
          if (response.success && this.user) {
            const updatedUser = {
              ...this.user,
              profile: { ...this.user.profile, ...profile },
            };
            this.userSubject.next(updatedUser);
            localStorage.setItem(
              this.config.userKey!,
              JSON.stringify(updatedUser)
            );
            return true;
          }
          return false;
        }),
        catchError((error) => {
          console.error('Profile update error:', error);
          return throwError(() => error);
        })
      );
  }

  // Role and permission checking methods
  hasRole(role: string): boolean {
    return this.user?.roles.includes(role) || false;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  hasAllRoles(roles: string[]): boolean {
    return roles.every((role) => this.hasRole(role));
  }

  hasPermission(permission: string): boolean {
    return this.user?.permissions.includes(permission) || false;
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
  }

  // Private helper methods
  private clearAuthState(): void {
    this.userSubject.next(null);
    this.tokenSubject.next(null);
    localStorage.removeItem(this.config.tokenKey!);
    localStorage.removeItem(this.config.userKey!);
    this.stopTokenRefresh();
  }

  private startTokenRefresh(): void {
    this.stopTokenRefresh();

    if (this.config.autoRefresh && this.config.refreshInterval) {
      this.refreshTimer = setInterval(() => {
        this.refreshToken().subscribe({
          next: (success) => {
            if (!success) {
              this.logout().subscribe();
            }
          },
          error: () => {
            this.logout().subscribe();
          },
        });
      }, this.config.refreshInterval);
    }
  }

  private stopTokenRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }
}
