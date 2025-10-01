import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { ApiResponse, LoginRequest, RegisterRequest, MFAVerifyRequest, PasswordResetRequest, PasswordResetVerifyRequest, PasswordResetCompleteRequest } from '../types';

export function createAuthRoutes(
  authService: AuthService,
  userService: UserService,
  webhookService: any,
  auditService: any
): Router {
  const router = Router();

  // Login endpoint
  router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 1 }),
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

      const { email, password, rememberMe, device, ipAddress, userAgent } = req.body;
      
      const loginRequest: LoginRequest = {
        email,
        password,
        rememberMe,
        device: device || req.get('User-Agent'),
        ipAddress: ipAddress || req.ip,
        userAgent: userAgent || req.get('User-Agent'),
      };

      const response = await authService.login(loginRequest);

      // Log audit event
      if (auditService) {
        await auditService.log({
          action: 'user.login',
          resource: 'auth',
          details: { email, success: true },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: true,
        });
      }

      // Send webhook
      if (webhookService) {
        await webhookService.send('user.login', {
          user: response.user,
          session: { id: response.sessionId },
        });
      }

      res.json({
        success: true,
        data: response,
      });
    } catch (error: any) {
      // Log failed login
      if (auditService) {
        await auditService.log({
          action: 'user.login',
          resource: 'auth',
          details: { email: req.body.email, success: false, error: error.message },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false,
          error: error.message,
        });
      }

      res.status(401).json({
        success: false,
        error: error.message || 'Login failed',
      });
    }
  });

  // Register endpoint
  router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('username').isLength({ min: 3, max: 30 }),
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

      const { email, password, username, profile, roles, permissions } = req.body;
      
      const registerRequest: RegisterRequest = {
        email,
        password,
        username,
        profile,
        roles,
        permissions,
      };

      const response = await authService.register(registerRequest);

      // Log audit event
      if (auditService) {
        await auditService.log({
          action: 'user.created',
          resource: 'auth',
          details: { email, username, success: true },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: true,
        });
      }

      // Send webhook
      if (webhookService) {
        await webhookService.send('user.created', {
          user: response.user,
        });
      }

      res.status(201).json({
        success: true,
        data: response,
      });
    } catch (error: any) {
      // Log failed registration
      if (auditService) {
        await auditService.log({
          action: 'user.created',
          resource: 'auth',
          details: { email: req.body.email, success: false, error: error.message },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false,
          error: error.message,
        });
      }

      res.status(400).json({
        success: false,
        error: error.message || 'Registration failed',
      });
    }
  });

  // Logout endpoint
  router.post('/logout', async (req, res) => {
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

      // Get session ID from token
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token format',
        });
      }
      const decoded = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      const sessionId = decoded.sessionId;

      const success = await authService.logout(sessionId);

      if (success) {
        // Log audit event
        if (auditService) {
          await auditService.log({
            action: 'user.logout',
            resource: 'auth',
            details: { userId: user.id, success: true },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            success: true,
          });
        }

        // Send webhook
        if (webhookService) {
          await webhookService.send('user.logout', {
            user: { id: user.id, email: user.email },
          });
        }

        return res.json({
          success: true,
          message: 'Logged out successfully',
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'Logout failed',
        });
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  });

  // Refresh token endpoint
  router.post('/refresh', [
    body('refreshToken').isLength({ min: 1 }),
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

      const { refreshToken } = req.body;
      const response = await authService.refreshToken({ refreshToken });

      res.json({
        success: true,
        data: response,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message || 'Token refresh failed',
      });
    }
  });

  // Get current user endpoint
  router.get('/me', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'No token provided',
        });
      }

      const user = await authService.getCurrentUser(token);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
        });
      }

      return res.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get user information',
      });
    }
  });

  // Verify token endpoint
  router.post('/verify', async (req, res) => {
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

      res.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Token verification failed',
      });
    }
  });

  // Get user sessions endpoint
  router.get('/sessions', async (req, res) => {
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

      const sessions = await authService.getUserSessions(user.id);
      res.json({
        success: true,
        data: sessions,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get user sessions',
      });
    }
  });

  // Revoke session endpoint
  router.delete('/sessions/:sessionId', async (req, res) => {
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

      const { sessionId } = req.params;
      const success = await authService.revokeSession(sessionId, user.id);

      if (success) {
        res.json({
          success: true,
          message: 'Session revoked successfully',
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Session not found',
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to revoke session',
      });
    }
  });

  // MFA Routes

  // Setup MFA
  router.post('/mfa/setup', async (req, res) => {
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

      const mfaSetup = await authService.setupMFA(user.id);

      res.json({
        success: true,
        data: mfaSetup,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'MFA setup failed',
      });
    }
  });

  // Verify MFA setup
  router.post('/mfa/verify-setup', [
    body('code').isLength({ min: 6, max: 6 }),
    body('backupCode').optional().isLength({ min: 8, max: 8 }),
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

      const { code, backupCode } = req.body;
      const request: MFAVerifyRequest = { code, backupCode };

      const result = await authService.verifyMFASetup(user.id, request);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'MFA verification failed',
      });
    }
  });

  // Verify MFA during login
  router.post('/mfa/verify', [
    body('code').isLength({ min: 6, max: 6 }),
    body('backupCode').optional().isLength({ min: 8, max: 8 }),
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

      const { code, backupCode } = req.body;
      const request: MFAVerifyRequest = { code, backupCode };

      const result = await authService.verifyMFA(user.id, request);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'MFA verification failed',
      });
    }
  });

  // Disable MFA
  router.delete('/mfa/disable', async (req, res) => {
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

      await authService.disableMFA(user.id);

      res.json({
        success: true,
        message: 'MFA disabled successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to disable MFA',
      });
    }
  });

  // Get MFA status
  router.get('/mfa/status', async (req, res) => {
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

      const status = await authService.getMFAStatus(user.id);

      res.json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get MFA status',
      });
    }
  });

  // Regenerate backup codes
  router.post('/mfa/backup-codes/regenerate', async (req, res) => {
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

      const backupCodes = await authService.regenerateBackupCodes(user.id);

      res.json({
        success: true,
        data: { backupCodes },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to regenerate backup codes',
      });
    }
  });

  // Password Reset Routes

  // Request password reset
  router.post('/password-reset/request', [
    body('email').isEmail().normalizeEmail(),
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

      const { email } = req.body;
      const request: PasswordResetRequest = { email };

      const result = await authService.requestPasswordReset(request);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Password reset request failed',
      });
    }
  });

  // Verify password reset token
  router.post('/password-reset/verify', [
    body('token').isLength({ min: 1 }),
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

      const { token } = req.body;
      const request: PasswordResetVerifyRequest = { token };

      const result = await authService.verifyPasswordResetToken(request);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Token verification failed',
      });
    }
  });

  // Complete password reset
  router.post('/password-reset/complete', [
    body('token').isLength({ min: 1 }),
    body('newPassword').isLength({ min: 8 }),
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

      const { token, newPassword } = req.body;
      const request: PasswordResetCompleteRequest = { token, newPassword };

      const result = await authService.completePasswordReset(request);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Password reset failed',
      });
    }
  });

  return router;
}
