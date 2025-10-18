"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockAuthPlugin = exports.useMockAuthPermission = exports.useMockAuthRole = exports.useMockAuth = exports.MockAuthPlugin = void 0;
const MockAuthService_1 = require("./MockAuthService");
exports.MockAuthPlugin = {
    install(app, config) {
        const mockAuthService = new MockAuthService_1.MockAuthService(config);
        app.config.globalProperties.$mockAuth = mockAuthService;
        app.provide('mockAuth', mockAuthService);
        // Initialize auth state
        mockAuthService.initialize();
    },
    $mockAuth: null
};
// Composable for using MockAuth in Composition API
function useMockAuth() {
    const { inject } = require('vue');
    const mockAuth = inject('mockAuth');
    if (!mockAuth) {
        throw new Error('MockAuth plugin not installed. Make sure to use app.use(MockAuthPlugin, config)');
    }
    return mockAuth;
}
exports.useMockAuth = useMockAuth;
// Composable for role-based access control
function useMockAuthRole(requiredRoles) {
    const { computed } = require('vue');
    const mockAuth = useMockAuth();
    return computed(() => {
        if (!mockAuth.user.value)
            return false;
        return requiredRoles.some(role => { var _a; return (_a = mockAuth.user.value) === null || _a === void 0 ? void 0 : _a.roles.includes(role); });
    });
}
exports.useMockAuthRole = useMockAuthRole;
// Composable for permission-based access control
function useMockAuthPermission(requiredPermissions) {
    const { computed } = require('vue');
    const mockAuth = useMockAuth();
    return computed(() => {
        if (!mockAuth.user.value)
            return false;
        return requiredPermissions.every(permission => { var _a; return (_a = mockAuth.user.value) === null || _a === void 0 ? void 0 : _a.permissions.includes(permission); });
    });
}
exports.useMockAuthPermission = useMockAuthPermission;
// Helper function to create the plugin
function createMockAuthPlugin(config) {
    return Object.assign(Object.assign({}, exports.MockAuthPlugin), { install(app) {
            exports.MockAuthPlugin.install(app, config);
        } });
}
exports.createMockAuthPlugin = createMockAuthPlugin;
//# sourceMappingURL=MockAuthPlugin.js.map