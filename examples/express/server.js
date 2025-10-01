const express = require('express');
const cors = require('cors');
const { MockAuth } = require('mockauth');

const app = express();
const PORT = 3000;

// Initialize MockAuth
const mockAuth = new MockAuth({
  port: 3001,
  baseUrl: 'http://localhost:3001',
  jwtSecret: 'your-secret-key',
  users: [
    {
      email: 'admin@example.com',
      username: 'admin',
      password: 'admin123',
      roles: ['admin'],
      permissions: ['read:users', 'write:users', 'delete:users']
    },
    {
      email: 'user@example.com',
      username: 'user',
      password: 'password123',
      roles: ['user'],
      permissions: ['read:profile']
    }
  ]
});

// Start MockAuth server
mockAuth.start().then(() => {
  console.log('MockAuth server started');
}).catch(console.error);

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const user = await mockAuth.verifyToken(token);
    if (!user) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token verification failed' });
  }
};

// Role-based middleware
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user.roles.includes(role)) {
      return res.status(403).json({ error: `Role '${role}' required` });
    }
    next();
  };
};

// Permission-based middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: `Permission '${permission}' required` });
    }
    next();
  };
};

// Routes

// Public routes
app.get('/', (req, res) => {
  res.json({
    message: 'Express + MockAuth Example',
    endpoints: {
      public: '/public',
      protected: '/protected',
      admin: '/admin',
      users: '/users'
    }
  });
});

app.get('/public', (req, res) => {
  res.json({
    message: 'This is a public endpoint',
    timestamp: new Date().toISOString()
  });
});

// Protected routes
app.get('/protected', authenticateToken, (req, res) => {
  res.json({
    message: 'This is a protected endpoint',
    user: {
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
      roles: req.user.roles
    },
    timestamp: new Date().toISOString()
  });
});

// Admin-only routes
app.get('/admin', authenticateToken, requireRole('admin'), (req, res) => {
  res.json({
    message: 'This is an admin-only endpoint',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// User management routes
app.get('/users', authenticateToken, requirePermission('read:users'), async (req, res) => {
  try {
    const userService = mockAuth.getUserService();
    const users = await userService.getAllUsers();
    
    // Remove passwords from response
    const sanitizedUsers = users.map(user => {
      const { password, ...sanitizedUser } = user;
      return sanitizedUser;
    });

    res.json({
      message: 'User list retrieved successfully',
      users: sanitizedUsers,
      count: sanitizedUsers.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

app.post('/users', authenticateToken, requirePermission('write:users'), async (req, res) => {
  try {
    const { email, username, password, roles, permissions } = req.body;
    
    const user = await mockAuth.createUser({
      email,
      username,
      password,
      roles: roles || ['user'],
      permissions: permissions || ['read:profile']
    });

    // Remove password from response
    const { password: _, ...sanitizedUser } = user;

    res.status(201).json({
      message: 'User created successfully',
      user: sanitizedUser
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// User profile routes
app.get('/profile', authenticateToken, (req, res) => {
  res.json({
    message: 'User profile retrieved successfully',
    user: req.user
  });
});

app.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, profile } = req.body;
    const userService = mockAuth.getUserService();
    
    const updatedUser = await userService.updateUser(req.user.id, {
      username,
      profile
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove password from response
    const { password, ...sanitizedUser } = updatedUser;

    res.json({
      message: 'Profile updated successfully',
      user: sanitizedUser
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Stats endpoint
app.get('/stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const stats = await mockAuth.getStats();
    res.json({
      message: 'Stats retrieved successfully',
      stats
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`);
  console.log(`📚 MockAuth API available at http://localhost:3001`);
  console.log(`\nTest endpoints:`);
  console.log(`  GET  http://localhost:${PORT}/public`);
  console.log(`  GET  http://localhost:${PORT}/protected (requires auth)`);
  console.log(`  GET  http://localhost:${PORT}/admin (requires admin role)`);
  console.log(`  GET  http://localhost:${PORT}/users (requires read:users permission)`);
  console.log(`\nDemo credentials:`);
  console.log(`  Admin: admin@example.com / admin123`);
  console.log(`  User:  user@example.com / password123`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down servers...');
  await mockAuth.stop();
  process.exit(0);
});
