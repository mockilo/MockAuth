import { SchemaGhostConfig } from '../types';
import { Request, Response } from 'express';
export interface MockEndpoint {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    response: any;
    statusCode?: number;
    delay?: number;
    errorRate?: number;
    middleware?: (req: Request, res: Response, next: any) => void;
}
export declare class SchemaGhostService {
    private app;
    private config;
    private server;
    private endpoints;
    constructor(config: SchemaGhostConfig);
    private setupMiddleware;
    private setupDefaultEndpoints;
    addEndpoint(endpoint: MockEndpoint): void;
    removeEndpoint(path: string, method: string): void;
    updateEndpoint(path: string, method: string, updates: Partial<MockEndpoint>): void;
    generateMockData(type: string, count?: number): any[];
    addDynamicEndpoints(): void;
    start(): Promise<void>;
    stop(): Promise<void>;
    getEndpoints(): MockEndpoint[];
    getConfig(): SchemaGhostConfig;
}
export declare function createSchemaGhostService(config: SchemaGhostConfig): SchemaGhostService;
//# sourceMappingURL=SchemaGhostService.d.ts.map