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
exports.MockAuthService = void 0;
const vue_1 = require("vue");
class MockAuthService {
    constructor(config) {
        this.userRef = (0, vue_1.ref)(null);
        this.tokenRef = (0, vue_1.ref)(null);
        this.isLoadingRef = (0, vue_1.ref)(true);
        this.config = config;
    }
    // Computed properties
    get isAuthenticated() {
        return (0, vue_1.computed)(() => !!this.userRef.value && !!this.tokenRef.value);
    }
    get user() {
        return this.userRef;
    }
    get token() {
        return this.tokenRef;
    }
    get isLoading() {
        return this.isLoadingRef;
    }
    // Initialize auth state from localStorage
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const storedToken = localStorage.getItem(this.config.tokenKey || 'mockauth_token');
                const storedUser = localStorage.getItem(this.config.userKey || 'mockauth_user');
                if (storedToken && storedUser) {
                    this.tokenRef.value = storedToken;
                    this.userRef.value = JSON.parse(storedUser);
                    // Verify token is still valid
                    const isValid = yield this.verifyToken(storedToken);
                    if (!isValid) {
                        yield this.logout();
                    }
                }
            }
            catch (error) {
                console.error('Failed to initialize auth:', error);
                yield this.logout();
            }
            finally {
                this.isLoadingRef.value = false;
            }
        });
    }
    verifyToken(tokenToVerify) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${this.config.baseUrl}/auth/verify`, {
                    headers: {
                        'Authorization': `Bearer ${tokenToVerify}`,
                        'Content-Type': 'application/json'
                    }
                });
                return response.ok;
            }
            catch (_a) {
                return false;
            }
        });
    }
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.isLoadingRef.value = true;
                const response = yield fetch(`${this.config.baseUrl}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                const data = yield response.json();
                if (data.success) {
                    const { user: userData, token: authToken } = data.data;
                    this.userRef.value = userData;
                    this.tokenRef.value = authToken;
                    localStorage.setItem(this.config.tokenKey || 'mockauth_token', authToken);
                    localStorage.setItem(this.config.userKey || 'mockauth_user', JSON.stringify(userData));
                    return { success: true };
                }
                else {
                    return { success: false, error: data.error || 'Login failed' };
                }
            }
            catch (error) {
                return { success: false, error: 'Network error' };
            }
            finally {
                this.isLoadingRef.value = false;
            }
        });
    }
    logout() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.tokenRef.value) {
                    yield fetch(`${this.config.baseUrl}/auth/logout`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${this.tokenRef.value}`,
                            'Content-Type': 'application/json'
                        }
                    });
                }
            }
            catch (error) {
                console.error('Logout error:', error);
            }
            finally {
                this.userRef.value = null;
                this.tokenRef.value = null;
                localStorage.removeItem(this.config.tokenKey || 'mockauth_token');
                localStorage.removeItem(this.config.userKey || 'mockauth_user');
            }
        });
    }
    register(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.isLoadingRef.value = true;
                const response = yield fetch(`${this.config.baseUrl}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
                const data = yield response.json();
                if (data.success) {
                    return { success: true };
                }
                else {
                    return { success: false, error: data.error || 'Registration failed' };
                }
            }
            catch (error) {
                return { success: false, error: 'Network error' };
            }
            finally {
                this.isLoadingRef.value = false;
            }
        });
    }
    refreshToken() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.tokenRef.value)
                    return false;
                const response = yield fetch(`${this.config.baseUrl}/auth/refresh`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.tokenRef.value}`,
                        'Content-Type': 'application/json'
                    }
                });
                const data = yield response.json();
                if (data.success) {
                    const newToken = data.data.token;
                    this.tokenRef.value = newToken;
                    localStorage.setItem(this.config.tokenKey || 'mockauth_token', newToken);
                    return true;
                }
                return false;
            }
            catch (error) {
                console.error('Token refresh error:', error);
                return false;
            }
        });
    }
    updateProfile(profile) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.tokenRef.value || !this.userRef.value)
                    return false;
                const response = yield fetch(`${this.config.baseUrl}/users/${this.userRef.value.id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.tokenRef.value}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ profile })
                });
                const data = yield response.json();
                if (data.success) {
                    const updatedUser = Object.assign(Object.assign({}, this.userRef.value), { profile: Object.assign(Object.assign({}, this.userRef.value.profile), profile) });
                    this.userRef.value = updatedUser;
                    localStorage.setItem(this.config.userKey || 'mockauth_user', JSON.stringify(updatedUser));
                    return true;
                }
                return false;
            }
            catch (error) {
                console.error('Profile update error:', error);
                return false;
            }
        });
    }
    // Helper methods for role and permission checking
    hasRole(role) {
        var _a;
        return ((_a = this.userRef.value) === null || _a === void 0 ? void 0 : _a.roles.includes(role)) || false;
    }
    hasAnyRole(roles) {
        return roles.some(role => this.hasRole(role));
    }
    hasAllRoles(roles) {
        return roles.every(role => this.hasRole(role));
    }
    hasPermission(permission) {
        var _a;
        return ((_a = this.userRef.value) === null || _a === void 0 ? void 0 : _a.permissions.includes(permission)) || false;
    }
    hasAnyPermission(permissions) {
        return permissions.some(permission => this.hasPermission(permission));
    }
    hasAllPermissions(permissions) {
        return permissions.every(permission => this.hasPermission(permission));
    }
}
exports.MockAuthService = MockAuthService;
//# sourceMappingURL=MockAuthService.js.map