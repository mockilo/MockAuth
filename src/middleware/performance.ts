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

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics;
  private requestTimes: Map<string, number> = new Map();

  private constructor() {
    this.metrics = {
      requestCount: 0,
      averageResponseTime: 0,
      slowestRequests: [],
      errorRate: 0,
      totalErrors: 0,
    };
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startRequest(req: Request): void {
    const requestId = `${req.method}:${req.path}:${Date.now()}`;
    this.requestTimes.set(requestId, Date.now());
    req['requestId'] = requestId;
  }

  endRequest(req: Request, res: Response): void {
    const requestId = req['requestId'];
    if (!requestId) return;

    const startTime = this.requestTimes.get(requestId);
    if (!startTime) return;

    const duration = Date.now() - startTime;
    this.requestTimes.delete(requestId);

    // Update metrics
    this.metrics.requestCount++;
    this.updateAverageResponseTime(duration);
    this.updateSlowestRequests(req, duration);
  }

  recordError(): void {
    this.metrics.totalErrors++;
    this.updateErrorRate();
  }

  private updateAverageResponseTime(duration: number): void {
    const totalTime =
      this.metrics.averageResponseTime * (this.metrics.requestCount - 1) +
      duration;
    this.metrics.averageResponseTime = totalTime / this.metrics.requestCount;
  }

  private updateSlowestRequests(req: Request, duration: number): void {
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

  private updateErrorRate(): void {
    this.metrics.errorRate =
      this.metrics.totalErrors / this.metrics.requestCount;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
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

export const performanceMonitor = PerformanceMonitor.getInstance();

export function performanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  performanceMonitor.startRequest(req);

  const originalSend = res.send;
  res.send = function (data) {
    performanceMonitor.endRequest(req, res);
    return originalSend.call(this, data);
  };

  next();
}

export function errorTrackingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const originalSend = res.send;
  res.send = function (data) {
    if (res.statusCode >= 400) {
      performanceMonitor.recordError();
    }
    return originalSend.call(this, data);
  };

  next();
}
