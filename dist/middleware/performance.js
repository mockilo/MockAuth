"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMonitor = void 0;
exports.performanceMiddleware = performanceMiddleware;
exports.errorTrackingMiddleware = errorTrackingMiddleware;
class PerformanceMonitor {
    constructor() {
        this.requestTimes = new Map();
        this.metrics = {
            requestCount: 0,
            averageResponseTime: 0,
            slowestRequests: [],
            errorRate: 0,
            totalErrors: 0,
        };
    }
    static getInstance() {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }
    startRequest(req) {
        const requestId = `${req.method}:${req.path}:${Date.now()}`;
        this.requestTimes.set(requestId, Date.now());
        req['requestId'] = requestId;
    }
    endRequest(req, res) {
        const requestId = req['requestId'];
        if (!requestId)
            return;
        const startTime = this.requestTimes.get(requestId);
        if (!startTime)
            return;
        const duration = Date.now() - startTime;
        this.requestTimes.delete(requestId);
        // Update metrics
        this.metrics.requestCount++;
        this.updateAverageResponseTime(duration);
        this.updateSlowestRequests(req, duration);
    }
    recordError() {
        this.metrics.totalErrors++;
        this.updateErrorRate();
    }
    updateAverageResponseTime(duration) {
        const totalTime = this.metrics.averageResponseTime * (this.metrics.requestCount - 1) +
            duration;
        this.metrics.averageResponseTime = totalTime / this.metrics.requestCount;
    }
    updateSlowestRequests(req, duration) {
        const request = {
            path: req.path,
            method: req.method,
            duration,
            timestamp: new Date(),
        };
        this.metrics.slowestRequests.push(request);
        // Keep only the 10 slowest requests
        this.metrics.slowestRequests.sort((a, b) => b.duration - a.duration);
        if (this.metrics.slowestRequests.length > 10) {
            this.metrics.slowestRequests = this.metrics.slowestRequests.slice(0, 10);
        }
    }
    updateErrorRate() {
        this.metrics.errorRate =
            this.metrics.totalErrors / this.metrics.requestCount;
    }
    getMetrics() {
        return { ...this.metrics };
    }
    resetMetrics() {
        this.metrics = {
            requestCount: 0,
            averageResponseTime: 0,
            slowestRequests: [],
            errorRate: 0,
            totalErrors: 0,
        };
        this.requestTimes.clear();
    }
}
exports.performanceMonitor = PerformanceMonitor.getInstance();
function performanceMiddleware(req, res, next) {
    exports.performanceMonitor.startRequest(req);
    const originalSend = res.send;
    res.send = function (data) {
        exports.performanceMonitor.endRequest(req, res);
        return originalSend.call(this, data);
    };
    next();
}
function errorTrackingMiddleware(req, res, next) {
    const originalSend = res.send;
    res.send = function (data) {
        if (res.statusCode >= 400) {
            exports.performanceMonitor.recordError();
        }
        return originalSend.call(this, data);
    };
    next();
}
//# sourceMappingURL=performance.js.map