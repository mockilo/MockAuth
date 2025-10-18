import { User } from '../types';
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
export declare class SSOService {
    private config;
    private states;
    constructor(config: SSOConfig);
    /**
     * Generate SSO authorization URL
     */
    generateAuthUrl(providerName: string, redirectUrl?: string): string;
    /**
     * Handle SSO callback and exchange code for tokens
     */
    handleCallback(providerName: string, code: string, state: string): Promise<{
        user: User;
        token: string;
        redirectUrl?: string;
    }>;
    /**
     * Exchange authorization code for access token
     */
    private exchangeCodeForToken;
    /**
     * Get user information from SSO provider
     */
    private getUserInfo;
    /**
     * Create or update user from SSO info
     */
    private createOrUpdateUser;
    /**
     * Generate secure random state
     */
    private generateState;
    /**
     * Generate secure random nonce
     */
    private generateNonce;
    /**
     * Validate SSO token
     */
    validateSSOToken(token: string): {
        userId: string;
        email: string;
        provider: string;
    } | null;
    /**
     * Get available SSO providers
     */
    getProviders(): SSOProvider[];
    /**
     * Clean up expired states
     */
    cleanupExpiredStates(): void;
}
export declare function createSSOService(config: SSOConfig): SSOService;
//# sourceMappingURL=SSOService.d.ts.map