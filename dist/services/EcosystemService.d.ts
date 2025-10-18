export interface MockTailConfig {
    enabled: boolean;
    prismaSchemaPath?: string;
    outputPath?: string;
    seedCount?: number;
    customGenerators?: Record<string, any>;
}
export interface SchemaGhostConfig {
    enabled: boolean;
    port?: number;
    endpoints?: Array<{
        path: string;
        method: 'GET' | 'POST' | 'PUT' | 'DELETE';
        response: any;
        statusCode?: number;
    }>;
    delay?: number;
    errorRate?: number;
}
export interface EcosystemConfig {
    mocktail: MockTailConfig;
    schemaghost: SchemaGhostConfig;
}
export declare class EcosystemService {
    private mocktailConfig;
    private schemaghostConfig;
    private mocktailProcess;
    private schemaghostProcess;
    private mocktailService;
    private schemaghostService;
    constructor(config: EcosystemConfig);
    initialize(): Promise<void>;
    private initializeMockTail;
    private initializeSchemaGhost;
    stop(): Promise<void>;
    getMockTailConfig(): MockTailConfig;
    getSchemaGhostConfig(): SchemaGhostConfig;
    generateMockData(type: string, count?: number): Promise<any[]>;
    createMockEndpoint(path: string, method: string, response: any): Promise<void>;
}
export declare function createEcosystemService(config: EcosystemConfig): import('../types').EcosystemService;
//# sourceMappingURL=EcosystemService.d.ts.map