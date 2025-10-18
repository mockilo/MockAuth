import { ref, computed, Ref } from 'vue';
import { MockAuthConfig, MockAuthUser, RegisterData } from './MockAuthPlugin';

export class MockAuthService {
  private config: MockAuthConfig;
  private userRef: Ref<MockAuthUser | null> = ref(null);
  private tokenRef: Ref<string | null> = ref(null);
  private isLoadingRef: Ref<boolean> = ref(true);

  constructor(config: MockAuthConfig) {
    this.config = config;
  }

  // Computed properties
  get isAuthenticated() {
    return computed(() => !!this.userRef.value && !!this.tokenRef.value);
  }

  get user() {
    return this.userRef;
  }

  get token() {
    return this.tokenRef;
  }

  get isLoading() {
    return this.isLoadingRef;
  }

  // Initialize auth state from localStorage
  async initialize(): Promise<void> {
    try {
      const storedToken = localStorage.getItem(
        this.config.tokenKey || 'mockauth_token'
      );
      const storedUser = localStorage.getItem(
        this.config.userKey || 'mockauth_user'
      );

      if (storedToken && storedUser) {
        this.tokenRef.value = storedToken;
        this.userRef.value = JSON.parse(storedUser);

        // Verify token is still valid
        const isValid = await this.verifyToken(storedToken);
        if (!isValid) {
          await this.logout();
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      await this.logout();
    } finally {
      this.isLoadingRef.value = false;
    }
  }

  private async verifyToken(tokenToVerify: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${tokenToVerify}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.isLoadingRef.value = true;

      const response = await fetch(`${this.config.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        const { user: userData, token: authToken } = data.data;

        this.userRef.value = userData;
        this.tokenRef.value = authToken;

        localStorage.setItem(
          this.config.tokenKey || 'mockauth_token',
          authToken
        );
        localStorage.setItem(
          this.config.userKey || 'mockauth_user',
          JSON.stringify(userData)
        );

        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    } finally {
      this.isLoadingRef.value = false;
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.tokenRef.value) {
        await fetch(`${this.config.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.tokenRef.value}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.userRef.value = null;
      this.tokenRef.value = null;
      localStorage.removeItem(this.config.tokenKey || 'mockauth_token');
      localStorage.removeItem(this.config.userKey || 'mockauth_user');
    }
  }

  async register(
    userData: RegisterData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.isLoadingRef.value = true;

      const response = await fetch(`${this.config.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    } finally {
      this.isLoadingRef.value = false;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      if (!this.tokenRef.value) return false;

      const response = await fetch(`${this.config.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.tokenRef.value}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        const newToken = data.data.token;
        this.tokenRef.value = newToken;
        localStorage.setItem(
          this.config.tokenKey || 'mockauth_token',
          newToken
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  async updateProfile(
    profile: Partial<MockAuthUser['profile']>
  ): Promise<boolean> {
    try {
      if (!this.tokenRef.value || !this.userRef.value) return false;

      const response = await fetch(
        `${this.config.baseUrl}/users/${this.userRef.value.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.tokenRef.value}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ profile }),
        }
      );

      const data = await response.json();

      if (data.success) {
        const updatedUser = {
          ...this.userRef.value,
          profile: { ...this.userRef.value.profile, ...profile },
        };
        this.userRef.value = updatedUser;
        localStorage.setItem(
          this.config.userKey || 'mockauth_user',
          JSON.stringify(updatedUser)
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  }

  // Helper methods for role and permission checking
  hasRole(role: string): boolean {
    return this.userRef.value?.roles.includes(role) || false;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  hasAllRoles(roles: string[]): boolean {
    return roles.every((role) => this.hasRole(role));
  }

  hasPermission(permission: string): boolean {
    return this.userRef.value?.permissions.includes(permission) || false;
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
  }
}
