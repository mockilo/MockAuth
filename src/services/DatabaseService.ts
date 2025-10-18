import { User, MFAConfig } from '../types';
import { PostgreSQLAdapter } from './PostgreSQLAdapter';
import { MySQLAdapter } from './MySQLAdapter';

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

// In-Memory Database Adapter
export class InMemoryDatabaseAdapter implements DatabaseAdapter {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, any> = new Map();
  private nextUserId = 1;

  async connect(): Promise<void> {
    console.log('💾 Connected to in-memory database');
  }

  async disconnect(): Promise<void> {
    console.log('💾 Disconnected from in-memory database');
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const id = this.nextUserId.toString();
    this.nextUserId++;

    const user: User = {
      id,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(id, user);
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) {
      return null;
    }

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createSession(sessionData: any): Promise<any> {
    const sessionId = Math.random().toString(36).substring(7);
    const session = {
      id: sessionId,
      ...sessionData,
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  async getSession(sessionId: string): Promise<any> {
    return this.sessions.get(sessionId) || null;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }
}

// SQLite Database Adapter
export class SQLiteDatabaseAdapter implements DatabaseAdapter {
  private db: any;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      const sqlite3 = require('sqlite3').verbose();
      const dbPath = this.config.connectionString || './mockauth.db';

      this.db = new sqlite3.Database(dbPath, (err: any) => {
        if (err) {
          console.error('❌ SQLite connection error:', err.message);
          throw err;
        }
        console.log('💾 Connected to SQLite database');
      });

      await this.initializeTables();
    } catch (error) {
      console.warn(
        '⚠️ SQLite not available, falling back to in-memory:',
        (error as Error).message
      );
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close((err: any) => {
        if (err) {
          console.error('❌ SQLite disconnect error:', err.message);
        } else {
          console.log('💾 Disconnected from SQLite database');
        }
      });
    }
  }

  private async initializeTables(): Promise<void> {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        firstName TEXT,
        lastName TEXT,
        roles TEXT,
        permissions TEXT,
        mfa TEXT,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        token TEXT NOT NULL,
        expiresAt DATETIME NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `;

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(createUsersTable);
        this.db.run(createSessionsTable, (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const id = Math.random().toString(36).substring(7);
    const user: User = {
      id,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO users (id, email, username, password, firstName, lastName, roles, permissions, mfa, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        [
          user.id,
          user.email,
          user.username,
          user.password,
          user.profile?.firstName || null,
          user.profile?.lastName || null,
          JSON.stringify(user.roles || []),
          JSON.stringify(user.permissions || []),
          JSON.stringify(user.mfa || null),
          user.isActive ? 1 : 0,
          user.createdAt.toISOString(),
          user.updatedAt.toISOString(),
        ],
        function (err: any) {
          if (err) {
            reject(err);
          } else {
            resolve(user);
          }
        }
      );

      stmt.finalize();
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE id = ?',
        [id],
        (err: any, row: any) => {
          if (err) {
            reject(err);
          } else if (row) {
            resolve(this.mapRowToUser(row));
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err: any, row: any) => {
          if (err) {
            reject(err);
          } else if (row) {
            resolve(this.mapRowToUser(row));
          } else {
            resolve(null);
          }
        }
      );
    });
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

    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        UPDATE users SET 
          email = ?, username = ?, password = ?, firstName = ?, lastName = ?,
          roles = ?, permissions = ?, mfa = ?, isActive = ?, updatedAt = ?
        WHERE id = ?
      `);

      stmt.run(
        [
          updatedUser.email,
          updatedUser.username,
          updatedUser.password,
          updatedUser.profile?.firstName || null,
          updatedUser.profile?.lastName || null,
          JSON.stringify(updatedUser.roles || []),
          JSON.stringify(updatedUser.permissions || []),
          JSON.stringify(updatedUser.mfa || null),
          updatedUser.isActive ? 1 : 0,
          updatedUser.updatedAt.toISOString(),
          id,
        ],
        function (err: any) {
          if (err) {
            reject(err);
          } else {
            resolve(updatedUser);
          }
        }
      );

      stmt.finalize();
    });
  }

  async deleteUser(id: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM users WHERE id = ?',
        [id],
        function (this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  async getAllUsers(): Promise<User[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM users', [], (err: any, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map((row) => this.mapRowToUser(row)));
        }
      });
    });
  }

  async createSession(sessionData: any): Promise<any> {
    const sessionId = Math.random().toString(36).substring(7);
    const session = {
      id: sessionId,
      ...sessionData,
      createdAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO sessions (id, userId, token, expiresAt, createdAt)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        [
          session.id,
          session.userId,
          session.token,
          session.expiresAt.toISOString(),
          session.createdAt.toISOString(),
        ],
        function (err: any) {
          if (err) {
            reject(err);
          } else {
            resolve(session);
          }
        }
      );

      stmt.finalize();
    });
  }

  async getSession(sessionId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM sessions WHERE id = ?',
        [sessionId],
        (err: any, row: any) => {
          if (err) {
            reject(err);
          } else if (row) {
            resolve({
              id: row.id,
              userId: row.userId,
              token: row.token,
              expiresAt: new Date(row.expiresAt),
              createdAt: new Date(row.createdAt),
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM sessions WHERE id = ?',
        [sessionId],
        function (this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      password: row.password,
      profile: {
        firstName: row.firstName,
        lastName: row.lastName,
      },
      roles: row.roles ? JSON.parse(row.roles) : [],
      permissions: row.permissions ? JSON.parse(row.permissions) : [],
      mfa: row.mfa ? JSON.parse(row.mfa) : null,
      isActive: Boolean(row.isActive),
      isLocked: Boolean(row.isLocked || false),
      failedLoginAttempts: row.failedLoginAttempts || 0,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}

export class DatabaseService {
  private adapter: DatabaseAdapter;

  constructor(config: DatabaseConfig) {
    switch (config.type) {
      case 'postgresql':
        this.adapter = new PostgreSQLAdapter(config);
        break;
      case 'mysql':
        this.adapter = new MySQLAdapter(config);
        break;
      case 'sqlite':
        this.adapter = new SQLiteDatabaseAdapter(config);
        break;
      case 'memory':
      default:
        this.adapter = new InMemoryDatabaseAdapter();
        break;
    }
  }

  async connect(): Promise<void> {
    try {
      await this.adapter.connect();
    } catch (error) {
      console.warn('⚠️ Database connection failed, using in-memory fallback');
      this.adapter = new InMemoryDatabaseAdapter();
      await this.adapter.connect();
    }
  }

  async disconnect(): Promise<void> {
    await this.adapter.disconnect();
  }

  // User methods
  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    return this.adapter.createUser(userData);
  }

  async getUserById(id: string): Promise<User | null> {
    return this.adapter.getUserById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.adapter.getUserByEmail(email);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    return this.adapter.updateUser(id, updates);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.adapter.deleteUser(id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.adapter.getAllUsers();
  }

  // Session methods
  async createSession(sessionData: any): Promise<any> {
    return this.adapter.createSession(sessionData);
  }

  async getSession(sessionId: string): Promise<any> {
    return this.adapter.getSession(sessionId);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.adapter.deleteSession(sessionId);
  }
}

export function createDatabaseService(config: DatabaseConfig): DatabaseService {
  return new DatabaseService(config);
}
