import { DatabaseAdapter } from './DatabaseService';
import { User } from '../types';

export class MySQLAdapter implements DatabaseAdapter {
  private connection: any;
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      const mysql = await import('mysql2/promise');

      this.connection = await mysql.createConnection({
        host: this.config.host || 'localhost',
        port: this.config.port || 3306,
        user: this.config.username || 'root',
        password: this.config.password || '',
        database: this.config.database || 'mockauth',
        ssl: this.config.ssl ? { rejectUnauthorized: false } : undefined,
      });

      await this.initializeTables();
      console.log('💾 Connected to MySQL database');
    } catch (error) {
      console.warn(
        '⚠️ MySQL not available, falling back to in-memory:',
        (error as Error).message
      );
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      console.log('💾 Disconnected from MySQL database');
    }
  }

  private async initializeTables(): Promise<void> {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        roles JSON,
        permissions JSON,
        mfa JSON,
        is_active BOOLEAN DEFAULT true,
        is_locked BOOLEAN DEFAULT false,
        failed_login_attempts INT DEFAULT 0,
        locked_until TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    `;

    await this.connection.execute(createUsersTable);
    await this.connection.execute(createSessionsTable);
    await this.connection.execute(createIndexes);
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const id = Math.random().toString(36).substring(7);
    const user: User = {
      id,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const query = `
      INSERT INTO users (id, email, username, password, first_name, last_name, roles, permissions, mfa, is_active, is_locked, failed_login_attempts, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      user.id,
      user.email,
      user.username,
      user.password,
      user.profile?.firstName || null,
      user.profile?.lastName || null,
      JSON.stringify(user.roles || []),
      JSON.stringify(user.permissions || []),
      JSON.stringify(user.mfa || null),
      user.isActive,
      user.isLocked,
      user.failedLoginAttempts,
      user.createdAt,
      user.updatedAt,
    ];

    await this.connection.execute(query, values);
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = ?';
    const [rows] = await this.connection.execute(query, [id]);

    if (Array.isArray(rows) && rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(rows[0]);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await this.connection.execute(query, [email]);

    if (Array.isArray(rows) && rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(rows[0]);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = await this.getUserById(id);
    if (!user) {
      return null;
    }

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };

    const query = `
      UPDATE users SET 
        email = ?, username = ?, password = ?, first_name = ?, last_name = ?,
        roles = ?, permissions = ?, mfa = ?, is_active = ?, is_locked = ?,
        failed_login_attempts = ?, locked_until = ?, updated_at = ?
      WHERE id = ?
    `;

    const values = [
      updatedUser.email,
      updatedUser.username,
      updatedUser.password,
      updatedUser.profile?.firstName || null,
      updatedUser.profile?.lastName || null,
      JSON.stringify(updatedUser.roles || []),
      JSON.stringify(updatedUser.permissions || []),
      JSON.stringify(updatedUser.mfa || null),
      updatedUser.isActive,
      updatedUser.isLocked,
      updatedUser.failedLoginAttempts,
      updatedUser.lockedUntil,
      updatedUser.updatedAt,
      id,
    ];

    await this.connection.execute(query, values);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = ?';
    const [result] = await this.connection.execute(query, [id]);
    return (result as any).affectedRows > 0;
  }

  async getAllUsers(): Promise<User[]> {
    const query = 'SELECT * FROM users ORDER BY created_at DESC';
    const [rows] = await this.connection.execute(query);
    return (rows as any[]).map((row) => this.mapRowToUser(row));
  }

  async createSession(sessionData: any): Promise<any> {
    const sessionId = Math.random().toString(36).substring(7);
    const session = {
      id: sessionId,
      ...sessionData,
      createdAt: new Date(),
    };

    const query = `
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
      session.id,
      session.userId,
      session.token,
      session.expiresAt,
      session.createdAt,
    ];

    await this.connection.execute(query, values);
    return session;
  }

  async getSession(sessionId: string): Promise<any> {
    const query = 'SELECT * FROM sessions WHERE id = ?';
    const [rows] = await this.connection.execute(query, [sessionId]);

    if (Array.isArray(rows) && rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const query = 'DELETE FROM sessions WHERE id = ?';
    const [result] = await this.connection.execute(query, [sessionId]);
    return (result as any).affectedRows > 0;
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      password: row.password,
      profile: {
        firstName: row.first_name,
        lastName: row.last_name,
      },
      roles: row.roles ? JSON.parse(row.roles) : [],
      permissions: row.permissions ? JSON.parse(row.permissions) : [],
      mfa: row.mfa ? JSON.parse(row.mfa) : null,
      isActive: Boolean(row.is_active),
      isLocked: Boolean(row.is_locked),
      failedLoginAttempts: row.failed_login_attempts || 0,
      lockedUntil: row.locked_until ? new Date(row.locked_until) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
