"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHealthRoutes = createHealthRoutes;
const express_1 = require("express");
const caching_1 = require("../middleware/caching");
const performance_1 = require("../middleware/performance");
function createHealthRoutes() {
    const router = (0, express_1.Router)();
    // Basic health check with caching (disabled in test environment)
    const healthHandler = (req, res) => {
        const healthCheck = {
            status: 'healthy',
            timestamp: new Date(),
            uptime: process.uptime(),
            version: '1.0.0',
            environment: process.env['NODE_ENV'] || 'development',
            services: {
                database: 'connected',
                jwt: 'valid',
                rateLimit: 'active',
            },
        };
        res.json({
            success: true,
            data: {
                ...healthCheck,
                performance: performance_1.performanceMonitor.getMetrics(),
            },
        });
    };
    // Use caching only in production
    if (process.env.NODE_ENV === 'production') {
        router.get('/', (0, caching_1.cacheMiddleware)({ ttl: 30000 }), healthHandler);
    }
    else {
        router.get('/', healthHandler);
    }
    // Detailed health check
    router.get('/detailed', (req, res) => {
        const healthCheck = {
            status: 'healthy',
            timestamp: new Date(),
            uptime: process.uptime(),
            version: '1.0.0',
            environment: process.env['NODE_ENV'] || 'development',
            services: {
                database: 'connected',
                jwt: 'valid',
                rateLimit: 'active',
            },
        };
        // Add memory usage
        const memoryUsage = process.memoryUsage();
        const healthData = {
            ...healthCheck,
            memory: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
                external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
            },
            cpu: {
                usage: process.cpuUsage(),
            },
        };
        res.json({
            success: true,
            data: healthData,
        });
    });
    // Readiness check
    router.get('/ready', (req, res) => {
        // Check if all required services are ready
        const isReady = true; // In a real app, check database connections, etc.
        if (isReady) {
            res.json({
                success: true,
                status: 'ready',
                timestamp: new Date(),
            });
        }
        else {
            res.status(503).json({
                success: false,
                status: 'not ready',
                timestamp: new Date(),
            });
        }
    });
    // Liveness check
    router.get('/live', (req, res) => {
        // Simple liveness check - if the process is running, it's alive
        res.json({
            success: true,
            status: 'alive',
            timestamp: new Date(),
            uptime: process.uptime(),
        });
    });
    return router;
}
//# sourceMappingURL=health.js.map