import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { UserService } from '../services/UserService';
import { AuthService } from '../services/AuthService';
import { Role, Permission, WebhookService, AuditService } from '../types';

export function createRoleRoutes(
  userService: UserService,
  authService: AuthService,
  webhookService: WebhookService | null,
  auditService: AuditService | null
): Router {
  const router = Router();

  // Mock roles and permissions data
  const roles: Map<string, Role> = new Map();
  const permissions: Map<string, Permission> = new Map();

  // Initialize default roles and permissions
  const defaultRoles: Role[] = [
    {
      name: 'admin',
      description: 'Administrator with full access',
      permissions: [
        'read:users',
        'write:users',
        'delete:users',
        'read:roles',
        'write:roles',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'user',
      description: 'Regular user',
      permissions: ['read:profile', 'write:profile'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'moderator',
      description: 'Content moderator',
      permissions: ['read:users', 'write:content', 'delete:content'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const defaultPermissions: Permission[] = [
    {
      name: 'read:users',
      description: 'Read user information',
      resource: 'users',
      action: 'read',
      createdAt: new Date(),
    },
    {
      name: 'write:users',
      description: 'Create and update users',
      resource: 'users',
      action: 'write',
      createdAt: new Date(),
    },
    {
      name: 'delete:users',
      description: 'Delete users',
      resource: 'users',
      action: 'delete',
      createdAt: new Date(),
    },
    {
      name: 'read:profile',
      description: 'Read own profile',
      resource: 'profile',
      action: 'read',
      createdAt: new Date(),
    },
    {
      name: 'write:profile',
      description: 'Update own profile',
      resource: 'profile',
      action: 'write',
      createdAt: new Date(),
    },
    {
      name: 'read:roles',
      description: 'Read roles and permissions',
      resource: 'roles',
      action: 'read',
      createdAt: new Date(),
    },
    {
      name: 'write:roles',
      description: 'Create and update roles',
      resource: 'roles',
      action: 'write',
      createdAt: new Date(),
    },
    {
      name: 'write:content',
      description: 'Create and update content',
      resource: 'content',
      action: 'write',
      createdAt: new Date(),
    },
    {
      name: 'delete:content',
      description: 'Delete content',
      resource: 'content',
      action: 'delete',
      createdAt: new Date(),
    },
  ];

  // Initialize data
  defaultRoles.forEach((role) => roles.set(role.name, role));
  defaultPermissions.forEach((permission) =>
    permissions.set(permission.name, permission)
  );

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

  // Get all roles
  router.get('/', async (req, res) => {
    try {
      const rolesList = Array.from(roles.values());
      res.json({
        success: true,
        data: rolesList,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get roles',
      });
    }
  });

  // Get role by name
  router.get('/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const role = roles.get(name);

      if (!role) {
        return res.status(404).json({
          success: false,
          error: 'Role not found',
        });
      }

      res.json({
        success: true,
        data: role,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get role',
      });
    }
  });

  // Create role (admin only)
  router.post(
    '/',
    requireAdmin,
    [
      body('name').isLength({ min: 1, max: 50 }),
      body('description').isLength({ min: 1, max: 200 }),
      body('permissions').isArray(),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array(),
          });
        }

        const { name, description, permissions: rolePermissions } = req.body;

        // Check if role already exists
        if (roles.has(name)) {
          return res.status(409).json({
            success: false,
            error: 'Role already exists',
          });
        }

        // Validate permissions exist
        for (const permission of rolePermissions) {
          if (!permissions.has(permission)) {
            return res.status(400).json({
              success: false,
              error: `Permission '${permission}' does not exist`,
            });
          }
        }

        const role: Role = {
          name,
          description,
          permissions: rolePermissions,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        roles.set(name, role);

        // Log audit event
        if (auditService) {
          await auditService.log({
            action: 'role.created',
            resource: 'roles',
            details: { roleName: name, success: true },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            success: true,
          });
        }

        res.status(201).json({
          success: true,
          data: role,
        });
      } catch (error: any) {
        res.status(400).json({
          success: false,
          error: error.message || 'Failed to create role',
        });
      }
    }
  );

  // Update role (admin only)
  router.put(
    '/:name',
    requireAdmin,
    [
      body('description').optional().isLength({ min: 1, max: 200 }),
      body('permissions').optional().isArray(),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array(),
          });
        }

        const { name } = req.params;
        const { description, permissions: rolePermissions } = req.body;

        const role = roles.get(name);
        if (!role) {
          return res.status(404).json({
            success: false,
            error: 'Role not found',
          });
        }

        // Validate permissions exist
        if (rolePermissions) {
          for (const permission of rolePermissions) {
            if (!permissions.has(permission)) {
              return res.status(400).json({
                success: false,
                error: `Permission '${permission}' does not exist`,
              });
            }
          }
        }

        const updatedRole: Role = {
          ...role,
          description: description || role.description,
          permissions: rolePermissions || role.permissions,
          updatedAt: new Date(),
        };

        roles.set(name, updatedRole);

        // Log audit event
        if (auditService) {
          await auditService.log({
            action: 'role.updated',
            resource: 'roles',
            details: { roleName: name, success: true },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            success: true,
          });
        }

        res.json({
          success: true,
          data: updatedRole,
        });
      } catch (error: any) {
        res.status(400).json({
          success: false,
          error: error.message || 'Failed to update role',
        });
      }
    }
  );

  // Delete role (admin only)
  router.delete('/:name', requireAdmin, async (req, res) => {
    try {
      const { name } = req.params;

      // Check if role exists
      if (!roles.has(name)) {
        return res.status(404).json({
          success: false,
          error: 'Role not found',
        });
      }

      // Check if role is in use
      const users = await userService.getAllUsers();
      const usersWithRole = users.filter((user) => user.roles.includes(name));

      if (usersWithRole.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Cannot delete role that is assigned to users',
        });
      }

      roles.delete(name);

      // Log audit event
      if (auditService) {
        await auditService.log({
          action: 'role.deleted',
          resource: 'roles',
          details: { roleName: name, success: true },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: true,
        });
      }

      res.json({
        success: true,
        message: 'Role deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete role',
      });
    }
  });

  // Get all permissions
  router.get('/permissions/list', async (req, res) => {
    try {
      const permissionsList = Array.from(permissions.values());
      res.json({
        success: true,
        data: permissionsList,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get permissions',
      });
    }
  });

  // Create permission (admin only)
  router.post(
    '/permissions/create',
    requireAdmin,
    [
      body('name').isLength({ min: 1, max: 50 }),
      body('description').isLength({ min: 1, max: 200 }),
      body('resource').isLength({ min: 1, max: 50 }),
      body('action').isLength({ min: 1, max: 50 }),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array(),
          });
        }

        const { name, description, resource, action } = req.body;

        // Check if permission already exists
        if (permissions.has(name)) {
          return res.status(409).json({
            success: false,
            error: 'Permission already exists',
          });
        }

        const permission: Permission = {
          name,
          description,
          resource,
          action,
          createdAt: new Date(),
        };

        permissions.set(name, permission);

        // Log audit event
        if (auditService) {
          await auditService.log({
            action: 'permission.created',
            resource: 'roles',
            details: { permissionName: name, success: true },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            success: true,
          });
        }

        res.status(201).json({
          success: true,
          data: permission,
        });
      } catch (error: any) {
        res.status(400).json({
          success: false,
          error: error.message || 'Failed to create permission',
        });
      }
    }
  );

  return router;
}
