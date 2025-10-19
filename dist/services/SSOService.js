"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSOService = void 0;
exports.createSSOService = createSSOService;
const jwt = __importStar(require("jsonwebtoken"));
const crypto = __importStar(require("crypto"));
class SSOService {
    constructor(config) {
        this.states = new Map();
        this.config = config;
    }
    /**
     * Generate SSO authorization URL
     */
    generateAuthUrl(providerName, redirectUrl) {
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
    async handleCallback(providerName, code, state) {
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
        const userInfo = await this.getUserInfo(provider, tokenResponse.access_token);
        // Create or update user
        const user = await this.createOrUpdateUser(userInfo);
        // Generate JWT token
        const token = jwt.sign({
            userId: user.id,
            email: user.email,
            provider: providerName,
            sso: true,
        }, this.config.ssoSecret, { expiresIn: '1h' });
        return {
            user,
            token,
            redirectUrl: storedState.redirectUrl,
        };
    }
    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(provider, code) {
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
    async getUserInfo(provider, accessToken) {
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
            name: data.name ||
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
    async createOrUpdateUser(userInfo) {
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
    generateState() {
        return crypto.randomBytes(32).toString('hex');
    }
    /**
     * Generate secure random nonce
     */
    generateNonce() {
        return crypto.randomBytes(16).toString('hex');
    }
    /**
     * Validate SSO token
     */
    validateSSOToken(token) {
        try {
            const decoded = jwt.verify(token, this.config.ssoSecret);
            return {
                userId: decoded.userId,
                email: decoded.email,
                provider: decoded.provider,
            };
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Get available SSO providers
     */
    getProviders() {
        return this.config.providers;
    }
    /**
     * Clean up expired states
     */
    cleanupExpiredStates() {
        const now = new Date();
        const expiredTime = 10 * 60 * 1000; // 10 minutes
        for (const [state, stateData] of this.states.entries()) {
            if (now.getTime() - stateData.createdAt.getTime() > expiredTime) {
                this.states.delete(state);
            }
        }
    }
}
exports.SSOService = SSOService;
function createSSOService(config) {
    return new SSOService(config);
}
//# sourceMappingURL=SSOService.js.map