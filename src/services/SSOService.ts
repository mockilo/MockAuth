import { User } from '../types';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

export interface SSOProvider {
  name: string;
  type: 'oauth2' | 'saml' | 'oidc';
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope?: string[];
  redirectUri: string;
}

export interface SSOConfig {
  providers: SSOProvider[];
  defaultProvider?: string;
  enableSSO: boolean;
  ssoSecret: string;
  callbackUrl: string;
}

export interface SSOState {
  state: string;
  nonce: string;
  provider: string;
  redirectUrl?: string;
  createdAt: Date;
}

export interface SSOUserInfo {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  provider: string;
  providerId: string;
}

export class SSOService {
  private config: SSOConfig;
  private states: Map<string, SSOState> = new Map();

  constructor(config: SSOConfig) {
    this.config = config;
  }

  /**
   * Generate SSO authorization URL
   */
  generateAuthUrl(providerName: string, redirectUrl?: string): string {
    const provider = this.config.providers.find((p) => p.name === providerName);
    if (!provider) {
      throw new Error(`SSO provider '${providerName}' not found`);
    }

    const state = this.generateState();
    const nonce = this.generateNonce();

    // Store state for validation
    this.states.set(state, {
      state,
      nonce,
      provider: providerName,
      redirectUrl,
      createdAt: new Date(),
    });

    const params = new URLSearchParams({
      client_id: provider.clientId,
      redirect_uri: provider.redirectUri,
      response_type: 'code',
      scope: provider.scope?.join(' ') || 'openid email profile',
      state,
      nonce,
    });

    return `${provider.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Handle SSO callback and exchange code for tokens
   */
  async handleCallback(
    providerName: string,
    code: string,
    state: string
  ): Promise<{ user: User; token: string; redirectUrl?: string }> {
    const storedState = this.states.get(state);
    if (!storedState) {
      throw new Error('Invalid or expired state parameter');
    }

    if (storedState.provider !== providerName) {
      throw new Error('Provider mismatch');
    }

    // Clean up state
    this.states.delete(state);

    const provider = this.config.providers.find((p) => p.name === providerName);
    if (!provider) {
      throw new Error(`SSO provider '${providerName}' not found`);
    }

    // Exchange code for access token
    const tokenResponse = await this.exchangeCodeForToken(provider, code);

    // Get user info from provider
    const userInfo = await this.getUserInfo(
      provider,
      tokenResponse.access_token
    );

    // Create or update user
    const user = await this.createOrUpdateUser(userInfo);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        provider: providerName,
        sso: true,
      },
      this.config.ssoSecret,
      { expiresIn: '1h' }
    );

    return {
      user,
      token,
      redirectUrl: storedState.redirectUrl,
    };
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(
    provider: SSOProvider,
    code: string
  ): Promise<{ access_token: string; token_type: string }> {
    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        code,
        redirect_uri: provider.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get user information from SSO provider
   */
  private async getUserInfo(
    provider: SSOProvider,
    accessToken: string
  ): Promise<SSOUserInfo> {
    const response = await fetch(provider.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      id: data.id || data.sub,
      email: data.email,
      name:
        data.name ||
        `${data.given_name || ''} ${data.family_name || ''}`.trim(),
      firstName: data.given_name,
      lastName: data.family_name,
      avatar: data.picture || data.avatar_url,
      provider: provider.name,
      providerId: data.id || data.sub,
    };
  }

  /**
   * Create or update user from SSO info
   */
  private async createOrUpdateUser(userInfo: SSOUserInfo): Promise<User> {
    // This would integrate with your UserService
    // For now, return a mock user
    return {
      id: `sso-${userInfo.provider}-${userInfo.id}`,
      email: userInfo.email,
      username: userInfo.email.split('@')[0],
      password: '', // No password for SSO users
      profile: {
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        avatar: userInfo.avatar,
      },
      roles: ['user'],
      permissions: ['read'],
      isActive: true,
      isLocked: false,
      failedLoginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Generate secure random state
   */
  private generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate secure random nonce
   */
  private generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Validate SSO token
   */
  validateSSOToken(
    token: string
  ): { userId: string; email: string; provider: string } | null {
    try {
      const decoded = jwt.verify(token, this.config.ssoSecret) as any;
      return {
        userId: decoded.userId,
        email: decoded.email,
        provider: decoded.provider,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get available SSO providers
   */
  getProviders(): SSOProvider[] {
    return this.config.providers;
  }

  /**
   * Clean up expired states
   */
  cleanupExpiredStates(): void {
    const now = new Date();
    const expiredTime = 10 * 60 * 1000; // 10 minutes

    for (const [state, stateData] of this.states.entries()) {
      if (now.getTime() - stateData.createdAt.getTime() > expiredTime) {
        this.states.delete(state);
      }
    }
  }
}

export function createSSOService(config: SSOConfig): SSOService {
  return new SSOService(config);
}
