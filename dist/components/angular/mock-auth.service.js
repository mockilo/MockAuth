"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAuthService = void 0;
const core_1 = require("@angular/core");
const rxjs_1 = require("rxjs");
const http_1 = require("@angular/common/http");
const operators_1 = require("rxjs/operators");
let MockAuthService = (() => {
    let _classDecorators = [(0, core_1.Injectable)({
            providedIn: 'root'
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var MockAuthService = _classThis = class {
        constructor(http) {
            this.http = http;
            this.userSubject = new rxjs_1.BehaviorSubject(null);
            this.tokenSubject = new rxjs_1.BehaviorSubject(null);
            this.loadingSubject = new rxjs_1.BehaviorSubject(true);
            this.user$ = this.userSubject.asObservable();
            this.token$ = this.tokenSubject.asObservable();
            this.loading$ = this.loadingSubject.asObservable();
            this.config = {
                baseUrl: 'http://localhost:3001',
                tokenKey: 'mockauth_token',
                userKey: 'mockauth_user',
                autoRefresh: true,
                refreshInterval: 300000 // 5 minutes
            };
        }
        // Initialize the service with configuration
        initialize(config) {
            this.config = Object.assign(Object.assign({}, this.config), config);
            this.initializeAuth();
        }
        // Get current values
        get user() {
            return this.userSubject.value;
        }
        get token() {
            return this.tokenSubject.value;
        }
        get isLoading() {
            return this.loadingSubject.value;
        }
        get isAuthenticated() {
            return !!this.user && !!this.token;
        }
        // Initialize auth state from localStorage
        initializeAuth() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const storedToken = localStorage.getItem(this.config.tokenKey);
                    const storedUser = localStorage.getItem(this.config.userKey);
                    if (storedToken && storedUser) {
                        this.tokenSubject.next(storedToken);
                        this.userSubject.next(JSON.parse(storedUser));
                        // Verify token is still valid
                        const isValid = yield this.verifyToken(storedToken);
                        if (!isValid) {
                            yield this.logout();
                        }
                        else if (this.config.autoRefresh) {
                            this.startTokenRefresh();
                        }
                    }
                }
                catch (error) {
                    console.error('Failed to initialize auth:', error);
                    yield this.logout();
                }
                finally {
                    this.loadingSubject.next(false);
                }
            });
        }
        verifyToken(token) {
            const headers = new http_1.HttpHeaders({
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            });
            return this.http.get(`${this.config.baseUrl}/auth/verify`, { headers })
                .pipe((0, operators_1.map)(() => true), (0, operators_1.catchError)(() => [false])).toPromise();
        }
        // Login method
        login(email, password) {
            this.loadingSubject.next(true);
            return this.http.post(`${this.config.baseUrl}/auth/login`, {
                email,
                password
            }).pipe((0, operators_1.tap)(response => {
                if (response.success && response.data) {
                    const { user, token } = response.data;
                    this.userSubject.next(user);
                    this.tokenSubject.next(token);
                    localStorage.setItem(this.config.tokenKey, token);
                    localStorage.setItem(this.config.userKey, JSON.stringify(user));
                    if (this.config.autoRefresh) {
                        this.startTokenRefresh();
                    }
                }
            }), (0, operators_1.catchError)(error => {
                console.error('Login error:', error);
                return (0, rxjs_1.throwError)(() => error);
            }), (0, operators_1.tap)(() => this.loadingSubject.next(false)));
        }
        // Logout method
        logout() {
            return new rxjs_1.Observable(observer => {
                try {
                    if (this.token) {
                        const headers = new http_1.HttpHeaders({
                            'Authorization': `Bearer ${this.token}`,
                            'Content-Type': 'application/json'
                        });
                        this.http.post(`${this.config.baseUrl}/auth/logout`, {}, { headers })
                            .subscribe({
                            next: () => observer.next(),
                            error: (error) => {
                                console.error('Logout error:', error);
                                observer.next();
                            }
                        });
                    }
                    else {
                        observer.next();
                    }
                }
                catch (error) {
                    console.error('Logout error:', error);
                    observer.next();
                }
                finally {
                    this.clearAuthState();
                    observer.complete();
                }
            });
        }
        // Register method
        register(userData) {
            this.loadingSubject.next(true);
            return this.http.post(`${this.config.baseUrl}/auth/register`, userData)
                .pipe((0, operators_1.catchError)(error => {
                console.error('Registration error:', error);
                return (0, rxjs_1.throwError)(() => error);
            }), (0, operators_1.tap)(() => this.loadingSubject.next(false)));
        }
        // Refresh token method
        refreshToken() {
            if (!this.token) {
                return (0, rxjs_1.throwError)(() => new Error('No token to refresh'));
            }
            const headers = new http_1.HttpHeaders({
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            });
            return this.http.post(`${this.config.baseUrl}/auth/refresh`, {}, { headers })
                .pipe((0, operators_1.map)(response => {
                if (response.success && response.data) {
                    const newToken = response.data.token;
                    this.tokenSubject.next(newToken);
                    localStorage.setItem(this.config.tokenKey, newToken);
                    return true;
                }
                return false;
            }), (0, operators_1.catchError)(error => {
                console.error('Token refresh error:', error);
                return (0, rxjs_1.throwError)(() => error);
            }));
        }
        // Update profile method
        updateProfile(profile) {
            if (!this.token || !this.user) {
                return (0, rxjs_1.throwError)(() => new Error('Not authenticated'));
            }
            const headers = new http_1.HttpHeaders({
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            });
            return this.http.put(`${this.config.baseUrl}/users/${this.user.id}`, { profile }, { headers })
                .pipe((0, operators_1.map)(response => {
                if (response.success && this.user) {
                    const updatedUser = Object.assign(Object.assign({}, this.user), { profile: Object.assign(Object.assign({}, this.user.profile), profile) });
                    this.userSubject.next(updatedUser);
                    localStorage.setItem(this.config.userKey, JSON.stringify(updatedUser));
                    return true;
                }
                return false;
            }), (0, operators_1.catchError)(error => {
                console.error('Profile update error:', error);
                return (0, rxjs_1.throwError)(() => error);
            }));
        }
        // Role and permission checking methods
        hasRole(role) {
            var _a;
            return ((_a = this.user) === null || _a === void 0 ? void 0 : _a.roles.includes(role)) || false;
        }
        hasAnyRole(roles) {
            return roles.some(role => this.hasRole(role));
        }
        hasAllRoles(roles) {
            return roles.every(role => this.hasRole(role));
        }
        hasPermission(permission) {
            var _a;
            return ((_a = this.user) === null || _a === void 0 ? void 0 : _a.permissions.includes(permission)) || false;
        }
        hasAnyPermission(permissions) {
            return permissions.some(permission => this.hasPermission(permission));
        }
        hasAllPermissions(permissions) {
            return permissions.every(permission => this.hasPermission(permission));
        }
        // Private helper methods
        clearAuthState() {
            this.userSubject.next(null);
            this.tokenSubject.next(null);
            localStorage.removeItem(this.config.tokenKey);
            localStorage.removeItem(this.config.userKey);
            this.stopTokenRefresh();
        }
        startTokenRefresh() {
            this.stopTokenRefresh();
            if (this.config.autoRefresh && this.config.refreshInterval) {
                this.refreshTimer = setInterval(() => {
                    this.refreshToken().subscribe({
                        next: (success) => {
                            if (!success) {
                                this.logout().subscribe();
                            }
                        },
                        error: () => {
                            this.logout().subscribe();
                        }
                    });
                }, this.config.refreshInterval);
            }
        }
        stopTokenRefresh() {
            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
                this.refreshTimer = undefined;
            }
        }
    };
    __setFunctionName(_classThis, "MockAuthService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MockAuthService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MockAuthService = _classThis;
})();
exports.MockAuthService = MockAuthService;
//# sourceMappingURL=mock-auth.service.js.map