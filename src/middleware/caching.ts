import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../services/CacheService';

const cacheService = CacheService.getInstance();

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
}

export function cacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    keyGenerator = defaultKeyGenerator,
    skipCache = () => false,
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
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
    res.send = function (data: any) {
      if (res.statusCode === 200) {
        cacheService.set(cacheKey, data, ttl);
      }
      return originalSend.call(this, data);
    };

    // Override json method to cache response
    res.json = function (data: any) {
      if (res.statusCode === 200) {
        cacheService.set(cacheKey, data, ttl);
      }
      return originalJson.call(this, data);
    };

    next();
  };
}

function defaultKeyGenerator(req: Request): string {
  const { method, path, query } = req;
  const queryString =
    Object.keys(query).length > 0
      ? '?' + new URLSearchParams(query as any).toString()
      : '';

  return `${method}:${path}${queryString}`;
}

export function invalidateCache(pattern: string): void {
  const keys = cacheService.keys();
  const regex = new RegExp(pattern);

  keys.forEach((key) => {
    if (regex.test(key)) {
      cacheService.delete(key);
    }
  });
}

export function clearAllCache(): void {
  cacheService.clear();
}

export function getCacheStats() {
  return cacheService.getStats();
}
