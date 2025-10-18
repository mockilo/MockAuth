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
exports.useMockAuthPermission = exports.useMockAuthRole = exports.withMockAuth = exports.MockAuthProvider = exports.useMockAuth = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const MockAuthContext = (0, react_1.createContext)(undefined);
const useMockAuth = () => {
    const context = (0, react_1.useContext)(MockAuthContext);
    if (!context) {
        throw new Error('useMockAuth must be used within a MockAuthProvider');
    }
    return context;
};
exports.useMockAuth = useMockAuth;
const MockAuthProvider = ({ children, config }) => {
    const [user, setUser] = (0, react_1.useState)(null);
    const [token, setToken] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const tokenKey = config.tokenKey || 'mockauth_token';
    const userKey = config.userKey || 'mockauth_user';
    const isAuthenticated = !!user && !!token;
    // Initialize auth state from localStorage
    (0, react_1.useEffect)(() => {
        const initializeAuth = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const storedToken = localStorage.getItem(tokenKey);
                const storedUser = localStorage.getItem(userKey);
                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                    // Verify token is still valid
                    const isValid = yield verifyToken(storedToken);
                    if (!isValid) {
                        yield logout();
                    }
                }
            }
            catch (error) {
                console.error('Failed to initialize auth:', error);
                yield logout();
            }
            finally {
                setIsLoading(false);
            }
        });
        initializeAuth();
    }, []);
    // Auto-refresh token
    (0, react_1.useEffect)(() => {
        if (!config.autoRefresh || !token)
            return;
        const interval = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
            const success = yield refreshToken();
            if (!success) {
                yield logout();
            }
        }), config.refreshInterval || 300000); // 5 minutes
        return () => clearInterval(interval);
    }, [token, config.autoRefresh, config.refreshInterval]);
    const verifyToken = (tokenToVerify) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield fetch(`${config.baseUrl}/auth/verify`, {
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
    const login = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            setIsLoading(true);
            const response = yield fetch(`${config.baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            const data = yield response.json();
            if (data.success) {
                const { user: userData, token: authToken } = data.data;
                setUser(userData);
                setToken(authToken);
                localStorage.setItem(tokenKey, authToken);
                localStorage.setItem(userKey, JSON.stringify(userData));
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
            setIsLoading(false);
        }
    });
    const logout = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (token) {
                yield fetch(`${config.baseUrl}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        }
        catch (error) {
            console.error('Logout error:', error);
        }
        finally {
            setUser(null);
            setToken(null);
            localStorage.removeItem(tokenKey);
            localStorage.removeItem(userKey);
        }
    });
    const register = (userData) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            setIsLoading(true);
            const response = yield fetch(`${config.baseUrl}/auth/register`, {
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
            setIsLoading(false);
        }
    });
    const refreshToken = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!token)
                return false;
            const response = yield fetch(`${config.baseUrl}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = yield response.json();
            if (data.success) {
                const newToken = data.data.token;
                setToken(newToken);
                localStorage.setItem(tokenKey, newToken);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Token refresh error:', error);
            return false;
        }
    });
    const updateProfile = (profile) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!token || !user)
                return false;
            const response = yield fetch(`${config.baseUrl}/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ profile })
            });
            const data = yield response.json();
            if (data.success) {
                const updatedUser = Object.assign(Object.assign({}, user), { profile: Object.assign(Object.assign({}, user.profile), profile) });
                setUser(updatedUser);
                localStorage.setItem(userKey, JSON.stringify(updatedUser));
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Profile update error:', error);
            return false;
        }
    });
    const contextValue = {
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        logout,
        register,
        refreshToken,
        updateProfile
    };
    return ((0, jsx_runtime_1.jsx)(MockAuthContext.Provider, { value: contextValue, children: children }));
};
exports.MockAuthProvider = MockAuthProvider;
// Higher-order component for protecting routes
const withMockAuth = (Component, requiredRoles) => {
    return (props) => {
        const { isAuthenticated, user, isLoading } = (0, exports.useMockAuth)();
        if (isLoading) {
            return (0, jsx_runtime_1.jsx)("div", { children: "Loading..." });
        }
        if (!isAuthenticated) {
            return (0, jsx_runtime_1.jsx)("div", { children: "Please log in to access this page." });
        }
        if (requiredRoles && !requiredRoles.some(role => user === null || user === void 0 ? void 0 : user.roles.includes(role))) {
            return (0, jsx_runtime_1.jsx)("div", { children: "You don't have permission to access this page." });
        }
        return (0, jsx_runtime_1.jsx)(Component, Object.assign({}, props));
    };
};
exports.withMockAuth = withMockAuth;
// Hook for role-based access control
const useMockAuthRole = (requiredRoles) => {
    const { user } = (0, exports.useMockAuth)();
    if (!user)
        return false;
    return requiredRoles.some(role => user.roles.includes(role));
};
exports.useMockAuthRole = useMockAuthRole;
// Hook for permission-based access control
const useMockAuthPermission = (requiredPermissions) => {
    const { user } = (0, exports.useMockAuth)();
    if (!user)
        return false;
    return requiredPermissions.every(permission => user.permissions.includes(permission));
};
exports.useMockAuthPermission = useMockAuthPermission;
//# sourceMappingURL=MockAuthProvider.js.map