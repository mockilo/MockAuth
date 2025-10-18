import React, { useState } from 'react';
import { useMockAuth, MockAuthConfig } from './MockAuthProvider';

// Login Form Component
export const MockAuthLoginForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useMockAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error || 'Login failed');
    }
    
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mockauth-login-form">
      <h2>Login</h2>
      
      {error && (
        <div className="mockauth-error">
          {error}
        </div>
      )}
      
      <div className="mockauth-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="mockauth-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

// Register Form Component
export const MockAuthRegisterForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useMockAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    const result = await register({
      email: formData.email,
      username: formData.username,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName
    });
    
    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error || 'Registration failed');
    }
    
    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="mockauth-register-form">
      <h2>Register</h2>
      
      {error && (
        <div className="mockauth-error">
          {error}
        </div>
      )}
      
      <div className="mockauth-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="mockauth-field">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="mockauth-field">
        <label htmlFor="firstName">First Name</label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          value={formData.firstName}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>
      
      <div className="mockauth-field">
        <label htmlFor="lastName">Last Name</label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          value={formData.lastName}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>
      
      <div className="mockauth-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="mockauth-field">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

// User Profile Component
export const MockAuthUserProfile: React.FC = () => {
  const { user, logout, updateProfile } = useMockAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(user?.profile || {});
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    const success = await updateProfile(profile);
    if (success) {
      setIsEditing(false);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!user) return null;

  return (
    <div className="mockauth-user-profile">
      <div className="mockauth-profile-header">
        <h3>Profile</h3>
        <button onClick={handleLogout} className="mockauth-logout-btn">
          Logout
        </button>
      </div>
      
      <div className="mockauth-profile-info">
        <div className="mockauth-field">
          <label>Email</label>
          <span>{user.email}</span>
        </div>
        
        <div className="mockauth-field">
          <label>Username</label>
          <span>{user.username}</span>
        </div>
        
        <div className="mockauth-field">
          <label>Roles</label>
          <span>{user.roles.join(', ')}</span>
        </div>
        
        {isEditing ? (
          <>
            <div className="mockauth-field">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                value={profile.firstName || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            
            <div className="mockauth-field">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                value={profile.lastName || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            
            <div className="mockauth-field">
              <label htmlFor="avatar">Avatar URL</label>
              <input
                id="avatar"
                type="url"
                value={profile.avatar || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, avatar: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            
            <div className="mockauth-actions">
              <button onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setIsEditing(false)} disabled={isLoading}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mockauth-field">
              <label>First Name</label>
              <span>{profile.firstName || 'Not set'}</span>
            </div>
            
            <div className="mockauth-field">
              <label>Last Name</label>
              <span>{profile.lastName || 'Not set'}</span>
            </div>
            
            {profile.avatar && (
              <div className="mockauth-field">
                <label>Avatar</label>
                <img src={profile.avatar} alt="Avatar" className="mockauth-avatar" />
              </div>
            )}
            
            <button onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Protected Route Component
export const MockAuthProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
}> = ({ children, requiredRoles, requiredPermissions, fallback }) => {
  const { isAuthenticated, user, isLoading } = useMockAuth();

  if (isLoading) {
    return <div className="mockauth-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return fallback || <div className="mockauth-unauthorized">Please log in to access this page.</div>;
  }

  if (requiredRoles && !requiredRoles.some(role => user?.roles.includes(role))) {
    return fallback || <div className="mockauth-forbidden">You don't have permission to access this page.</div>;
  }

  if (requiredPermissions && !requiredPermissions.every(permission => user?.permissions.includes(permission))) {
    return fallback || <div className="mockauth-forbidden">You don't have the required permissions.</div>;
  }

  return <>{children}</>;
};

// Auth Status Component
export const MockAuthStatus: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useMockAuth();

  if (isLoading) {
    return <div className="mockauth-status loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className="mockauth-status not-authenticated">Not logged in</div>;
  }

  return (
    <div className="mockauth-status authenticated">
      Welcome, {user?.profile?.firstName || user?.username}!
    </div>
  );
};

// Default CSS styles
export const MockAuthStyles: React.FC = () => (
  <style>{`
    .mockauth-login-form,
    .mockauth-register-form {
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
    }

    .mockauth-field {
      margin-bottom: 15px;
    }

    .mockauth-field label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
    }

    .mockauth-field input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .mockauth-field input:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }

    .mockauth-error {
      background-color: #fee;
      color: #c33;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 15px;
      border: 1px solid #fcc;
    }

    .mockauth-user-profile {
      max-width: 500px;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
    }

    .mockauth-profile-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .mockauth-logout-btn {
      background-color: #dc3545;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    }

    .mockauth-profile-info .mockauth-field {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }

    .mockauth-profile-info .mockauth-field:last-child {
      border-bottom: none;
    }

    .mockauth-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
    }

    .mockauth-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .mockauth-actions button {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;
    }

    .mockauth-actions button:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }

    .mockauth-status {
      padding: 10px;
      border-radius: 4px;
      text-align: center;
    }

    .mockauth-status.loading {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .mockauth-status.not-authenticated {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .mockauth-status.authenticated {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .mockauth-loading,
    .mockauth-unauthorized,
    .mockauth-forbidden {
      padding: 20px;
      text-align: center;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #f9f9f9;
    }

    .mockauth-unauthorized {
      border-color: #ffc107;
      background: #fff8e1;
    }

    .mockauth-forbidden {
      border-color: #dc3545;
      background: #f8d7da;
    }
  `}</style>
);
