const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { MockAuth } = require('../../dist/index.js');
const http = require('http');

const app = express();
const PORT = process.argv.includes('--port') ? 
  parseInt(process.argv[process.argv.indexOf('--port') + 1]) : 3000;
// Auto-detect MockAuth server port
let MOCKAUTH_PORT = 3001; // Default fallback

// Try to read from config file first
const fs = require('fs');
const configPath = path.join(__dirname, '../../mockauth.config.js');

try {
  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const configMatch = configContent.match(/port:\s*(\d+)/);
    if (configMatch) {
      MOCKAUTH_PORT = parseInt(configMatch[1]);
      console.log(`🔍 Found MockAuth config with port ${MOCKAUTH_PORT}`);
    }
  }
} catch (err) {
  console.warn('Could not read config file:', err.message);
}

// Allow environment variable override
if (process.env.MOCKAUTH_PORT) {
  MOCKAUTH_PORT = parseInt(process.env.MOCKAUTH_PORT);
  console.log(`🔧 Using environment variable port ${MOCKAUTH_PORT}`);
}

// Read users from mock-data/users.json
const usersPath = path.join(__dirname, '../../mock-data/users.json');
let users = [];

try {
  if (fs.existsSync(usersPath)) {
    users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  }
} catch (err) {
  console.warn('Could not load users from file:', err.message);
}

console.log(`🔗 Connecting to MockAuth API on http://localhost:${MOCKAUTH_PORT}`);

// Test connection to MockAuth server
function testMockAuthConnection() {
  const req = http.get(`http://localhost:${MOCKAUTH_PORT}/health`, (res) => {
    if (res.statusCode === 200) {
      console.log(`✅ Successfully connected to MockAuth server on port ${MOCKAUTH_PORT}`);
    } else {
      console.warn(`⚠️  MockAuth server responded with status ${res.statusCode}`);
    }
  });
  
  req.on('error', (error) => {
    console.warn(`⚠️  Could not connect to MockAuth server on port ${MOCKAUTH_PORT}. Make sure MockAuth is running.`);
    console.warn(`   You can start MockAuth with: npm start or node start-server.js`);
  });
  
  req.setTimeout(3000, () => {
    console.warn(`⚠️  Connection timeout to MockAuth server on port ${MOCKAUTH_PORT}`);
    req.destroy();
  });
}

// Test connection on startup
testMockAuthConnection();

// MockAuth server instance for Visual Builder
let mockAuthServer = null;
let mockAuthPort = MOCKAUTH_PORT;

// Check if MockAuth server is already running
async function checkMockAuthServer() {
  try {
    const req = http.get(`http://localhost:${mockAuthPort}/health`, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ MockAuth server is already running on port ${mockAuthPort}`);
        console.log(`🔗 MockAuth API: http://localhost:${mockAuthPort}`);
        console.log(`📚 MockAuth Dashboard: http://localhost:${mockAuthPort}/dashboard`);
        return true;
      }
    });
    
    req.on('error', (error) => {
      console.log('💡 No MockAuth server detected - Visual Builder will work in configuration mode');
      console.log('🔧 You can start MockAuth server separately or use the builder to configure it');
    });
    
    req.setTimeout(2000, () => {
      console.log('💡 No MockAuth server detected - Visual Builder will work in configuration mode');
      console.log('🔧 You can start MockAuth server separately or use the builder to configure it');
      req.destroy();
    });
  } catch (error) {
    console.log('💡 No MockAuth server detected - Visual Builder will work in configuration mode');
    console.log('🔧 You can start MockAuth server separately or use the builder to configure it');
  }
}

// Check for existing MockAuth server
checkMockAuthServer();

// Mock API endpoints for Visual Builder (no proxy needed)
app.get('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'MockAuth server not running - using local configuration'
  });
});

app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: users,
    message: 'MockAuth server not running - using local configuration'
  });
});

// Local API endpoints for Visual Builder (no proxy needed)
app.get('/api/builder/users', (req, res) => {
  // Return mock users for the builder
  const mockUsers = users.map((user, index) => ({
    id: index + 1,
    email: user.email,
    username: user.username,
    roles: user.roles || ['user'],
    permissions: user.permissions || ['read:profile'],
    createdAt: new Date().toISOString()
  }));
  
  res.json({
    success: true,
    data: mockUsers
  });
});

app.post('/api/builder/users/bulk', express.json(), (req, res) => {
  // Handle bulk user operations
  res.json({
    success: true,
    message: 'Users synced successfully'
  });
});

app.delete('/api/builder/users/:id', (req, res) => {
  // Handle user deletion
  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

app.get('/api/builder/test', (req, res) => {
  // Test endpoint
  res.json({
    success: true,
    message: 'Builder API is working'
  });
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Handle login page redirects - serve the builder interface instead
app.get('/login', (req, res) => {
  res.redirect('/');
});

app.get('/dashboard', (req, res) => {
  res.redirect('/');
});

// Catch-all route for any other paths - serve the builder interface
app.get('*', (req, res) => {
  // If it's an API request, let it fall through to the proxy
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // For all other requests, serve the builder interface
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to start MockAuth with generated config
app.post('/api/start-mockauth', express.json(), async (req, res) => {
  try {
    const config = req.body;
    
    // Validate required fields
    if (!config.port || !config.baseUrl || !config.jwtSecret) {
      return res.status(400).json({ 
        error: 'Missing required configuration fields' 
      });
    }

    // Start MockAuth with the provided configuration
    const auth = new MockAuth(config);
    await auth.start();
    
    res.json({ 
      success: true, 
      message: 'MockAuth started successfully',
      url: config.baseUrl,
      port: config.port
    });
    
  } catch (error) {
    console.error('Error starting MockAuth:', error);
    res.status(500).json({ 
      error: 'Failed to start MockAuth',
      message: error.message 
    });
  }
});

// API endpoint to test configuration
app.post('/api/test-config', express.json(), (req, res) => {
  try {
    const config = req.body;
    
    // Basic validation
    const errors = [];
    
    if (!config.port || config.port < 1000 || config.port > 65535) {
      errors.push('Port must be between 1000 and 65535');
    }
    
    if (!config.baseUrl || !config.baseUrl.startsWith('http')) {
      errors.push('Base URL must be a valid HTTP URL');
    }
    
    // FIXED: Updated to match actual validation requirement (32 chars)
    if (!config.jwtSecret || config.jwtSecret.length < 32) {
      errors.push(`JWT Secret must be at least 32 characters (current: ${config.jwtSecret?.length || 0})`);
    }
    
    if (config.users && config.users.length > 0) {
      config.users.forEach((user, index) => {
        if (!user.email || !user.password) {
          errors.push(`User ${index + 1}: Email and password are required`);
        }
      });
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        valid: false, 
        errors 
      });
    }
    
    res.json({ 
      valid: true, 
      message: 'Configuration is valid' 
    });
    
  } catch (error) {
    res.status(500).json({ 
      valid: false, 
      error: 'Failed to validate configuration',
      message: error.message 
    });
  }
});

// API endpoint to get MockAuth status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    service: 'MockAuth Flow Builder',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve the main HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'forgot-password.html'));
});

app.get('/builder', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server with port conflict handling
const server = app.listen(PORT, () => {
  console.log(`🎨 MockAuth Flow Builder running on http://localhost:${PORT}`);
  console.log(`📚 Open your browser and navigate to http://localhost:${PORT}`);
  console.log(`🔧 Use the visual builder to configure MockAuth`);
  console.log(`🔗 Auto-detected MockAuth server on port ${MOCKAUTH_PORT}`);
});

// Handle port conflicts
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️  Port ${PORT} is already in use`);
    console.log(`🔄 Trying alternative port ${PORT + 1}...`);
    
    const altServer = app.listen(PORT + 1, () => {
      console.log(`🎨 MockAuth Flow Builder running on http://localhost:${PORT + 1}`);
      console.log(`📚 Open your browser and navigate to http://localhost:${PORT + 1}`);
      console.log(`🔧 Use the visual builder to configure MockAuth`);
    });
    
    altServer.on('error', (altErr) => {
      console.error(`❌ Could not start Visual Builder on ports ${PORT} or ${PORT + 1}`);
      console.error(`💡 Please stop other services or use a different port`);
      process.exit(1);
    });
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

module.exports = app;
