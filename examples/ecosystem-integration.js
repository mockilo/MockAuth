const { MockAuth } = require('mockauth');

// Example of MockAuth with full ecosystem integration
async function startMockAuthWithEcosystem() {
  const auth = new MockAuth({
    port: 3001,
    baseUrl: 'http://localhost:3001',
    jwtSecret: 'your-secret-key-must-be-at-least-32-characters-long-for-security',
    users: [
      {
        email: 'admin@example.com',
        username: 'admin',
        password: 'admin123',
        roles: ['admin'],
        permissions: ['read:users', 'write:users']
      }
    ],
    // Ecosystem configuration
    ecosystem: {
      mocktail: {
        enabled: true,
        prismaSchemaPath: './prisma/schema.prisma',
        outputPath: './mock-data',
        seedCount: 100,
        customGenerators: {
          user: {
            email: 'email',
            username: 'username',
            profile: {
              firstName: 'firstName',
              lastName: 'lastName'
            }
          }
        }
      },
      schemaghost: {
        enabled: true,
        port: 3002,
        endpoints: [
          {
            path: '/api/posts',
            method: 'GET',
            response: {
              posts: [
                { id: 1, title: 'Mock Post 1', content: 'This is mock content' },
                { id: 2, title: 'Mock Post 2', content: 'This is more mock content' }
              ]
            },
            statusCode: 200
          },
          {
            path: '/api/users/:id',
            method: 'GET',
            response: {
              id: 1,
              name: 'John Doe',
              email: 'john@example.com'
            },
            statusCode: 200
          }
        ],
        delay: 100, // 100ms delay to simulate real API
        errorRate: 0.05 // 5% error rate for testing
      }
    }
  });

  await auth.start();
  console.log('🎉 MockAuth with ecosystem services started!');
  
  // Example: Generate mock data using MockTail
  try {
    const mockUsers = await auth.getEcosystemService().generateMockData('User', 5);
    console.log('Generated mock users:', mockUsers);
  } catch (error) {
    console.log('MockTail not available:', error.message);
  }

  // Example: Create additional mock endpoints
  try {
    await auth.getEcosystemService().createMockEndpoint('/api/products', 'GET', {
      products: [
        { id: 1, name: 'Product 1', price: 29.99 },
        { id: 2, name: 'Product 2', price: 39.99 }
      ]
    });
    console.log('Created mock endpoint: /api/products');
  } catch (error) {
    console.log('SchemaGhost not available:', error.message);
  }

  return auth;
}

// Example usage
if (require.main === module) {
  startMockAuthWithEcosystem()
    .then((auth) => {
      console.log('MockAuth ecosystem is ready!');
      console.log('Auth server: http://localhost:3001');
      console.log('Mock API server: http://localhost:3002');
      
      // Graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down...');
        await auth.stop();
        process.exit(0);
      });
    })
    .catch((error) => {
      console.error('Failed to start MockAuth:', error);
      process.exit(1);
    });
}

module.exports = { startMockAuthWithEcosystem };
