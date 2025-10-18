import { Router, Request, Response } from 'express';
import { SSOService } from '../services/SSOService';

export function createSSORoutes(ssoService: SSOService): Router {
  const router = Router();

  /**
   * Get available SSO providers
   */
  router.get('/providers', (req: Request, res: Response) => {
    try {
      const providers = ssoService.getProviders();
      res.json({
        success: true,
        data: providers.map((provider) => ({
          name: provider.name,
          type: provider.type,
          authorizationUrl: provider.authorizationUrl,
        })),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get SSO providers',
      });
    }
  });

  /**
   * Initiate SSO login
   */
  router.get('/login/:provider', (req: Request, res: Response) => {
    try {
      const { provider } = req.params;
      const { redirect_url } = req.query;

      const authUrl = ssoService.generateAuthUrl(
        provider,
        redirect_url as string
      );

      res.json({
        success: true,
        data: {
          authUrl,
          provider,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      });
    }
  });

  /**
   * Handle SSO callback
   */
  router.post('/callback/:provider', async (req: Request, res: Response) => {
    try {
      const { provider } = req.params;
      const { code, state } = req.body;

      if (!code || !state) {
        return res.status(400).json({
          success: false,
          error: 'Missing code or state parameter',
        });
      }

      const result = await ssoService.handleCallback(provider, code, state);

      res.json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
          redirectUrl: result.redirectUrl,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: (error as Error).message,
      });
    }
  });

  /**
   * Validate SSO token
   */
  router.post('/validate', (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token is required',
        });
      }

      const validation = ssoService.validateSSOToken(token);

      if (validation) {
        res.json({
          success: true,
          data: validation,
        });
      } else {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Token validation failed',
      });
    }
  });

  /**
   * Clean up expired states
   */
  router.post('/cleanup', (req: Request, res: Response) => {
    try {
      ssoService.cleanupExpiredStates();
      res.json({
        success: true,
        message: 'Expired states cleaned up',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Cleanup failed',
      });
    }
  });

  return router;
}
