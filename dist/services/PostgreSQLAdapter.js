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
exports.PostgreSQLAdapter = void 0;
class PostgreSQLAdapter {
    constructor(config) {
        this.config = config;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { Client } = yield Promise.resolve().then(() => __importStar(require('pg')));
                this.client = new Client({
                    connectionString: this.config.connectionString,
                    ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
                });
                yield this.client.connect();
                yield this.initializeTables();
                console.log('💾 Connected to PostgreSQL database');
            }
            catch (error) {
                console.warn('⚠️ PostgreSQL not available, falling back to in-memory:', error.message);
                throw error;
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.client) {
                yield this.client.end();
                console.log('💾 Disconnected from PostgreSQL database');
            }
        });
    }
    initializeTables() {
        return __awaiter(this, void 0, void 0, function* () {
            const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        roles JSONB DEFAULT '[]',
        permissions JSONB DEFAULT '[]',
        mfa JSONB,
        is_active BOOLEAN DEFAULT true,
        is_locked BOOLEAN DEFAULT false,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
            const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `;
            const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    `;
            yield this.client.query(createUsersTable);
            yield this.client.query(createSessionsTable);
            yield this.client.query(createIndexes);
        });
    }
    createUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const id = Math.random().toString(36).substring(7);
            const user = Object.assign(Object.assign({ id }, userData), { createdAt: new Date(), updatedAt: new Date() });
            const query = `
      INSERT INTO users (id, email, username, password, first_name, last_name, roles, permissions, mfa, is_active, is_locked, failed_login_attempts, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
            const values = [
                user.id,
                user.email,
                user.username,
                user.password,
                ((_a = user.profile) === null || _a === void 0 ? void 0 : _a.firstName) || null,
                ((_b = user.profile) === null || _b === void 0 ? void 0 : _b.lastName) || null,
                JSON.stringify(user.roles || []),
                JSON.stringify(user.permissions || []),
                JSON.stringify(user.mfa || null),
                user.isActive,
                user.isLocked,
                user.failedLoginAttempts,
                user.createdAt,
                user.updatedAt,
            ];
            const result = yield this.client.query(query, values);
            return this.mapRowToUser(result.rows[0]);
        });
    }
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = 'SELECT * FROM users WHERE id = $1';
            const result = yield this.client.query(query, [id]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRowToUser(result.rows[0]);
        });
    }
    getUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = 'SELECT * FROM users WHERE email = $1';
            const result = yield this.client.query(query, [email]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRowToUser(result.rows[0]);
        });
    }
    updateUser(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const user = yield this.getUserById(id);
            if (!user) {
                return null;
            }
            const updatedUser = Object.assign(Object.assign(Object.assign({}, user), updates), { updatedAt: new Date() });
            const query = `
      UPDATE users SET 
        email = $1, username = $2, password = $3, first_name = $4, last_name = $5,
        roles = $6, permissions = $7, mfa = $8, is_active = $9, is_locked = $10,
        failed_login_attempts = $11, locked_until = $12, updated_at = $13
      WHERE id = $14
      RETURNING *
    `;
            const values = [
                updatedUser.email,
                updatedUser.username,
                updatedUser.password,
                ((_a = updatedUser.profile) === null || _a === void 0 ? void 0 : _a.firstName) || null,
                ((_b = updatedUser.profile) === null || _b === void 0 ? void 0 : _b.lastName) || null,
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
            const result = yield this.client.query(query, values);
            return this.mapRowToUser(result.rows[0]);
        });
    }
    deleteUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = 'DELETE FROM users WHERE id = $1';
            const result = yield this.client.query(query, [id]);
            return result.rowCount > 0;
        });
    }
    getAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            const query = 'SELECT * FROM users ORDER BY created_at DESC';
            const result = yield this.client.query(query);
            return result.rows.map((row) => this.mapRowToUser(row));
        });
    }
    createSession(sessionData) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionId = Math.random().toString(36).substring(7);
            const session = Object.assign(Object.assign({ id: sessionId }, sessionData), { createdAt: new Date() });
            const query = `
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
            const values = [
                session.id,
                session.userId,
                session.token,
                session.expiresAt,
                session.createdAt,
            ];
            const result = yield this.client.query(query, values);
            return {
                id: result.rows[0].id,
                userId: result.rows[0].user_id,
                token: result.rows[0].token,
                expiresAt: result.rows[0].expires_at,
                createdAt: result.rows[0].created_at,
            };
        });
    }
    getSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = 'SELECT * FROM sessions WHERE id = $1';
            const result = yield this.client.query(query, [sessionId]);
            if (result.rows.length === 0) {
                return null;
            }
            return {
                id: result.rows[0].id,
                userId: result.rows[0].user_id,
                token: result.rows[0].token,
                expiresAt: result.rows[0].expires_at,
                createdAt: result.rows[0].created_at,
            };
        });
    }
    deleteSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = 'DELETE FROM sessions WHERE id = $1';
            const result = yield this.client.query(query, [sessionId]);
            return result.rowCount > 0;
        });
    }
    mapRowToUser(row) {
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
exports.PostgreSQLAdapter = PostgreSQLAdapter;
//# sourceMappingURL=PostgreSQLAdapter.js.map