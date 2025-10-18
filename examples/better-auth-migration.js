// Better-Auth Migration Example
// This example shows how to migrate from MockAuth to Better-Auth

const { MockAuth } = require('mockauth');

// Step 1: Development setup with MockAuth
const mockAuth = new MockAuth({
  port: 3001,
  baseUrl: 'http://localhost:3001',
  jwtSecret: 'dev-secret-key-must-be-at-least-32-characters-long-for-security',
  users: [
    {
      email: 'admin@test.com',
      password: 'admin123',
      roles: ['admin'],
      permissions: ['read:users', 'write:users', 'delete:users']
    },
    {
      email: 'user@test.com',
      password: 'user123',
      roles: ['user'],
      permissions: ['read:profile']
    }
  ]
});

// Step 2: Production setup with Better-Auth
// (This would be in your production code)
const betterAuthConfig = {
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  }
};

// Step 3: Unified auth service that works with both
class AuthService {
  constructor(provider = 'mockauth') {
    this.provider = provider;
    this.mockAuth = provider === 'mockauth' ? mockAuth : null;
  }

  async login(email, password) {
    if (this.provider === 'mockauth') {
      // MockAuth implementation
      const result = await this.mockAuth.login(email, password);
      return {
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken,
        success: true
      };
    } else {
      // Better-Auth implementation (production)
      // This would use the Better-Auth client
      const response = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      return {
        user: data.user,
        token: data.token,
        refreshToken: data.refreshToken,
        success: data.success
      };
    }
  }

  async register(userData) {
    if (this.provider === 'mockauth') {
      // MockAuth implementation
      const user = await this.mockAuth.createUser(userData);
      return { user, success: true };
    } else {
      // Better-Auth implementation (production)
      const response = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      return { user: data.user, success: data.success };
    }
  }

  async verifyToken(token) {
    if (this.provider === 'mockauth') {
      // MockAuth implementation
      return await this.mockAuth.verifyToken(token);
    } else {
      // Better-Auth implementation (production)
      const response = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/session`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.user;
      }
      return null;
    }
  }

  async logout(token) {
    if (this.provider === 'mockauth') {
      // MockAuth implementation
      return { success: true };
    } else {
      // Better-Auth implementation (production)
      const response = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/sign-out`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      return { success: response.ok };
    }
  }
}

// Step 4: Environment-aware initialization
const authService = new AuthService(process.env.AUTH_PROVIDER || 'mockauth');

// Step 5: Usage examples
async function demonstrateMigration() {
  console.log('🚀 MockAuth to Better-Auth Migration Demo\n');

  // Start MockAuth for development
  if (process.env.AUTH_PROVIDER === 'mockauth') {
    await mockAuth.start();
    console.log('✅ MockAuth server started');
  }

  try {
    // Test login
    console.log('🔐 Testing login...');
    const loginResult = await authService.login('admin@test.com', 'admin123');
    console.log('Login result:', loginResult.success ? '✅ Success' : '❌ Failed');
    
    if (loginResult.success) {
      console.log('User:', loginResult.user.email);
      console.log('Roles:', loginResult.user.roles);
      
      // Test token verification
      console.log('\n🔍 Testing token verification...');
      const user = await authService.verifyToken(loginResult.token);
      console.log('Token verification:', user ? '✅ Valid' : '❌ Invalid');
      
      // Test logout
      console.log('\n🚪 Testing logout...');
      const logoutResult = await authService.logout(loginResult.token);
      console.log('Logout result:', logoutResult.success ? '✅ Success' : '❌ Failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Cleanup
    if (process.env.AUTH_PROVIDER === 'mockauth') {
      await mockAuth.stop();
      console.log('\n🛑 MockAuth server stopped');
    }
  }
}

// Step 6: Migration checklist
function showMigrationChecklist() {
  console.log('\n📋 Better-Auth Migration Checklist:');
  console.log('1. ✅ Install Better-Auth: npm install better-auth better-auth-client');
  console.log('2. ✅ Set up database (PostgreSQL/MySQL/SQLite)');
  console.log('3. ✅ Configure environment variables');
  console.log('4. ✅ Update your auth service to use Better-Auth');
  console.log('5. ✅ Test the migration thoroughly');
  console.log('6. ✅ Deploy to production');
  
  console.log('\n🔧 Environment Variables Needed:');
  console.log('DATABASE_URL=postgresql://user:password@localhost:5432/database');
  console.log('GOOGLE_CLIENT_ID=your-google-client-id');
  console.log('GOOGLE_CLIENT_SECRET=your-google-client-secret');
  console.log('GITHUB_CLIENT_ID=your-github-client-id');
  console.log('GITHUB_CLIENT_SECRET=your-github-client-secret');
  console.log('BETTER_AUTH_URL=http://localhost:3000');
  console.log('BETTER_AUTH_SECRET=your-secret-key-here');
}

// Run the demo
if (require.main === module) {
  demonstrateMigration()
    .then(() => showMigrationChecklist())
    .catch(console.error);
}

module.exports = { AuthService, mockAuth, betterAuthConfig };
