import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { UserService } from '../services/UserService';
import { AuthService } from '../services/AuthService';
import { CreateUserRequest, UpdateUserRequest, PaginationOptions } from '../types';

export function createUserRoutes(
  userService: UserService,
  authService: AuthService,
  webhookService: any,
  auditService: any
): Router {
  const router = Router();

  // Middleware to verify admin access
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'No token provided',
        });
      }

      const user = await authService.verifyToken(token);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
        });
      }

      const isAdmin = await userService.hasRole(user.id, 'admin');
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required',
        });
      }

      req.user = user;
      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Authentication failed',
      });
    }
  };

  // Middleware to verify user access (own profile or admin)
  const requireUserAccess = async (req: any, res: any, next: any) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'No token provided',
        });
      }

      const user = await authService.verifyToken(token);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
        });
      }

      const isAdmin = await userService.hasRole(user.id, 'admin');
      const isOwnProfile = req.params.id === user.id;

      if (!isAdmin && !isOwnProfile) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }

      req.user = user;
      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Authentication failed',
      });
    }
  };

  // Get all users (admin only)
  router.get('/', requireAdmin, [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isString(),
    query('search').optional().isString(),
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const role = req.query.role as string;
      const search = req.query.search as string;

      let users = await userService.getAllUsers();

      // Filter by role
      if (role) {
        users = users.filter(user => user.roles.includes(role));
      }

      // Search
      if (search) {
        users = await userService.searchUsers(search, limit);
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = users.slice(startIndex, endIndex);

      // Remove passwords from response
      const sanitizedUsers = paginatedUsers.map(user => {
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
      });

      res.json({
        success: true,
        data: sanitizedUsers,
        pagination: {
          page,
          limit,
          total: users.length,
          pages: Math.ceil(users.length / limit),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get users',
      });
    }
  });

  // Get user by ID
  router.get('/:id', requireUserAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Remove password from response
      const { password, ...sanitizedUser } = user;

      res.json({
        success: true,
        data: sanitizedUser,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get user',
      });
    }
  });

  // Create user (admin only)
  router.post('/', requireAdmin, [
    body('email').isEmail().normalizeEmail(),
    body('username').isLength({ min: 3, max: 30 }),
    body('password').isLength({ min: 8 }),
    body('roles').optional().isArray(),
    body('permissions').optional().isArray(),
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const userData: CreateUserRequest = req.body;
      const user = await userService.createUser(userData);

      // Log audit event
      if (auditService) {
        await auditService.log({
          action: 'user.created',
          resource: 'users',
          details: { userId: user.id, email: user.email, success: true },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: true,
        });
      }

      // Send webhook
      if (webhookService) {
        await webhookService.send('user.created', {
          user: { id: user.id, email: user.email, username: user.username },
        });
      }

      // Remove password from response
      const { password, ...sanitizedUser } = user;

      res.status(201).json({
        success: true,
        data: sanitizedUser,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create user',
      });
    }
  });

  // Update user
  router.put('/:id', requireUserAccess, [
    body('username').optional().isLength({ min: 3, max: 30 }),
    body('profile').optional().isObject(),
    body('roles').optional().isArray(),
    body('permissions').optional().isArray(),
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { id } = req.params;
      const updates: UpdateUserRequest = req.body;

      const user = await userService.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Log audit event
      if (auditService) {
        await auditService.log({
          action: 'user.updated',
          resource: 'users',
          details: { userId: user.id, updates, success: true },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: true,
        });
      }

      // Send webhook
      if (webhookService) {
        await webhookService.send('user.updated', {
          user: { id: user.id, email: user.email, username: user.username },
        });
      }

      // Remove password from response
      const { password, ...sanitizedUser } = user;

      res.json({
        success: true,
        data: sanitizedUser,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update user',
      });
    }
  });

  // Delete user (admin only)
  router.delete('/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await userService.deleteUser(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Log audit event
      if (auditService) {
        await auditService.log({
          action: 'user.deleted',
          resource: 'users',
          details: { userId: id, success: true },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: true,
        });
      }

      // Send webhook
      if (webhookService) {
        await webhookService.send('user.deleted', {
          user: { id },
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete user',
      });
    }
  });

  // Get user stats (admin only)
  router.get('/stats/overview', requireAdmin, async (req, res) => {
    try {
      const stats = await userService.getUserStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get user stats',
      });
    }
  });

  // Search users (admin only)
  router.get('/search/query', requireAdmin, [
    query('q').isString().isLength({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ], async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;

      const users = await userService.searchUsers(query, limit);

      // Remove passwords from response
      const sanitizedUsers = users.map(user => {
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
      });

      res.json({
        success: true,
        data: sanitizedUsers,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to search users',
      });
    }
  });

  return router;
}
