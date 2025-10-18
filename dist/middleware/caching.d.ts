import { Request, Response, NextFunction } from 'express';
export interface CacheOptions {
    ttl?: number;
    keyGenerator?: (req: Request) => string;
    skipCache?: (req: Request) => boolean;
}
export declare function cacheMiddleware(options?: CacheOptions): (req: Request, res: Response, next: NextFunction) => void;
export declare function invalidateCache(pattern: string): void;
export declare function clearAllCache(): void;
export declare function getCacheStats(): {
    size: number;
    hitRate: number;
    totalHits: number;
    totalMisses: number;
};
//# sourceMappingURL=caching.d.ts.map