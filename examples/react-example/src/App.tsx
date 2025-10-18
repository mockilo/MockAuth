import React, { useState } from 'react';
import { MockAuthProvider, useMockAuth } from 'mockauth/components/react/MockAuthProvider';
import { 
  MockAuthLoginForm, 
  MockAuthRegisterForm, 
  MockAuthUserProfile, 
  MockAuthStatus,
  MockAuthStyles 
} from 'mockauth/components/react/MockAuthComponents';
import './App.css';

const mockAuthConfig = {
  baseUrl: 'http://localhost:3001',
  autoRefresh: true,
  refreshInterval: 300000 // 5 minutes
};

function AppContent() {
  const { isAuthenticated, user } = useMockAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="App">
      <MockAuthStyles />
      
      <header className="App-header">
        <h1>MockAuth React Example</h1>
        <MockAuthStatus />
      </header>

      <main className="App-main">
        {!isAuthenticated ? (
          <div className="auth-section">
            <div className="auth-tabs">
              <button 
                className={showLogin ? 'active' : ''} 
                onClick={() => { setShowLogin(true); setShowRegister(false); }}
              >
                Login
              </button>
              <button 
                className={showRegister ? 'active' : ''} 
                onClick={() => { setShowRegister(true); setShowLogin(false); }}
              >
                Register
              </button>
            </div>

            {showLogin && (
              <MockAuthLoginForm onSuccess={() => setShowLogin(false)} />
            )}

            {showRegister && (
              <MockAuthRegisterForm onSuccess={() => setShowRegister(false)} />
            )}

            <div className="demo-credentials">
              <h3>Demo Credentials</h3>
              <p><strong>Admin:</strong> admin@example.com / admin123</p>
              <p><strong>User:</strong> user@example.com / user123</p>
            </div>
          </div>
        ) : (
          <div className="authenticated-section">
            <MockAuthUserProfile />
            
            <div className="user-info">
              <h3>User Information</h3>
              <p><strong>ID:</strong> {user?.id}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Username:</strong> {user?.username}</p>
              <p><strong>Roles:</strong> {user?.roles.join(', ')}</p>
              <p><strong>Permissions:</strong> {user?.permissions.join(', ')}</p>
            </div>

            <div className="api-examples">
              <h3>API Examples</h3>
              <p>Try these API calls with your authentication token:</p>
              <pre>{`// Get user profile
fetch('http://localhost:3001/users/${user?.id}', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})

// Get all users (admin only)
fetch('http://localhost:3001/users', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})

// Health check
fetch('http://localhost:3001/health')`}</pre>
            </div>
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>Powered by <a href="https://github.com/mockilo/mockauth" target="_blank" rel="noopener noreferrer">MockAuth</a></p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <MockAuthProvider config={mockAuthConfig}>
      <AppContent />
    </MockAuthProvider>
  );
}

export default App;
