import { Request, Response, NextFunction } from 'express';
export interface PerformanceMetrics {
    requestCount: number;
    averageResponseTime: number;
    slowestRequests: Array<{
        path: string;
        method: string;
        duration: number;
        timestamp: Date;
    }>;
    errorRate: number;
    totalErrors: number;
}
declare class PerformanceMonitor {
    private static instance;
    private metrics;
    private requestTimes;
    private constructor();
    static getInstance(): PerformanceMonitor;
    startRequest(req: Request): void;
    endRequest(req: Request, res: Response): void;
    recordError(): void;
    private updateAverageResponseTime;
    private updateSlowestRequests;
    private updateErrorRate;
    getMetrics(): PerformanceMetrics;
    resetMetrics(): void;
}
export declare const performanceMonitor: PerformanceMonitor;
export declare function performanceMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function errorTrackingMiddleware(req: Request, res: Response, next: NextFunction): void;
export {};
//# sourceMappingURL=performance.d.ts.map