import { MockTailConfig } from '../types';
export interface MockDataGenerator {
    generate(type: string, count: number): any[];
    generateForSchema(schema: any, count: number): any[];
}
export declare class MockTailService implements MockDataGenerator {
    private config;
    constructor(config: MockTailConfig);
    generate(type: string, count?: number): any[];
    generateForSchema(schema: any, count?: number): any[];
    private generateUser;
    private generatePost;
    private generateProduct;
    private generateOrder;
    private generateOrderItems;
    private generateGeneric;
    private generateFieldValue;
    private randomDate;
    exportToFile(data: any[], filename: string): Promise<void>;
    generateAll(): Promise<void>;
}
export declare function createMockTailService(config: MockTailConfig): MockTailService;
//# sourceMappingURL=MockTailService.d.ts.map