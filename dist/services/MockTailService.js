"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockTailService = exports.MockTailService = void 0;
class MockTailService {
    constructor(config) {
        this.config = config;
    }
    generate(type, count = 10) {
        const mockData = [];
        for (let i = 0; i < count; i++) {
            switch (type.toLowerCase()) {
                case 'user':
                    mockData.push(this.generateUser(i + 1));
                    break;
                case 'post':
                    mockData.push(this.generatePost(i + 1));
                    break;
                case 'product':
                    mockData.push(this.generateProduct(i + 1));
                    break;
                case 'order':
                    mockData.push(this.generateOrder(i + 1));
                    break;
                default:
                    mockData.push(this.generateGeneric(type, i + 1));
            }
        }
        return mockData;
    }
    generateForSchema(schema, count = 10) {
        // Mock implementation for Prisma schema parsing
        const mockData = [];
        for (let i = 0; i < count; i++) {
            const item = { id: i + 1 };
            // Basic schema field generation
            if (schema.fields) {
                schema.fields.forEach((field) => {
                    item[field.name] = this.generateFieldValue(field);
                });
            }
            mockData.push(item);
        }
        return mockData;
    }
    generateUser(id) {
        const firstNames = [
            'John',
            'Jane',
            'Mike',
            'Sarah',
            'David',
            'Lisa',
            'Chris',
            'Emma',
        ];
        const lastNames = [
            'Smith',
            'Johnson',
            'Williams',
            'Brown',
            'Jones',
            'Garcia',
            'Miller',
            'Davis',
        ];
        const domains = ['example.com', 'test.com', 'demo.com', 'mock.com'];
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const domain = domains[Math.floor(Math.random() * domains.length)];
        return {
            id,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
            username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${id}`,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}`,
            role: Math.random() > 0.8 ? 'admin' : 'user',
            isActive: Math.random() > 0.1,
            createdAt: this.randomDate(),
            updatedAt: this.randomDate(),
        };
    }
    generatePost(id) {
        const titles = [
            'Getting Started with MockAuth',
            'Building Better APIs',
            'The Future of Authentication',
            'Mock Data Best Practices',
            'Testing Made Simple',
            'Developer Experience Matters',
            'Security First Approach',
            'Performance Optimization Tips',
        ];
        const contents = [
            'This is a sample blog post content that demonstrates how MockAuth can help developers build better applications.',
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
            'MockAuth provides a comprehensive solution for authentication mocking during development and testing.',
            'With MockAuth, you can focus on building features instead of setting up complex authentication systems.',
        ];
        return {
            id,
            title: titles[Math.floor(Math.random() * titles.length)],
            content: contents[Math.floor(Math.random() * contents.length)],
            excerpt: 'Sample excerpt for the blog post...',
            slug: `post-${id}-${Math.random().toString(36).substring(7)}`,
            authorId: Math.floor(Math.random() * 10) + 1,
            category: ['tech', 'tutorial', 'news', 'guide'][Math.floor(Math.random() * 4)],
            tags: ['mockauth', 'authentication', 'development', 'testing'],
            published: Math.random() > 0.3,
            viewCount: Math.floor(Math.random() * 1000),
            createdAt: this.randomDate(),
            updatedAt: this.randomDate(),
        };
    }
    generateProduct(id) {
        const names = [
            'MockAuth Pro',
            'SchemaGhost Enterprise',
            'MockTail CLI',
            'AuthFlow Builder',
            'TestSuite Premium',
            'DevTools Bundle',
            'MockAPI Cloud',
            'AuthSimulator Pro',
        ];
        const descriptions = [
            'Professional authentication mocking solution for enterprise teams.',
            'Advanced API simulation with realistic data generation.',
            'Command-line tool for rapid mock data creation.',
            'Visual builder for complex authentication flows.',
            'Comprehensive testing suite with advanced features.',
            'Complete developer toolkit for modern applications.',
            'Cloud-based mock API service with global CDN.',
            'Advanced authentication simulation with real-world scenarios.',
        ];
        const price = Math.floor(Math.random() * 500) + 10;
        return {
            id,
            name: names[Math.floor(Math.random() * names.length)],
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            price,
            currency: 'USD',
            category: ['software', 'tool', 'service', 'platform'][Math.floor(Math.random() * 4)],
            sku: `MOCK-${id.toString().padStart(4, '0')}`,
            inStock: Math.random() > 0.2,
            stockQuantity: Math.floor(Math.random() * 100),
            rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 to 5.0
            reviewCount: Math.floor(Math.random() * 50),
            imageUrl: `https://picsum.photos/400/300?random=${id}`,
            createdAt: this.randomDate(),
            updatedAt: this.randomDate(),
        };
    }
    generateOrder(id) {
        const statuses = [
            'pending',
            'processing',
            'shipped',
            'delivered',
            'cancelled',
        ];
        const paymentMethods = ['credit_card', 'paypal', 'stripe', 'bank_transfer'];
        return {
            id,
            orderNumber: `ORD-${Date.now()}-${id}`,
            customerId: Math.floor(Math.random() * 20) + 1,
            total: Math.round((Math.random() * 1000 + 10) * 100) / 100,
            currency: 'USD',
            status: statuses[Math.floor(Math.random() * statuses.length)],
            paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            shippingAddress: {
                street: `${Math.floor(Math.random() * 9999) + 1} Main St`,
                city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][Math.floor(Math.random() * 5)],
                state: ['NY', 'CA', 'IL', 'TX', 'AZ'][Math.floor(Math.random() * 5)],
                zipCode: Math.floor(Math.random() * 90000) + 10000,
                country: 'USA',
            },
            items: this.generateOrderItems(id),
            createdAt: this.randomDate(),
            updatedAt: this.randomDate(),
        };
    }
    generateOrderItems(orderId) {
        const itemCount = Math.floor(Math.random() * 5) + 1;
        const items = [];
        for (let i = 0; i < itemCount; i++) {
            items.push({
                productId: Math.floor(Math.random() * 20) + 1,
                quantity: Math.floor(Math.random() * 3) + 1,
                price: Math.round((Math.random() * 100 + 10) * 100) / 100,
            });
        }
        return items;
    }
    generateGeneric(type, id) {
        return {
            id,
            name: `${type} ${id}`,
            description: `This is a sample ${type.toLowerCase()} item`,
            type: type.toLowerCase(),
            value: Math.floor(Math.random() * 100),
            isActive: Math.random() > 0.2,
            createdAt: this.randomDate(),
            updatedAt: this.randomDate(),
        };
    }
    generateFieldValue(field) {
        const fieldType = field.type?.toLowerCase() || 'string';
        switch (fieldType) {
            case 'string':
            case 'varchar':
            case 'text':
                return `Sample ${field.name} ${Math.random().toString(36).substring(7)}`;
            case 'int':
            case 'integer':
            case 'number':
                return Math.floor(Math.random() * 1000);
            case 'float':
            case 'decimal':
                return Math.round(Math.random() * 100 * 100) / 100;
            case 'boolean':
                return Math.random() > 0.5;
            case 'date':
            case 'datetime':
                return this.randomDate();
            case 'email':
                return `user${Math.floor(Math.random() * 1000)}@example.com`;
            case 'url':
                return `https://example.com/${field.name}/${Math.random().toString(36).substring(7)}`;
            default:
                return `Sample ${field.name}`;
        }
    }
    randomDate() {
        const start = new Date(2020, 0, 1);
        const end = new Date();
        const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
        return new Date(randomTime).toISOString();
    }
    // Export data to files
    async exportToFile(data, filename) {
        const fs = require('fs').promises;
        const path = require('path');
        const outputPath = path.join(this.config.outputPath || './mock-data', filename);
        await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
        console.log(`📁 Mock data exported to: ${outputPath}`);
    }
    // Generate and export all data types
    async generateAll() {
        console.log('🎭 Generating mock data with MockTail...');
        const users = this.generate('user', this.config.seedCount || 50);
        const posts = this.generate('post', this.config.seedCount || 30);
        const products = this.generate('product', this.config.seedCount || 25);
        const orders = this.generate('order', this.config.seedCount || 20);
        await this.exportToFile(users, 'users.json');
        await this.exportToFile(posts, 'posts.json');
        await this.exportToFile(products, 'products.json');
        await this.exportToFile(orders, 'orders.json');
        console.log('✅ Mock data generation complete!');
    }
}
exports.MockTailService = MockTailService;
function createMockTailService(config) {
    return new MockTailService(config);
}
exports.createMockTailService = createMockTailService;
//# sourceMappingURL=MockTailService.js.map