import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { User, CreateUserRequest, UpdateUserRequest, UserProfile } from '../types';

export class UserService {
  private users: Map<string, User> = new Map();
  private emailIndex: Map<string, string> = new Map();
  private usernameIndex: Map<string, string> = new Map();

  constructor(initialUsers: Partial<User>[] = []) {
    this.initializeUsers(initialUsers);
  }

  private async initializeUsers(initialUsers: Partial<User>[]): Promise<void> {
    for (const userData of initialUsers) {
      const user = await this.createUserFromData(userData);
      this.users.set(user.id, user);
      this.emailIndex.set(user.email.toLowerCase(), user.id);
      this.usernameIndex.set(user.username.toLowerCase(), user.id);
    }
  }

  private async createUserFromData(userData: Partial<User>): Promise<User> {
    const now = new Date();
    const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : undefined;

    return {
      id: userData.id || uuidv4(),
      email: userData.email || '',
      username: userData.username || '',
      password: hashedPassword,
      roles: userData.roles || ['user'],
      permissions: userData.permissions || ['read:profile'],
      profile: userData.profile || {},
      metadata: userData.metadata || {},
      createdAt: userData.createdAt || now,
      updatedAt: now,
      lastLoginAt: userData.lastLoginAt,
      isActive: userData.isActive !== false,
      isLocked: userData.isLocked || false,
      failedLoginAttempts: userData.failedLoginAttempts || 0,
      lockedUntil: userData.lockedUntil,
    };
  }

  async createUser(request: CreateUserRequest): Promise<User> {
    // Check if user already exists
    if (this.emailIndex.has(request.email.toLowerCase())) {
      throw new Error('User with this email already exists');
    }

    if (this.usernameIndex.has(request.username.toLowerCase())) {
      throw new Error('User with this username already exists');
    }

    const user = await this.createUserFromData({
      email: request.email,
      username: request.username,
      password: request.password,
      roles: request.roles || ['user'],
      permissions: request.permissions || ['read:profile'],
      profile: request.profile,
      metadata: request.metadata,
    });

    this.users.set(user.id, user);
    this.emailIndex.set(user.email.toLowerCase(), user.id);
    this.usernameIndex.set(user.username.toLowerCase(), user.id);

    return user;
  }

  createUserSync(userData: any): User {
    const user = {
      id: Math.random().toString(36).substr(2, 9),
      email: userData.email,
      username: userData.username,
      password: userData.password,
      roles: userData.roles || ['user'],
      permissions: userData.permissions || ['read:profile'],
      profile: userData.profile || {},
      metadata: userData.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      isLocked: false,
      failedLoginAttempts: 0
    };

    this.users.set(user.id, user);
    this.emailIndex.set(user.email.toLowerCase(), user.id);
    this.usernameIndex.set(user.username.toLowerCase(), user.id);

    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const userId = this.emailIndex.get(email.toLowerCase());
    return userId ? this.users.get(userId) || null : null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const userId = this.usernameIndex.get(username.toLowerCase());
    return userId ? this.users.get(userId) || null : null;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: string, updates: UpdateUserRequest): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) {
      return null;
    }

    // Check for email conflicts
    if (updates.profile?.firstName !== undefined || updates.profile?.lastName !== undefined) {
      // Profile update - no conflicts
    }

    const updatedUser: User = {
      ...user,
      ...updates,
      profile: { ...user.profile, ...updates.profile },
      metadata: { ...user.metadata, ...updates.metadata },
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) {
      return false;
    }

    this.users.delete(id);
    this.emailIndex.delete(user.email.toLowerCase());
    this.usernameIndex.delete(user.username.toLowerCase());
    return true;
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.password) {
      return null;
    }

    // Check if account is locked
    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('Account is locked due to too many failed login attempts');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Increment failed login attempts
      const updatedUser = await this.updateUser(user.id, {
        failedLoginAttempts: user.failedLoginAttempts + 1,
      });

      // Lock account if max attempts reached
      if (updatedUser && updatedUser.failedLoginAttempts >= 5) {
        const lockoutDuration = 15 * 60 * 1000; // 15 minutes
        await this.updateUser(user.id, {
          isLocked: true,
          lockedUntil: new Date(Date.now() + lockoutDuration),
        });
      }

      return null;
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await this.updateUser(user.id, {
        failedLoginAttempts: 0,
        isLocked: false,
        lockedUntil: undefined,
      });
    }

    // Update last login time
    await this.updateUser(user.id, {
      lastLoginAt: new Date(),
    });

    return user;
  }

  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    const searchTerm = query.toLowerCase();
    const results: User[] = [];

    for (const user of this.users.values()) {
      if (results.length >= limit) break;

      if (
        user.email.toLowerCase().includes(searchTerm) ||
        user.username.toLowerCase().includes(searchTerm) ||
        user.profile?.firstName?.toLowerCase().includes(searchTerm) ||
        user.profile?.lastName?.toLowerCase().includes(searchTerm)
      ) {
        results.push(user);
      }
    }

    return results;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.roles.includes(role));
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    return user.permissions.includes(permission);
  }

  async hasRole(userId: string, role: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    return user.roles.includes(role);
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    locked: number;
    byRole: Record<string, number>;
  }> {
    const users = Array.from(this.users.values());
    const stats = {
      total: users.length,
      active: users.filter(u => u.isActive && !u.isLocked).length,
      locked: users.filter(u => u.isLocked).length,
      byRole: {} as Record<string, number>,
    };

    // Count users by role
    for (const user of users) {
      for (const role of user.roles) {
        stats.byRole[role] = (stats.byRole[role] || 0) + 1;
      }
    }

    return stats;
  }

  async validatePassword(password: string, policy?: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  }): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!policy) {
      return { valid: true, errors: [] };
    }

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
