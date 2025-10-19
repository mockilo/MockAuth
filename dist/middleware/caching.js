"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCacheStats = exports.clearAllCache = exports.invalidateCache = exports.cacheMiddleware = void 0;
const CacheService_1 = require("../services/CacheService");
const cacheService = CacheService_1.CacheService.getInstance();
function cacheMiddleware(options = {}) {
    const { ttl = 5 * 60 * 1000, // 5 minutes default
    keyGenerator = defaultKeyGenerator, skipCache = () => false, } = options;
    return (req, res, next) => {
        // Skip caching for non-GET requests or if skipCache returns true
        if (req.method !== 'GET' || skipCache(req)) {
            return next();
        }
        const cacheKey = keyGenerator(req);
        const cachedResponse = cacheService.get(cacheKey);
        if (cachedResponse) {
            // Return cached response
            res.json(cachedResponse);
            return;
        }
        // Store original send method
        const originalSend = res.send;
        const originalJson = res.json;
        // Override send method to cache response
        res.send = function (data) {
            if (res.statusCode === 200) {
                cacheService.set(cacheKey, data, ttl);
            }
            return originalSend.call(this, data);
        };
        // Override json method to cache response
        res.json = function (data) {
            if (res.statusCode === 200) {
                cacheService.set(cacheKey, data, ttl);
            }
            return originalJson.call(this, data);
        };
        next();
    };
}
exports.cacheMiddleware = cacheMiddleware;
function defaultKeyGenerator(req) {
    const { method, path, query } = req;
    const queryString = Object.keys(query).length > 0
        ? '?' + new URLSearchParams(query).toString()
        : '';
    return `${method}:${path}${queryString}`;
}
function invalidateCache(pattern) {
    const keys = cacheService.keys();
    const regex = new RegExp(pattern);
    keys.forEach((key) => {
        if (regex.test(key)) {
            cacheService.delete(key);
        }
    });
}
exports.invalidateCache = invalidateCache;
function clearAllCache() {
    cacheService.clear();
}
exports.clearAllCache = clearAllCache;
function getCacheStats() {
    return cacheService.getStats();
}
exports.getCacheStats = getCacheStats;
//# sourceMappingURL=caching.js.map