import { User, CreateUserRequest, UpdateUserRequest } from '../types';
export declare class UserService {
    private users;
    private emailIndex;
    private usernameIndex;
    constructor(initialUsers?: Partial<User>[]);
    private initializeUsers;
    private createUserFromData;
    createUser(request: CreateUserRequest): Promise<User>;
    createUserSync(userData: any): User;
    getUserById(id: string): Promise<User | null>;
    getUserByEmail(email: string): Promise<User | null>;
    getUserByUsername(username: string): Promise<User | null>;
    getAllUsers(): Promise<User[]>;
    updateUser(id: string, updates: UpdateUserRequest): Promise<User | null>;
    deleteUser(id: string): Promise<boolean>;
    authenticateUser(email: string, password: string): Promise<User | null>;
    searchUsers(query: string, limit?: number): Promise<User[]>;
    getUsersByRole(role: string): Promise<User[]>;
    hasPermission(userId: string, permission: string): Promise<boolean>;
    hasRole(userId: string, role: string): Promise<boolean>;
    getUserStats(): Promise<{
        total: number;
        active: number;
        locked: number;
        byRole: Record<string, number>;
    }>;
    validatePassword(password: string, policy?: {
        minLength: number;
        requireUppercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
    }): Promise<{
        valid: boolean;
        errors: string[];
    }>;
}
//# sourceMappingURL=UserService.d.ts.map