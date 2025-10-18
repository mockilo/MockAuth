# MockAuth Ecosystem Integration

MockAuth is part of the **Mockilo** developer ecosystem, providing a complete development sandbox for authentication, data generation, and API simulation.

## 🌐 Ecosystem Overview

The Mockilo ecosystem consists of three core tools:

- **MockAuth** → Authentication simulation and user management
- **MockTail** → Schema-aware mock data generation
- **SchemaGhost** → Fake API server for backend simulation

## 🚀 Quick Start with Ecosystem

```javascript
import { MockAuth } from 'mockauth';

const auth = new MockAuth({
  port: 3001,
  baseUrl: 'http://localhost:3001',
  jwtSecret: 'your-secret-key',
  
  // Ecosystem configuration
  ecosystem: {
    mocktail: {
      enabled: true,
      prismaSchemaPath: './prisma/schema.prisma',
      outputPath: './mock-data',
      seedCount: 100
    },
    schemaghost: {
      enabled: true,
      port: 3002,
      endpoints: [
        {
          path: '/api/posts',
          method: 'GET',
          response: { posts: [] },
          statusCode: 200
        }
      ]
    }
  }
});

await auth.start();
```

## 🎭 MockTail Integration

MockTail generates realistic mock data based on your Prisma schema.

### Configuration

```javascript
ecosystem: {
  mocktail: {
    enabled: true,
    prismaSchemaPath: './prisma/schema.prisma', // Path to your Prisma schema
    outputPath: './mock-data',                  // Where to save generated data
    seedCount: 100,                            // Number of records to generate
    customGenerators: {                        // Custom field generators
      user: {
        email: 'email',
        username: 'username',
        profile: {
          firstName: 'firstName',
          lastName: 'lastName'
        }
      }
    }
  }
}
```

### Usage

```javascript
// Generate mock data programmatically
const mockUsers = await auth.getEcosystemService().generateMockData('User', 10);
console.log(mockUsers);

// MockTail automatically generates data on startup when enabled
```

### Prisma Schema Example

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  firstName String?
  lastName  String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id       String @id @default(cuid())
  title    String
  content  String
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
}
```

## 👻 SchemaGhost Integration

SchemaGhost creates a mock API server that simulates your backend endpoints.

### Configuration

```javascript
ecosystem: {
  schemaghost: {
    enabled: true,
    port: 3002,                    // Port for mock API server
    delay: 100,                    // Response delay in milliseconds
    errorRate: 0.05,              // 5% error rate for testing
    endpoints: [
      {
        path: '/api/posts',
        method: 'GET',
        response: {
          posts: [
            { id: 1, title: 'Mock Post 1', content: 'Content...' },
            { id: 2, title: 'Mock Post 2', content: 'Content...' }
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
    ]
  }
}
```

### Dynamic Endpoint Creation

```javascript
// Add endpoints at runtime
await auth.getEcosystemService().createMockEndpoint(
  '/api/products',
  'GET',
  {
    products: [
      { id: 1, name: 'Product 1', price: 29.99 },
      { id: 2, name: 'Product 2', price: 39.99 }
    ]
  }
);
```

## 🔄 Complete Development Workflow

### 1. Setup MockAuth with Ecosystem

```javascript
const auth = new MockAuth({
  port: 3001,
  baseUrl: 'http://localhost:3001',
  jwtSecret: 'dev-secret',
  users: [
    {
      email: 'admin@example.com',
      username: 'admin',
      password: 'admin123',
      roles: ['admin'],
      permissions: ['read:users', 'write:users']
    }
  ],
  ecosystem: {
    mocktail: {
      enabled: true,
      prismaSchemaPath: './prisma/schema.prisma',
      outputPath: './mock-data',
      seedCount: 50
    },
    schemaghost: {
      enabled: true,
      port: 3002,
      endpoints: [
        {
          path: '/api/posts',
          method: 'GET',
          response: { posts: [] },
          statusCode: 200
        }
      ],
      delay: 150,
      errorRate: 0.1
    }
  }
});

await auth.start();
```

### 2. Frontend Integration

```javascript
// React example
import { useState, useEffect } from 'react';

function App() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Login to MockAuth
    fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    })
    .then(res => res.json())
    .then(data => {
      setUser(data.data.user);
      
      // Fetch data from SchemaGhost
      return fetch('http://localhost:3002/api/posts', {
        headers: {
          'Authorization': `Bearer ${data.data.token}`
        }
      });
    })
    .then(res => res.json())
    .then(data => setPosts(data.posts));
  }, []);

  return (
    <div>
      <h1>Welcome, {user?.username}!</h1>
      <div>
        {posts.map(post => (
          <div key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Testing Integration

```javascript
// Jest test example
describe('Full Stack Integration', () => {
  let auth;
  let authToken;

  beforeAll(async () => {
    auth = new MockAuth({
      port: 3001,
      baseUrl: 'http://localhost:3001',
      jwtSecret: 'test-secret',
      ecosystem: {
        mocktail: { enabled: true },
        schemaghost: { enabled: true, port: 3002 }
      }
    });
    
    await auth.start();
    
    // Login to get token
    const response = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    authToken = data.data.token;
  });

  afterAll(async () => {
    await auth.stop();
  });

  test('should authenticate and fetch data', async () => {
    // Test authentication
    const authResponse = await fetch('http://localhost:3001/auth/me', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    expect(authResponse.status).toBe(200);

    // Test API data
    const dataResponse = await fetch('http://localhost:3002/api/posts');
    expect(dataResponse.status).toBe(200);
  });
});
```

## 🛠️ Advanced Configuration

### Custom Generators

```javascript
ecosystem: {
  mocktail: {
    enabled: true,
    customGenerators: {
      user: {
        email: 'email',
        username: 'username',
        profile: {
          firstName: 'firstName',
          lastName: 'lastName',
          avatar: 'imageUrl'
        },
        metadata: {
          preferences: {
            theme: () => ['light', 'dark', 'auto'][Math.floor(Math.random() * 3)],
            notifications: () => ({
              email: Math.random() > 0.5,
              push: Math.random() > 0.5,
              sms: Math.random() > 0.5
            })
          }
        }
      }
    }
  }
}
```

### Error Simulation

```javascript
ecosystem: {
  schemaghost: {
    enabled: true,
    errorRate: 0.1,  // 10% of requests will fail
    endpoints: [
      {
        path: '/api/unreliable',
        method: 'GET',
        response: { error: 'Service temporarily unavailable' },
        statusCode: 503
      }
    ]
  }
}
```

## 📊 Monitoring and Debugging

### Health Checks

```javascript
// Check MockAuth health
const authHealth = await fetch('http://localhost:3001/health');
console.log(await authHealth.json());

// Check SchemaGhost health (if implemented)
const apiHealth = await fetch('http://localhost:3002/health');
console.log(await apiHealth.json());
```

### Performance Metrics

```javascript
// Get MockAuth performance metrics
const stats = await auth.getStats();
console.log('Auth Stats:', stats);

// Get ecosystem service status
const ecosystemService = auth.getEcosystemService();
console.log('MockTail Config:', ecosystemService.getMockTailConfig());
console.log('SchemaGhost Config:', ecosystemService.getSchemaGhostConfig());
```

## 🚀 Production Considerations

### Environment-Specific Configuration

```javascript
const isDevelopment = process.env.NODE_ENV === 'development';

const auth = new MockAuth({
  port: 3001,
  baseUrl: process.env.MOCKAUTH_URL || 'http://localhost:3001',
  jwtSecret: process.env.JWT_SECRET,
  
  ecosystem: {
    mocktail: {
      enabled: isDevelopment,
      prismaSchemaPath: './prisma/schema.prisma',
      outputPath: './mock-data'
    },
    schemaghost: {
      enabled: isDevelopment,
      port: 3002,
      endpoints: isDevelopment ? mockEndpoints : []
    }
  }
});
```

### Docker Integration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3001 3002

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  mockauth:
    build: .
    ports:
      - "3001:3001"
      - "3002:3002"
    environment:
      - NODE_ENV=development
      - JWT_SECRET=your-secret-key
    volumes:
      - ./prisma:/app/prisma
      - ./mock-data:/app/mock-data
```

## 🔗 Ecosystem Benefits

1. **Complete Development Environment**: All tools work together seamlessly
2. **Realistic Data**: MockTail generates data that matches your schema
3. **API Simulation**: SchemaGhost provides realistic API responses
4. **Authentication Testing**: MockAuth handles all auth scenarios
5. **Easy Testing**: Everything works together for comprehensive testing
6. **Development Speed**: No need to set up separate services

## 📚 Additional Resources

- [MockTail Documentation](https://mocktail.dev)
- [SchemaGhost Documentation](https://schemaghost.dev)
- [MockAuth API Reference](./api-reference.md)
- [Getting Started Guide](./getting-started.md)
- [Examples](./examples.md)
