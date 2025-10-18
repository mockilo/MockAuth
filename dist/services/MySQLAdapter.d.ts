import { DatabaseAdapter } from './DatabaseService';
import { User } from '../types';
export declare class MySQLAdapter implements DatabaseAdapter {
    private connection;
    private config;
    constructor(config: any);
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
//# sourceMappingURL=MySQLAdapter.d.ts.map