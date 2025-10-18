"use strict";
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
exports.createDatabaseService = exports.DatabaseService = exports.SQLiteDatabaseAdapter = exports.InMemoryDatabaseAdapter = void 0;
const PostgreSQLAdapter_1 = require("./PostgreSQLAdapter");
const MySQLAdapter_1 = require("./MySQLAdapter");
// In-Memory Database Adapter
class InMemoryDatabaseAdapter {
    constructor() {
        this.users = new Map();
        this.sessions = new Map();
        this.nextUserId = 1;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('💾 Connected to in-memory database');
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('💾 Disconnected from in-memory database');
        });
    }
    createUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = this.nextUserId.toString();
            this.nextUserId++;
            const user = Object.assign(Object.assign({ id }, userData), { createdAt: new Date(), updatedAt: new Date() });
            this.users.set(id, user);
            return user;
        });
    }
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.users.get(id) || null;
        });
    }
    getUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const user of this.users.values()) {
                if (user.email === email) {
                    return user;
                }
            }
            return null;
        });
    }
    updateUser(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = this.users.get(id);
            if (!user) {
                return null;
            }
            const updatedUser = Object.assign(Object.assign(Object.assign({}, user), updates), { updatedAt: new Date() });
            this.users.set(id, updatedUser);
            return updatedUser;
        });
    }
    deleteUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.users.delete(id);
        });
    }
    getAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return Array.from(this.users.values());
        });
    }
    createSession(sessionData) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionId = Math.random().toString(36).substring(7);
            const session = Object.assign(Object.assign({ id: sessionId }, sessionData), { createdAt: new Date() });
            this.sessions.set(sessionId, session);
            return session;
        });
    }
    getSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sessions.get(sessionId) || null;
        });
    }
    deleteSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sessions.delete(sessionId);
        });
    }
}
exports.InMemoryDatabaseAdapter = InMemoryDatabaseAdapter;
// SQLite Database Adapter
class SQLiteDatabaseAdapter {
    constructor(config) {
        this.config = config;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sqlite3 = require('sqlite3').verbose();
                const dbPath = this.config.connectionString || './mockauth.db';
                this.db = new sqlite3.Database(dbPath, (err) => {
                    if (err) {
                        console.error('❌ SQLite connection error:', err.message);
                        throw err;
                    }
                    console.log('💾 Connected to SQLite database');
                });
                yield this.initializeTables();
            }
            catch (error) {
                console.warn('⚠️ SQLite not available, falling back to in-memory:', error.message);
                throw error;
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('❌ SQLite disconnect error:', err.message);
                    }
                    else {
                        console.log('💾 Disconnected from SQLite database');
                    }
                });
            }
        });
    }
    initializeTables() {
        return __awaiter(this, void 0, void 0, function* () {
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
                    this.db.run(createSessionsTable, (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });
                });
            });
        });
    }
    createUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = Math.random().toString(36).substring(7);
            const user = Object.assign(Object.assign({ id }, userData), { createdAt: new Date(), updatedAt: new Date() });
            return new Promise((resolve, reject) => {
                var _a, _b;
                const stmt = this.db.prepare(`
        INSERT INTO users (id, email, username, password, firstName, lastName, roles, permissions, mfa, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
                stmt.run([
                    user.id,
                    user.email,
                    user.username,
                    user.password,
                    ((_a = user.profile) === null || _a === void 0 ? void 0 : _a.firstName) || null,
                    ((_b = user.profile) === null || _b === void 0 ? void 0 : _b.lastName) || null,
                    JSON.stringify(user.roles || []),
                    JSON.stringify(user.permissions || []),
                    JSON.stringify(user.mfa || null),
                    user.isActive ? 1 : 0,
                    user.createdAt.toISOString(),
                    user.updatedAt.toISOString(),
                ], function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(user);
                    }
                });
                stmt.finalize();
            });
        });
    }
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                    if (err) {
                        reject(err);
                    }
                    else if (row) {
                        resolve(this.mapRowToUser(row));
                    }
                    else {
                        resolve(null);
                    }
                });
            });
        });
    }
    getUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                    if (err) {
                        reject(err);
                    }
                    else if (row) {
                        resolve(this.mapRowToUser(row));
                    }
                    else {
                        resolve(null);
                    }
                });
            });
        });
    }
    updateUser(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getUserById(id);
            if (!user) {
                return null;
            }
            const updatedUser = Object.assign(Object.assign(Object.assign({}, user), updates), { updatedAt: new Date() });
            return new Promise((resolve, reject) => {
                var _a, _b;
                const stmt = this.db.prepare(`
        UPDATE users SET 
          email = ?, username = ?, password = ?, firstName = ?, lastName = ?,
          roles = ?, permissions = ?, mfa = ?, isActive = ?, updatedAt = ?
        WHERE id = ?
      `);
                stmt.run([
                    updatedUser.email,
                    updatedUser.username,
                    updatedUser.password,
                    ((_a = updatedUser.profile) === null || _a === void 0 ? void 0 : _a.firstName) || null,
                    ((_b = updatedUser.profile) === null || _b === void 0 ? void 0 : _b.lastName) || null,
                    JSON.stringify(updatedUser.roles || []),
                    JSON.stringify(updatedUser.permissions || []),
                    JSON.stringify(updatedUser.mfa || null),
                    updatedUser.isActive ? 1 : 0,
                    updatedUser.updatedAt.toISOString(),
                    id,
                ], function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(updatedUser);
                    }
                });
                stmt.finalize();
            });
        });
    }
    deleteUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(this.changes > 0);
                    }
                });
            });
        });
    }
    getAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.all('SELECT * FROM users', [], (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(rows.map((row) => this.mapRowToUser(row)));
                    }
                });
            });
        });
    }
    createSession(sessionData) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessionId = Math.random().toString(36).substring(7);
            const session = Object.assign(Object.assign({ id: sessionId }, sessionData), { createdAt: new Date() });
            return new Promise((resolve, reject) => {
                const stmt = this.db.prepare(`
        INSERT INTO sessions (id, userId, token, expiresAt, createdAt)
        VALUES (?, ?, ?, ?, ?)
      `);
                stmt.run([
                    session.id,
                    session.userId,
                    session.token,
                    session.expiresAt.toISOString(),
                    session.createdAt.toISOString(),
                ], function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(session);
                    }
                });
                stmt.finalize();
            });
        });
    }
    getSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.get('SELECT * FROM sessions WHERE id = ?', [sessionId], (err, row) => {
                    if (err) {
                        reject(err);
                    }
                    else if (row) {
                        resolve({
                            id: row.id,
                            userId: row.userId,
                            token: row.token,
                            expiresAt: new Date(row.expiresAt),
                            createdAt: new Date(row.createdAt),
                        });
                    }
                    else {
                        resolve(null);
                    }
                });
            });
        });
    }
    deleteSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.db.run('DELETE FROM sessions WHERE id = ?', [sessionId], function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(this.changes > 0);
                    }
                });
            });
        });
    }
    mapRowToUser(row) {
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
exports.SQLiteDatabaseAdapter = SQLiteDatabaseAdapter;
class DatabaseService {
    constructor(config) {
        switch (config.type) {
            case 'postgresql':
                this.adapter = new PostgreSQLAdapter_1.PostgreSQLAdapter(config);
                break;
            case 'mysql':
                this.adapter = new MySQLAdapter_1.MySQLAdapter(config);
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
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.adapter.connect();
            }
            catch (error) {
                console.warn('⚠️ Database connection failed, using in-memory fallback');
                this.adapter = new InMemoryDatabaseAdapter();
                yield this.adapter.connect();
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.adapter.disconnect();
        });
    }
    // User methods
    createUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.createUser(userData);
        });
    }
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.getUserById(id);
        });
    }
    getUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.getUserByEmail(email);
        });
    }
    updateUser(id, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.updateUser(id, updates);
        });
    }
    deleteUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.deleteUser(id);
        });
    }
    getAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.getAllUsers();
        });
    }
    // Session methods
    createSession(sessionData) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.createSession(sessionData);
        });
    }
    getSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.getSession(sessionId);
        });
    }
    deleteSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.deleteSession(sessionId);
        });
    }
}
exports.DatabaseService = DatabaseService;
function createDatabaseService(config) {
    return new DatabaseService(config);
}
exports.createDatabaseService = createDatabaseService;
//# sourceMappingURL=DatabaseService.js.map