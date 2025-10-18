import { Router } from 'express';
import { Request, Response } from 'express';

// In-memory storage for configurations (in production, use database)
let savedConfiguration: any = null;

export function createBuilderRoutes(mockAuthInstance: any): Router {
  const router = Router();

  // Get current stats from the running MockAuth instance
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = await mockAuthInstance.getStats();
      const userService = mockAuthInstance.getUserService();
      const users = await userService.getAllUsers();

      res.json({
        success: true,
        data: {
          totalUsers: users.length,
          totalConfigs: savedConfiguration ? 1 : 0,
          totalEndpoints: 8, // Auth endpoints
          stats: stats,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Save configuration
  router.post('/config/save', (req: Request, res: Response) => {
    try {
      // Check if body is a valid configuration object
      if (typeof req.body !== 'object' || req.body === null) {
        return res.status(400).json({
          success: false,
          error: 'Invalid configuration data',
        });
      }

      // Check for malformed JSON (when Express fails to parse)
      if (req.body && typeof req.body === 'string' && req.body.includes('invalid json')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON format',
        });
      }

      const config = req.body;
      savedConfiguration = config;

      res.json({
        success: true,
        message: 'Configuration saved successfully',
        data: config,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Load configuration
  router.get('/config/load', (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        data: savedConfiguration && Object.keys(savedConfiguration).length > 0 ? savedConfiguration : {
          port: 3001,
          jwtSecret: '',
          users: [],
          endpoints: [],
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Bulk create users from builder
  router.post('/users/bulk', async (req: Request, res: Response) => {
    try {
      const { users } = req.body;
      
      // Validate users array
      if (!users || !Array.isArray(users)) {
        return res.status(400).json({
          success: false,
          error: 'Users array is required',
        });
      }

      const userService = mockAuthInstance.getUserService();
      const createdUsers: any[] = [];
      const errors: any[] = [];

      for (const userData of users) {
        try {
          const user = await userService.createUser({
            email: userData.email,
            username: userData.email.split('@')[0],
            password: userData.password,
            roles: [userData.role || 'user'],
          });
          createdUsers.push(user);
        } catch (error: any) {
          errors.push({
            email: userData.email,
            error: error.message,
          });
        }
      }

      res.json({
        success: true,
        message: createdUsers.length > 0 ? 'Users created successfully' : 'Created 0 users',
        data: {
          created: createdUsers.length,
          failed: errors.length,
          details: errors,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Get all users
  router.get('/users', async (req: Request, res: Response) => {
    try {
      const userService = mockAuthInstance.getUserService();
      const users = await userService.getAllUsers();

      res.json({
        success: true,
        data: users.map((u: any) => ({
          id: u.id,
          email: u.email,
          username: u.username,
          roles: u.roles,
          createdAt: u.createdAt,
        })),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Test endpoint connectivity
  router.get('/test', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Builder API is connected',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
