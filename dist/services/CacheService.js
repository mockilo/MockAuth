"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
exports.createCacheService = createCacheService;
class CacheService {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    }
    static getInstance() {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }
    set(key, value, ttl) {
        const expiresAt = Date.now() + (ttl || this.defaultTTL);
        this.cache.set(key, {
            value,
            expiresAt,
            createdAt: Date.now(),
        });
    }
    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            return null;
        }
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }
    has(key) {
        const item = this.cache.get(key);
        if (!item) {
            return false;
        }
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    delete(key) {
        return this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    size() {
        this.cleanup();
        return this.cache.size;
    }
    keys() {
        this.cleanup();
        return Array.from(this.cache.keys());
    }
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
    getStats() {
        this.cleanup();
        return {
            size: this.cache.size,
            hitRate: 0, // Would need to track hits/misses for this
            totalHits: 0,
            totalMisses: 0,
        };
    }
}
exports.CacheService = CacheService;
function createCacheService() {
    return CacheService.getInstance();
}
//# sourceMappingURL=CacheService.js.map