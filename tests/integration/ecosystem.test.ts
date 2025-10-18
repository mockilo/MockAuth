import { MockAuth } from '../../src/index';
import { EcosystemService } from '../../src/services/EcosystemService';

describe('Ecosystem Integration', () => {
  let auth: MockAuth;

  beforeEach(() => {
    auth = new MockAuth({
      port: 3001,
      baseUrl: 'http://localhost:3001',
      jwtSecret: 'test-secret-key-for-ecosystem-tests-32-chars-minimum',
      ecosystem: {
        mocktail: {
          enabled: true,
          outputPath: './test-mock-data',
          seedCount: 10
        },
        schemaghost: {
          enabled: true,
          port: 3002,
          endpoints: []
        }
      }
    });
  });

  afterEach(async () => {
    if (auth) {
      await auth.stop();
    }
  });

  describe('EcosystemService', () => {
    it('should initialize ecosystem services', async () => {
      const ecosystemService = auth.getEcosystemService();
      expect(ecosystemService).toBeDefined();
      expect(ecosystemService).toBeInstanceOf(EcosystemService);
    });

    it('should handle MockTail initialization gracefully when not available', async () => {
      const ecosystemService = auth.getEcosystemService();
      
      // Mock console.warn to capture warnings
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await ecosystemService.initialize();
      
      // Should not throw errors even if MockTail is not installed
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle SchemaGhost initialization gracefully when not available', async () => {
      const ecosystemService = auth.getEcosystemService();
      
      // Mock console.warn to capture warnings
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await ecosystemService.initialize();
      
      // Should not throw errors even if SchemaGhost is not installed
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('MockAuth with Ecosystem', () => {
    it('should start successfully with ecosystem disabled', async () => {
      const authWithoutEcosystem = new MockAuth({
        port: 3003,
        baseUrl: 'http://localhost:3003',
        jwtSecret: 'test-secret-key-for-ecosystem-tests-32-chars-minimum',
        ecosystem: {
          mocktail: { enabled: false },
          schemaghost: { enabled: false }
        }
      });

      await authWithoutEcosystem.start();
      expect(authWithoutEcosystem.getEcosystemService()).toBeDefined();
      
      await authWithoutEcosystem.stop();
    });

    it('should provide ecosystem service access', () => {
      const ecosystemService = auth.getEcosystemService();
      expect(ecosystemService).toBeDefined();
      expect(ecosystemService.getMockTailConfig).toBeDefined();
      expect(ecosystemService.getSchemaGhostConfig).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should have default ecosystem configuration', () => {
      const config = auth.getConfig();
      expect(config.ecosystem).toBeDefined();
      expect(config.ecosystem?.mocktail?.enabled).toBe(true);
      expect(config.ecosystem?.schemaghost?.enabled).toBe(true);
    });

    it('should allow custom ecosystem configuration', () => {
      const customAuth = new MockAuth({
        port: 3004,
        baseUrl: 'http://localhost:3004',
        jwtSecret: 'test-secret-key-for-ecosystem-tests-32-chars-minimum',
        ecosystem: {
          mocktail: {
            enabled: true,
            seedCount: 50,
            customGenerators: { test: 'generator' }
          },
          schemaghost: {
            enabled: true,
            port: 3005,
            delay: 200
          }
        }
      });

      const config = customAuth.getConfig();
      expect(config.ecosystem?.mocktail?.seedCount).toBe(50);
      expect(config.ecosystem?.schemaghost?.port).toBe(3005);
    });
  });
});
