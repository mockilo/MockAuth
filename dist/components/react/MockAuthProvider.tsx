import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
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

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

export const useMockAuth = (): MockAuthContextType => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
};

interface MockAuthProviderProps {
  children: ReactNode;
  config: MockAuthConfig;
}

export const MockAuthProvider: React.FC<MockAuthProviderProps> = ({ children, config }) => {
  const [user, setUser] = useState<MockAuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const tokenKey = config.tokenKey || 'mockauth_token';
  const userKey = config.userKey || 'mockauth_user';

  const isAuthenticated = !!user && !!token;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem(tokenKey);
        const storedUser = localStorage.getItem(userKey);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify token is still valid
          const isValid = await verifyToken(storedToken);
          if (!isValid) {
            await logout();
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        await logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token
  useEffect(() => {
    if (!config.autoRefresh || !token) return;

    const interval = setInterval(async () => {
      const success = await refreshToken();
      if (!success) {
        await logout();
      }
    }, config.refreshInterval || 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [token, config.autoRefresh, config.refreshInterval]);

  const verifyToken = async (tokenToVerify: string): Promise<boolean> => {
    try {
      const response = await fetch(`${config.baseUrl}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${config.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        const { user: userData, token: authToken } = data.data;
        
        setUser(userData);
        setToken(authToken);
        
        localStorage.setItem(tokenKey, authToken);
        localStorage.setItem(userKey, JSON.stringify(userData));
        
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (token) {
        await fetch(`${config.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${config.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
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
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      if (!token) return false;

      const response = await fetch(`${config.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        const newToken = data.data.token;
        setToken(newToken);
        localStorage.setItem(tokenKey, newToken);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  const updateProfile = async (profile: Partial<MockAuthUser['profile']>): Promise<boolean> => {
    try {
      if (!token || !user) return false;

      const response = await fetch(`${config.baseUrl}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ profile })
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser = { ...user, profile: { ...user.profile, ...profile } };
        setUser(updatedUser);
        localStorage.setItem(userKey, JSON.stringify(updatedUser));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  const contextValue: MockAuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    refreshToken,
    updateProfile
  };

  return (
    <MockAuthContext.Provider value={contextValue}>
      {children}
    </MockAuthContext.Provider>
  );
};

// Higher-order component for protecting routes
export const withMockAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: string[]
) => {
  return (props: P) => {
    const { isAuthenticated, user, isLoading } = useMockAuth();

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      return <div>Please log in to access this page.</div>;
    }

    if (requiredRoles && !requiredRoles.some(role => user?.roles.includes(role))) {
      return <div>You don't have permission to access this page.</div>;
    }

    return <Component {...props} />;
  };
};

// Hook for role-based access control
export const useMockAuthRole = (requiredRoles: string[]): boolean => {
  const { user } = useMockAuth();
  
  if (!user) return false;
  
  return requiredRoles.some(role => user.roles.includes(role));
};

// Hook for permission-based access control
export const useMockAuthPermission = (requiredPermissions: string[]): boolean => {
  const { user } = useMockAuth();
  
  if (!user) return false;
  
  return requiredPermissions.every(permission => user.permissions.includes(permission));
};
