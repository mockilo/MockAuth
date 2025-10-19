"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDebugRoutes = createDebugRoutes;
const express_1 = require("express");
const performance_1 = require("../middleware/performance");
function createDebugRoutes() {
    const router = (0, express_1.Router)();
    // Debug console endpoint
    router.get('/', (req, res) => {
        const debugInfo = {
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                version: process.version,
                platform: process.platform,
                arch: process.arch,
            },
            performance: performance_1.performanceMonitor.getMetrics(),
            environment: {
                nodeEnv: process.env['NODE_ENV'] || 'development',
                port: process.env['PORT'] || '3005',
            },
            timestamp: new Date(),
        };
        res.json({
            success: true,
            data: debugInfo,
            message: 'Debug Console is running',
        });
    });
    // Real-time request/response inspection
    router.get('/requests', (req, res) => {
        const metrics = performance_1.performanceMonitor.getMetrics();
        res.json({
            success: true,
            data: {
                requestCount: metrics.requestCount,
                averageResponseTime: metrics.averageResponseTime,
                slowestRequests: metrics.slowestRequests,
                errorRate: metrics.errorRate,
                totalErrors: metrics.totalErrors,
                timestamp: new Date(),
            },
        });
    });
    // Live user session monitoring
    router.get('/sessions', (req, res) => {
        // Mock session data for now
        const sessions = [
            {
                id: 'session-1',
                userId: 'user-1',
                email: 'admin@example.com',
                loginTime: new Date(Date.now() - 300000), // 5 minutes ago
                lastActivity: new Date(Date.now() - 60000), // 1 minute ago
                ip: '127.0.0.1',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                active: true,
            },
            {
                id: 'session-2',
                userId: 'user-2',
                email: 'user@example.com',
                loginTime: new Date(Date.now() - 600000), // 10 minutes ago
                lastActivity: new Date(Date.now() - 120000), // 2 minutes ago
                ip: '127.0.0.1',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                active: true,
            },
        ];
        res.json({
            success: true,
            data: {
                sessions,
                total: sessions.length,
                active: sessions.filter(s => s.active).length,
                timestamp: new Date(),
            },
        });
    });
    // Token validation and debugging
    router.get('/tokens', (req, res) => {
        // Mock token data for now
        const tokens = [
            {
                id: 'token-1',
                userId: 'user-1',
                type: 'access',
                issuedAt: new Date(Date.now() - 300000),
                expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
                valid: true,
                scopes: ['read:profile', 'write:profile'],
            },
            {
                id: 'token-2',
                userId: 'user-2',
                type: 'refresh',
                issuedAt: new Date(Date.now() - 600000),
                expiresAt: new Date(Date.now() + 604800000), // 7 days from now
                valid: true,
                scopes: ['refresh'],
            },
        ];
        res.json({
            success: true,
            data: {
                tokens,
                total: tokens.length,
                valid: tokens.filter(t => t.valid).length,
                timestamp: new Date(),
            },
        });
    });
    // Performance metrics dashboard
    router.get('/metrics', (req, res) => {
        const metrics = performance_1.performanceMonitor.getMetrics();
        const memoryUsage = process.memoryUsage();
        res.json({
            success: true,
            data: {
                performance: metrics,
                memory: {
                    rss: Math.round(memoryUsage.rss / 1024 / 1024),
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                    external: Math.round(memoryUsage.external / 1024 / 1024),
                },
                uptime: process.uptime(),
                timestamp: new Date(),
            },
        });
    });
    // API testing playground
    router.get('/playground', (req, res) => {
        res.json({
            success: true,
            data: {
                message: 'API Testing Playground',
                endpoints: [
                    'GET /debug - Debug console overview',
                    'GET /debug/requests - Request/response inspection',
                    'GET /debug/sessions - Live user session monitoring',
                    'GET /debug/tokens - Token validation and debugging',
                    'GET /debug/metrics - Performance metrics dashboard',
                    'GET /debug/playground - API testing playground',
                ],
                timestamp: new Date(),
            },
        });
    });
    return router;
}
//# sourceMappingURL=debug.js.map