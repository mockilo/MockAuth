import { SchemaGhostConfig } from '../types';
import express, { Express, Request, Response } from 'express';

export interface MockEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  response: any;
  statusCode?: number;
  delay?: number;
  errorRate?: number;
  middleware?: (req: Request, res: Response, next: any) => void;
}

export class SchemaGhostService {
  private app: Express;
  private config: SchemaGhostConfig;
  private server: any;
  private endpoints: Map<string, MockEndpoint> = new Map();

  constructor(config: SchemaGhostConfig) {
    this.config = config;
    this.app = express();
    this.setupMiddleware();
    this.setupDefaultEndpoints();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH, OPTIONS'
      );
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
      );

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`👻 SchemaGhost: ${req.method} ${req.path}`);
      next();
    });
  }

  private setupDefaultEndpoints(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'SchemaGhost',
        timestamp: new Date().toISOString(),
        endpoints: Array.from(this.endpoints.keys()),
      });
    });

    // API documentation
    this.app.get('/api', (req, res) => {
      res.json({
        service: 'SchemaGhost - Mock API Server',
        version: '1.0.0',
        description: 'Mock API server for development and testing',
        endpoints: Array.from(this.endpoints.entries()).map(
          ([key, endpoint]) => ({
            path: endpoint.path,
            method: endpoint.method,
            statusCode: endpoint.statusCode || 200,
            description: `Mock ${endpoint.method} endpoint`,
          })
        ),
      });
    });

    // Add configured endpoints
    if (this.config.endpoints) {
      this.config.endpoints.forEach((endpoint) => {
        this.addEndpoint(endpoint);
      });
    }
  }

  addEndpoint(endpoint: MockEndpoint): void {
    const key = `${endpoint.method}:${endpoint.path}`;
    this.endpoints.set(key, endpoint);

    const handler = async (req: Request, res: Response) => {
      try {
        // Apply delay if configured
        if (endpoint.delay && endpoint.delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, endpoint.delay));
        }

        // Apply error rate if configured
        if (endpoint.errorRate && Math.random() < endpoint.errorRate) {
          return res.status(500).json({
            error: 'Simulated server error',
            message: 'This is a mock error for testing purposes',
            timestamp: new Date().toISOString(),
          });
        }

        // Apply custom middleware if provided
        if (endpoint.middleware) {
          endpoint.middleware(req, res, () => {
            res.status(endpoint.statusCode || 200).json(endpoint.response);
          });
        } else {
          res.status(endpoint.statusCode || 200).json(endpoint.response);
        }
      } catch (error) {
        res.status(500).json({
          error: 'Internal server error',
          message: (error as Error).message,
          timestamp: new Date().toISOString(),
        });
      }
    };

    // Register the endpoint
    switch (endpoint.method.toUpperCase()) {
      case 'GET':
        this.app.get(endpoint.path, handler);
        break;
      case 'POST':
        this.app.post(endpoint.path, handler);
        break;
      case 'PUT':
        this.app.put(endpoint.path, handler);
        break;
      case 'DELETE':
        this.app.delete(endpoint.path, handler);
        break;
      case 'PATCH':
        this.app.patch(endpoint.path, handler);
        break;
    }

    console.log(`👻 Added endpoint: ${endpoint.method} ${endpoint.path}`);
  }

  removeEndpoint(path: string, method: string): void {
    const key = `${method.toUpperCase()}:${path}`;
    this.endpoints.delete(key);
    console.log(`👻 Removed endpoint: ${method} ${path}`);
  }

  updateEndpoint(
    path: string,
    method: string,
    updates: Partial<MockEndpoint>
  ): void {
    const key = `${method.toUpperCase()}:${path}`;
    const existing = this.endpoints.get(key);

    if (existing) {
      const updated = { ...existing, ...updates };
      this.endpoints.set(key, updated);
      console.log(`👻 Updated endpoint: ${method} ${path}`);
    }
  }

  // Generate dynamic mock data
  generateMockData(type: string, count: number = 10): any[] {
    const mockData: any[] = [];

    for (let i = 0; i < count; i++) {
      switch (type.toLowerCase()) {
        case 'posts':
          mockData.push({
            id: i + 1,
            title: `Mock Post ${i + 1}`,
            content: `This is mock content for post ${i + 1}`,
            author: `Author ${i + 1}`,
            publishedAt: new Date().toISOString(),
            tags: ['mock', 'test', 'data'],
          });
          break;
        case 'users':
          mockData.push({
            id: i + 1,
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`,
            role: i % 3 === 0 ? 'admin' : 'user',
            createdAt: new Date().toISOString(),
          });
          break;
        case 'products':
          mockData.push({
            id: i + 1,
            name: `Product ${i + 1}`,
            price: Math.floor(Math.random() * 100) + 10,
            category: ['electronics', 'clothing', 'books'][i % 3],
            inStock: Math.random() > 0.2,
          });
          break;
        default:
          mockData.push({
            id: i + 1,
            name: `${type} ${i + 1}`,
            value: Math.floor(Math.random() * 100),
            createdAt: new Date().toISOString(),
          });
      }
    }

    return mockData;
  }

  // Add dynamic endpoints for common patterns
  addDynamicEndpoints(): void {
    const commonEndpoints = [
      {
        path: '/api/posts',
        method: 'GET' as const,
        response: this.generateMockData('posts', 20),
        statusCode: 200,
      },
      {
        path: '/api/users',
        method: 'GET' as const,
        response: this.generateMockData('users', 15),
        statusCode: 200,
      },
      {
        path: '/api/products',
        method: 'GET' as const,
        response: this.generateMockData('products', 25),
        statusCode: 200,
      },
      {
        path: '/api/orders',
        method: 'GET' as const,
        response: this.generateMockData('orders', 10),
        statusCode: 200,
      },
      {
        path: '/api/unreliable',
        method: 'GET' as const,
        response: { message: 'This endpoint is unreliable' },
        statusCode: 200,
        errorRate: 0.3, // 30% chance of error
      },
    ];

    commonEndpoints.forEach((endpoint) => {
      this.addEndpoint(endpoint);
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const port = this.config.port || 3002;

      this.server = this.app.listen(port, () => {
        console.log(
          `👻 SchemaGhost server running on http://localhost:${port}`
        );
        console.log(`📚 API Documentation: http://localhost:${port}/api`);
        console.log(`❤️  Health Check: http://localhost:${port}/health`);
        resolve();
      });

      this.server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${port} is already in use`);
        } else {
          console.error('❌ SchemaGhost server error:', error.message);
        }
        reject(error);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('👻 SchemaGhost server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getEndpoints(): MockEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  getConfig(): SchemaGhostConfig {
    return { ...this.config };
  }
}

export function createSchemaGhostService(
  config: SchemaGhostConfig
): SchemaGhostService {
  return new SchemaGhostService(config);
}
