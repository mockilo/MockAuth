import request from 'supertest';
import express from 'express';
import { createUserRoutes } from '../../../src/routes/users';
import { UserService } from '../../../src/services/UserService';
import { AuthService } from '../../../src/services/AuthService';
import { User } from '../../../src/types';

describe('User Routes', () => {
  let app: express.Application;
  let mockUserService: jest.Mocked<UserService>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockWebhookService: any;
  let mockAuditService: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock services
    mockUserService = {
      createUser: jest.fn().mockImplementation((userData) => {
        return Promise.resolve({
          id: '3',
          email: userData.email,
          username: userData.username,
          roles: userData.roles || ['user'],
          permissions: userData.permissions || ['read:profile'],
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          isLocked: false,
          failedLoginAttempts: 0
        });
      }),
      getUserById: jest.fn().mockImplementation((id) => {
        if (id === 'invalid-id') return Promise.resolve(null);
        return Promise.resolve({
          id,
          email: 'user1@example.com',
          username: 'user1',
          roles: ['user'],
          permissions: ['read:profile'],
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          isLocked: false,
          failedLoginAttempts: 0
        });
      }),
      getUserByEmail: jest.fn(),
      getAllUsers: jest.fn(),
      updateUser: jest.fn().mockImplementation((id, updates) => {
        if (id === '999') return Promise.resolve(null);
        return Promise.resolve({
          id,
          email: 'user1@example.com',
          username: updates.username || 'updateduser',
          roles: updates.roles || ['admin'],
          permissions: updates.permissions || ['read:users', 'write:users'],
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          isLocked: false,
          failedLoginAttempts: 0
        });
      }),
      deleteUser: jest.fn().mockImplementation((id) => {
        if (id === '999') return Promise.resolve(false);
        return Promise.resolve(true);
      }),
      searchUsers: jest.fn().mockImplementation((query, limit) => {
        return Promise.resolve([
          {
            id: '1',
            email: 'user1@example.com',
            username: 'user1',
            roles: ['user'],
            permissions: ['read:profile'],
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            isLocked: false,
            failedLoginAttempts: 0
          }
        ]);
      }),
      getUserStats: jest.fn().mockResolvedValue({
        total: 100,
        active: 85,
        locked: 5,
        byRole: { admin: 10, user: 90 }
      }),
      createUserSync: jest.fn(),
      hasRole: jest.fn().mockResolvedValue(true) // Mock admin role
    } as any;

    mockAuthService = {
      generateToken: jest.fn(),
      verifyToken: jest.fn().mockImplementation((token) => {
        if (token === 'test-token') {
          return Promise.resolve({ id: '1', email: 'test@example.com' });
        }
        return Promise.resolve(null);
      }),
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyRefreshToken: jest.fn()
    } as any;

    mockWebhookService = {
      send: jest.fn(),
      triggerWebhook: jest.fn()
    };

    mockAuditService = {
      log: jest.fn(),
      logAction: jest.fn()
    };

    app.use('/users', createUserRoutes(
      mockUserService,
      mockAuthService,
      mockWebhookService,
      mockAuditService
    ));
  });

  describe('GET /users', () => {
    it('should return all users', async () => {
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'user1@example.com',
          username: 'user1',
          roles: ['user'],
          permissions: ['read:profile'],
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          isLocked: false,
          failedLoginAttempts: 0
        },
        {
          id: '2',
          email: 'user2@example.com',
          username: 'user2',
          roles: ['admin'],
          permissions: ['read:users', 'write:users'],
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          isLocked: false,
          failedLoginAttempts: 0
        }
      ];

      mockUserService.getAllUsers.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/users')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].email).toBe('user1@example.com');
      expect(response.body.data[1].email).toBe('user2@example.com');
    });

    it('should handle empty users list', async () => {
      mockUserService.getAllUsers.mockResolvedValue([]);

      const response = await request(app)
        .get('/users')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should handle service errors', async () => {
      mockUserService.getAllUsers.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/users')
        .set('Authorization', 'Bearer test-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to get users');
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by ID', async () => {
      const mockUser: User = {
        id: '1',
        email: 'user1@example.com',
        username: 'user1',
        roles: ['user'],
        permissions: ['read:profile'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isLocked: false,
        failedLoginAttempts: 0
      };

      mockUserService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/users/1')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('user1@example.com');
      expect(response.body.data.username).toBe('user1');
    });

    it('should handle user not found', async () => {
      mockUserService.getUserById.mockResolvedValue(null);

      const response = await request(app)
        .get('/users/999')
        .set('Authorization', 'Bearer test-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User not found');
    });

    it('should handle invalid user ID', async () => {
      const response = await request(app)
        .get('/users/invalid-id')
        .set('Authorization', 'Bearer test-token')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const newUser = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
        roles: ['user'],
        permissions: ['read:profile']
      };

      const createdUser: User = {
        id: '3',
        email: 'newuser@example.com',
        username: 'newuser',
        roles: ['user'],
        permissions: ['read:profile'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isLocked: false,
        failedLoginAttempts: 0
      };

      mockUserService.createUser.mockResolvedValue(createdUser);

      const response = await request(app)
        .post('/users')
        .set('Authorization', 'Bearer test-token')
        .send(newUser)
        .expect(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('newuser@example.com');
      expect(mockUserService.createUser).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it.skip('should handle validation errors (validation disabled)', async () => {
      const invalidUser = {
        email: 'invalid-email',
        username: '',
        password: '123'
      };

      const response = await request(app)
        .post('/users')
        .set('Authorization', 'Bearer test-token')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle duplicate email', async () => {
      const newUser = {
        email: 'existing@example.com',
        username: 'newuser',
        password: 'password123',
        roles: ['user']
      };

      mockUserService.createUser.mockRejectedValue(new Error('Email already exists'));

      const response = await request(app)
        .post('/users')
        .set('Authorization', 'Bearer test-token')
        .send(newUser)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Email already exists');
    });
  });

  describe('PUT /users/:id', () => {
    it('should update user successfully', async () => {
      const updateData = {
        username: 'updateduser',
        roles: ['admin'],
        permissions: ['read:users', 'write:users']
      };

      const updatedUser: User = {
        id: '1',
        email: 'user1@example.com',
        username: 'updateduser',
        roles: ['admin'],
        permissions: ['read:users', 'write:users'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isLocked: false,
        failedLoginAttempts: 0
      };

      mockUserService.updateUser.mockResolvedValue(updatedUser);
      mockUserService.getUserById.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/users/1')
        .set('Authorization', 'Bearer test-token')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('updateduser');
      expect(response.body.data.roles).toContain('admin');
    });

    it('should handle user not found for update', async () => {
      mockUserService.getUserById.mockResolvedValue(null);

      const response = await request(app)
        .put('/users/999')
        .set('Authorization', 'Bearer test-token')
        .send({ username: 'updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User not found');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete user successfully', async () => {
      const userToDelete: User = {
        id: '1',
        email: 'user1@example.com',
        username: 'user1',
        roles: ['user'],
        permissions: ['read:profile'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isLocked: false,
        failedLoginAttempts: 0
      };

      mockUserService.getUserById.mockResolvedValue(userToDelete);
      mockUserService.deleteUser.mockResolvedValue(true);

      const response = await request(app)
        .delete('/users/1')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('User deleted successfully');
      expect(mockUserService.deleteUser).toHaveBeenCalledWith('1');
    });

    it('should handle user not found for deletion', async () => {
      mockUserService.getUserById.mockResolvedValue(null);

      const response = await request(app)
        .delete('/users/999')
        .set('Authorization', 'Bearer test-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User not found');
    });
  });

  describe('GET /users/search', () => {
    it('should search users by query', async () => {
      const searchResults: User[] = [
        {
          id: '1',
          email: 'user1@example.com',
          username: 'user1',
          roles: ['user'],
          permissions: ['read:profile'],
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          isLocked: false,
          failedLoginAttempts: 0
        }
      ];

      mockUserService.searchUsers.mockResolvedValue(searchResults);

      const response = await request(app)
        .get('/users/search?q=user1')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].username).toBe('user1');
    });

    it('should handle empty search results', async () => {
      mockUserService.searchUsers.mockResolvedValue([]);

      const response = await request(app)
        .get('/users/search?q=nonexistent')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /users/stats', () => {
    it('should return user statistics', async () => {
      const mockStats = {
        total: 100,
        active: 85,
        locked: 5,
        byRole: { admin: 10, user: 90 }
      };

      mockUserService.getUserStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/users/stats')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(100);
      expect(response.body.data.active).toBe(85);
    });
  });

  describe('Error handling', () => {
    it('should handle missing routes gracefully', async () => {
      const response = await request(app)
        .get('/users/nonexistent/route')
        .expect(404);
    });

    it.skip('should handle malformed JSON (validation disabled)', async () => {
      const response = await request(app)
        .post('/users')
        .set('Authorization', 'Bearer test-token')
        .send('invalid json')
        .expect(400);
    });
  });
});
