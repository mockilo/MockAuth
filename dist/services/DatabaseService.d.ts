import { User } from '../types';
export interface DatabaseConfig {
    type: 'memory' | 'sqlite' | 'postgresql' | 'mysql';
    connectionString?: string;
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    ssl?: boolean;
}
export interface DatabaseAdapter {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    createUser(user: Omit<User, 'id'>): Promise<User>;
    getUserById(id: string): Promise<User | null>;
    getUserByEmail(email: string): Promise<User | null>;
    updateUser(id: string, updates: Partial<User>): Promise<User | null>;
    deleteUser(id: string): Promise<boolean>;
    getAllUsers(): Promise<User[]>;
    createSession(sessionData: any): Promise<any>;
    getSession(sessionId: string): Promise<any>;
    deleteSession(sessionId: string): Promise<boolean>;
}
export declare class InMemoryDatabaseAdapter implements DatabaseAdapter {
    private users;
    private sessions;
    private nextUserId;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    createUser(userData: Omit<User, 'id'>): Promise<User>;
    getUserById(id: string): Promise<User | null>;
    getUserByEmail(email: string): Promise<User | null>;
    updateUser(id: string, updates: Partial<User>): Promise<User | null>;
    deleteUser(id: string): Promise<boolean>;
    getAllUsers(): Promise<User[]>;
    createSession(sessionData: any): Promise<any>;
    getSession(sessionId: string): Promise<any>;
    deleteSession(sessionId: string): Promise<boolean>;
}
export declare class SQLiteDatabaseAdapter implements DatabaseAdapter {
    private db;
    private config;
    constructor(config: DatabaseConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private initializeTables;
    createUser(userData: Omit<User, 'id'>): Promise<User>;
    getUserById(id: string): Promise<User | null>;
    getUserByEmail(email: string): Promise<User | null>;
    updateUser(id: string, updates: Partial<User>): Promise<User | null>;
    deleteUser(id: string): Promise<boolean>;
    getAllUsers(): Promise<User[]>;
    createSession(sessionData: any): Promise<any>;
    getSession(sessionId: string): Promise<any>;
    deleteSession(sessionId: string): Promise<boolean>;
    private mapRowToUser;
}
export declare class DatabaseService {
    private adapter;
    constructor(config: DatabaseConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    createUser(userData: Omit<User, 'id'>): Promise<User>;
    getUserById(id: string): Promise<User | null>;
    getUserByEmail(email: string): Promise<User | null>;
    updateUser(id: string, updates: Partial<User>): Promise<User | null>;
    deleteUser(id: string): Promise<boolean>;
    getAllUsers(): Promise<User[]>;
    createSession(sessionData: any): Promise<any>;
    getSession(sessionId: string): Promise<any>;
    deleteSession(sessionId: string): Promise<boolean>;
}
export declare function createDatabaseService(config: DatabaseConfig): DatabaseService;
//# sourceMappingURL=DatabaseService.d.ts.map