"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEcosystemService = exports.EcosystemService = void 0;
class EcosystemService {
    constructor(config) {
        this.mocktailProcess = null;
        this.schemaghostProcess = null;
        this.mocktailConfig = config.mocktail;
        this.schemaghostConfig = config.schemaghost;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.mocktailConfig.enabled) {
                yield this.initializeMockTail();
            }
            if (this.schemaghostConfig.enabled) {
                yield this.initializeSchemaGhost();
            }
        });
    }
    initializeMockTail() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { createMockTailService } = yield Promise.resolve().then(() => __importStar(require('./MockTailService')));
                this.mocktailService = createMockTailService(this.mocktailConfig);
                // Generate initial mock data
                yield this.mocktailService.generateAll();
                console.log('🎭 MockTail initialized - Mock data generation ready');
                console.log('   Schema path:', this.mocktailConfig.prismaSchemaPath || './prisma/schema.prisma');
                console.log('   Output path:', this.mocktailConfig.outputPath || './mock-data');
                console.log('   Seed count:', this.mocktailConfig.seedCount || 100);
            }
            catch (error) {
                console.warn('⚠️ MockTail not available:', error.message);
            }
        });
    }
    initializeSchemaGhost() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { createSchemaGhostService } = yield Promise.resolve().then(() => __importStar(require('./SchemaGhostService')));
                this.schemaghostService = createSchemaGhostService(this.schemaghostConfig);
                // Add dynamic endpoints
                this.schemaghostService.addDynamicEndpoints();
                // Start the server with port conflict handling
                yield this.schemaghostService.start();
                this.schemaghostProcess = this.schemaghostService;
                console.log('👻 SchemaGhost initialized - Mock API server ready');
                console.log('   Port:', this.schemaghostConfig.port || 3002);
                console.log('   Endpoints:', this.schemaghostService.getEndpoints().length);
                console.log('   Delay:', this.schemaghostConfig.delay || 0, 'ms');
                console.log('   Error rate:', this.schemaghostConfig.errorRate || 0);
            }
            catch (error) {
                const errorMessage = error.message;
                if (errorMessage.includes('EADDRINUSE') || errorMessage.includes('already in use')) {
                    console.warn('⚠️ SchemaGhost not available: Port is already in use');
                    console.log('💡 SchemaGhost will be disabled for this session');
                    console.log('   You can manually stop the existing service or use a different port');
                }
                else {
                    console.warn('⚠️ SchemaGhost not available:', errorMessage);
                }
            }
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.schemaghostProcess) {
                yield this.schemaghostProcess.stop();
                console.log('👻 SchemaGhost stopped');
            }
        });
    }
    getMockTailConfig() {
        return Object.assign({}, this.mocktailConfig);
    }
    getSchemaGhostConfig() {
        return Object.assign({}, this.schemaghostConfig);
    }
    generateMockData(type_1) {
        return __awaiter(this, arguments, void 0, function* (type, count = 10) {
            if (!this.mocktailConfig.enabled) {
                throw new Error('MockTail is not enabled');
            }
            try {
                if (this.mocktailService) {
                    return this.mocktailService.generate(type, count);
                }
                else {
                    // Fallback implementation
                    const mockData = [];
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
            }
            catch (error) {
                throw new Error(`Failed to generate mock data: ${error.message}`);
            }
        });
    }
    createMockEndpoint(path, method, response) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.schemaghostConfig.enabled) {
                throw new Error('SchemaGhost is not enabled');
            }
            try {
                if (this.schemaghostService) {
                    this.schemaghostService.addEndpoint({
                        path,
                        method: method,
                        response,
                        statusCode: 200,
                    });
                    console.log(`👻 Created mock endpoint: ${method} ${path}`);
                }
                else {
                    console.log(`👻 Mock endpoint created: ${method} ${path}`);
                }
            }
            catch (error) {
                throw new Error(`Failed to create mock endpoint: ${error.message}`);
            }
        });
    }
}
exports.EcosystemService = EcosystemService;
function createEcosystemService(config) {
    return new EcosystemService(config);
}
exports.createEcosystemService = createEcosystemService;
//# sourceMappingURL=EcosystemService.js.map