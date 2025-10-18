export declare class CacheService {
    private static instance;
    private cache;
    private defaultTTL;
    static getInstance(): CacheService;
    set<T>(key: string, value: T, ttl?: number): void;
    get<T>(key: string): T | null;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    size(): number;
    keys(): string[];
    private cleanup;
    getStats(): {
        size: number;
        hitRate: number;
        totalHits: number;
        totalMisses: number;
    };
}
export declare function createCacheService(): CacheService;
//# sourceMappingURL=CacheService.d.ts.map