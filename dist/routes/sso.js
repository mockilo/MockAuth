"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSSORoutes = void 0;
const express_1 = require("express");
function createSSORoutes(ssoService) {
    const router = (0, express_1.Router)();
    /**
     * Get available SSO providers
     */
    router.get('/providers', (req, res) => {
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to get SSO providers',
            });
        }
    });
    /**
     * Initiate SSO login
     */
    router.get('/login/:provider', (req, res) => {
        try {
            const { provider } = req.params;
            const { redirect_url } = req.query;
            const authUrl = ssoService.generateAuthUrl(provider, redirect_url);
            res.json({
                success: true,
                data: {
                    authUrl,
                    provider,
                },
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    });
    /**
     * Handle SSO callback
     */
    router.post('/callback/:provider', (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            const { provider } = req.params;
            const { code, state } = req.body;
            if (!code || !state) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing code or state parameter',
                });
            }
            const result = yield ssoService.handleCallback(provider, code, state);
            res.json({
                success: true,
                data: {
                    user: result.user,
                    token: result.token,
                    redirectUrl: result.redirectUrl,
                },
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }));
    /**
     * Validate SSO token
     */
    router.post('/validate', (req, res) => {
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
            }
            else {
                res.status(401).json({
                    success: false,
                    error: 'Invalid or expired token',
                });
            }
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Token validation failed',
            });
        }
    });
    /**
     * Clean up expired states
     */
    router.post('/cleanup', (req, res) => {
        try {
            ssoService.cleanupExpiredStates();
            res.json({
                success: true,
                message: 'Expired states cleaned up',
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Cleanup failed',
            });
        }
    });
    return router;
}
exports.createSSORoutes = createSSORoutes;
//# sourceMappingURL=sso.js.map