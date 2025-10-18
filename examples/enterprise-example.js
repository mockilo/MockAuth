const { MockAuth } = require('../dist/index.js');

// Enterprise configuration with SSO, RBAC, and Compliance
const enterpriseConfig = {
  port: 3001,
  baseUrl: 'http://localhost:3001',
  jwtSecret: 'enterprise-secret-key-2024-minimum-32-characters-required-for-jwt',
  tokenExpiry: '1h',
  refreshTokenExpiry: '7d',
  
  // Database configuration
  database: {
    type: 'sqlite',
    connectionString: './enterprise-mockauth.sqlite'
  },
  
  // Ecosystem services
  ecosystem: {
    mocktail: {
      enabled: true,
      outputPath: './enterprise-mock-data',
      seedCount: 1000
    },
    schemaghost: {
      enabled: true,
      port: 3002,
      endpoints: [
        { path: '/api/enterprise/users', method: 'GET', response: [] },
        { path: '/api/enterprise/departments', method: 'GET', response: [] },
        { path: '/api/enterprise/projects', method: 'GET', response: [] }
      ]
    }
  },
  
  // SSO Configuration
  sso: {
    enableSSO: true,
    ssoSecret: 'sso-secret-key-2024',
    callbackUrl: 'http://localhost:3001/sso/callback',
    providers: [
      {
        name: 'google',
        type: 'oauth2',
        clientId: 'mock-google-client-id',
        clientSecret: 'mock-google-client-secret',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scope: ['openid', 'email', 'profile'],
        redirectUri: 'http://localhost:3001/sso/callback/google'
      },
      {
        name: 'microsoft',
        type: 'oauth2',
        clientId: 'mock-microsoft-client-id',
        clientSecret: 'mock-microsoft-client-secret',
        authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
        scope: ['openid', 'email', 'profile'],
        redirectUri: 'http://localhost:3001/sso/callback/microsoft'
      }
    ]
  },
  
  // Advanced RBAC Configuration
  rbac: {
    enableHierarchicalRoles: true,
    enableResourceOwnership: true,
    enablePolicyEngine: true,
    defaultDeny: false,
    auditLogging: true
  },
  
  // Compliance Configuration
  compliance: {
    enableAuditLogging: true,
    auditRetentionDays: 90,
    enablePasswordPolicy: true,
    enableSessionMonitoring: true,
    enableDataEncryption: true,
    enableAccessControl: true,
    complianceStandards: ['GDPR', 'HIPAA', 'SOX', 'PCI-DSS'],
    reportingInterval: 30
  },
  
  // Enhanced security settings
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true
  },
  
  // Enterprise users with different roles
  users: [
    {
      email: 'ceo@enterprise.com',
      username: 'ceo',
      password: 'EnterpriseCEO2024!',
      roles: ['ceo', 'admin'],
      permissions: ['*'],
      profile: {
        firstName: 'John',
        lastName: 'CEO',
        avatar: 'https://i.pravatar.cc/150?img=1'
      }
    },
    {
      email: 'cto@enterprise.com',
      username: 'cto',
      password: 'EnterpriseCTO2024!',
      roles: ['cto', 'admin'],
      permissions: ['read', 'write', 'admin'],
      profile: {
        firstName: 'Sarah',
        lastName: 'CTO',
        avatar: 'https://i.pravatar.cc/150?img=2'
      }
    },
    {
      email: 'manager@enterprise.com',
      username: 'manager',
      password: 'EnterpriseManager2024!',
      roles: ['manager'],
      permissions: ['read', 'write'],
      profile: {
        firstName: 'Mike',
        lastName: 'Manager',
        avatar: 'https://i.pravatar.cc/150?img=3'
      }
    },
    {
      email: 'developer@enterprise.com',
      username: 'developer',
      password: 'EnterpriseDev2024!',
      roles: ['developer'],
      permissions: ['read'],
      profile: {
        firstName: 'Alex',
        lastName: 'Developer',
        avatar: 'https://i.pravatar.cc/150?img=4'
      }
    }
  ],
  
  // Enhanced CORS for enterprise
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
  },
  
  // Rate limiting for enterprise
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Higher limit for enterprise
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // Webhooks for enterprise integrations
  webhooks: {
    userRegistered: 'http://localhost:4000/webhooks/user-registered',
    userLoggedIn: 'http://localhost:4000/webhooks/user-logged-in',
    userLoggedOut: 'http://localhost:4000/webhooks/user-logged-out',
    passwordChanged: 'http://localhost:4000/webhooks/password-changed',
    accountLocked: 'http://localhost:4000/webhooks/account-locked'
  },
  
  enableMFA: true,
  enablePasswordReset: true,
  enableAccountLockout: true,
  maxLoginAttempts: 3,
  lockoutDuration: '30m',
  logLevel: 'info',
  enableAuditLog: true
};

async function startEnterpriseMockAuth() {
  console.log('🏢 Starting Enterprise MockAuth...');
  console.log('🔐 Features enabled:');
  console.log('   • SSO (Google, Microsoft)');
  console.log('   • Advanced RBAC with hierarchical roles');
  console.log('   • Compliance monitoring (GDPR, HIPAA, SOX, PCI-DSS)');
  console.log('   • Enhanced security policies');
  console.log('   • Enterprise-grade audit logging');
  console.log('   • Ecosystem integration (MockTail + SchemaGhost)');
  
  const auth = new MockAuth(enterpriseConfig);
  
  try {
    await auth.start();
    
    console.log('\n🎉 Enterprise MockAuth is running!');
    console.log('\n📚 Available Enterprise Endpoints:');
    console.log('   🔐 Authentication: http://localhost:3001/auth');
    console.log('   👥 User Management: http://localhost:3001/users');
    console.log('   🔑 Role Management: http://localhost:3001/roles');
    console.log('   🌐 SSO: http://localhost:3001/sso');
    console.log('   🛡️  RBAC: http://localhost:3001/rbac');
    console.log('   📊 Compliance: http://localhost:3001/compliance');
    console.log('   ❤️  Health Check: http://localhost:3001/health');
    console.log('   📈 Metrics: http://localhost:3001/metrics');
    console.log('   👻 SchemaGhost: http://localhost:3002');
    
    console.log('\n🔑 Enterprise Test Credentials:');
    console.log('   CEO: ceo@enterprise.com / EnterpriseCEO2024!');
    console.log('   CTO: cto@enterprise.com / EnterpriseCTO2024!');
    console.log('   Manager: manager@enterprise.com / EnterpriseManager2024!');
    console.log('   Developer: developer@enterprise.com / EnterpriseDev2024!');
    
    console.log('\n🧪 Enterprise Test Commands:');
    console.log('   # Test SSO providers');
    console.log('   curl http://localhost:3001/sso/providers');
    console.log('   # Test RBAC permission check');
    console.log('   curl -X POST http://localhost:3001/rbac/check -H "Content-Type: application/json" -d \'{"user":{"id":"1","roles":["admin"]},"action":"read","resource":{"id":"user1","type":"user"}}\'');
    console.log('   # Test compliance audit');
    console.log('   curl -X POST http://localhost:3001/compliance/audit -H "Content-Type: application/json" -d \'{"userId":"1","action":"login","resource":"auth","success":true}\'');
    console.log('   # Test enterprise API');
    console.log('   curl http://localhost:3002/api/enterprise/users');
    
    console.log('\n🔄 Server is running. Press Ctrl+C to stop.');
    
  } catch (error) {
    console.error('❌ Failed to start Enterprise MockAuth:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down Enterprise MockAuth...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down Enterprise MockAuth...');
  process.exit(0);
});

startEnterpriseMockAuth().catch(console.error);
