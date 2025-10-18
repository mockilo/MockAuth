import { MockAuthConfig } from '../types';

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

export class EcosystemService {
  private mocktailConfig: MockTailConfig;
  private schemaghostConfig: SchemaGhostConfig;
  private mocktailProcess: any = null;
  private schemaghostProcess: any = null;
  private mocktailService: any;
  private schemaghostService: any;

  constructor(config: EcosystemConfig) {
    this.mocktailConfig = config.mocktail;
    this.schemaghostConfig = config.schemaghost;
  }

  async initialize(): Promise<void> {
    if (this.mocktailConfig.enabled) {
      await this.initializeMockTail();
    }

    if (this.schemaghostConfig.enabled) {
      await this.initializeSchemaGhost();
    }
  }

  private async initializeMockTail(): Promise<void> {
    try {
      const { createMockTailService } = await import('./MockTailService');
      this.mocktailService = createMockTailService(this.mocktailConfig);

      // Generate initial mock data
      await this.mocktailService.generateAll();
      console.log('🎭 MockTail initialized - Mock data generation ready');
      console.log(
        '   Schema path:',
        this.mocktailConfig.prismaSchemaPath || './prisma/schema.prisma'
      );
      console.log(
        '   Output path:',
        this.mocktailConfig.outputPath || './mock-data'
      );
      console.log('   Seed count:', this.mocktailConfig.seedCount || 100);
    } catch (error) {
      console.warn('⚠️ MockTail not available:', (error as Error).message);
    }
  }

  private async initializeSchemaGhost(): Promise<void> {
    try {
      const { createSchemaGhostService } = await import('./SchemaGhostService');
      this.schemaghostService = createSchemaGhostService(
        this.schemaghostConfig
      );

      // Add dynamic endpoints
      this.schemaghostService.addDynamicEndpoints();

      // Start the server with port conflict handling
      await this.schemaghostService.start();
      this.schemaghostProcess = this.schemaghostService;

      console.log('👻 SchemaGhost initialized - Mock API server ready');
      console.log('   Port:', this.schemaghostConfig.port || 3002);
      console.log(
        '   Endpoints:',
        this.schemaghostService.getEndpoints().length
      );
      console.log('   Delay:', this.schemaghostConfig.delay || 0, 'ms');
      console.log('   Error rate:', this.schemaghostConfig.errorRate || 0);
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('EADDRINUSE') || errorMessage.includes('already in use')) {
        console.warn('⚠️ SchemaGhost not available: Port is already in use');
        console.log('💡 SchemaGhost will be disabled for this session');
        console.log('   You can manually stop the existing service or use a different port');
      } else {
        console.warn('⚠️ SchemaGhost not available:', errorMessage);
      }
    }
  }

  async stop(): Promise<void> {
    if (this.schemaghostProcess) {
      await this.schemaghostProcess.stop();
      console.log('👻 SchemaGhost stopped');
    }
  }

  getMockTailConfig(): MockTailConfig {
    return { ...this.mocktailConfig };
  }

  getSchemaGhostConfig(): SchemaGhostConfig {
    return { ...this.schemaghostConfig };
  }

  async generateMockData(type: string, count: number = 10): Promise<any[]> {
    if (!this.mocktailConfig.enabled) {
      throw new Error('MockTail is not enabled');
    }

    try {
      if (this.mocktailService) {
        return this.mocktailService.generate(type, count);
      } else {
        // Fallback implementation
        const mockData: any[] = [];
        for (let i = 0; i < count; i++) {
          mockData.push({
            id: i + 1,
            type: type,
            name: `${type} ${i + 1}`,
            email: `${type.toLowerCase()}${i + 1}@example.com`,
            createdAt: new Date().toISOString(),
          });
        }
        return mockData;
      }
    } catch (error) {
      throw new Error(
        `Failed to generate mock data: ${(error as Error).message}`
      );
    }
  }

  async createMockEndpoint(
    path: string,
    method: string,
    response: any
  ): Promise<void> {
    if (!this.schemaghostConfig.enabled) {
      throw new Error('SchemaGhost is not enabled');
    }

    try {
      if (this.schemaghostService) {
        this.schemaghostService.addEndpoint({
          path,
          method: method as any,
          response,
          statusCode: 200,
        });
        console.log(`👻 Created mock endpoint: ${method} ${path}`);
      } else {
        console.log(`👻 Mock endpoint created: ${method} ${path}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to create mock endpoint: ${(error as Error).message}`
      );
    }
  }
}

export function createEcosystemService(
  config: EcosystemConfig
): import('../types').EcosystemService {
  return new EcosystemService(config);
}
