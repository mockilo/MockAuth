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
exports.MockAuthStyles = exports.MockAuthStatus = exports.MockAuthProtectedRoute = exports.MockAuthUserProfile = exports.MockAuthRegisterForm = exports.MockAuthLoginForm = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const MockAuthProvider_1 = require("./MockAuthProvider");
// Login Form Component
const MockAuthLoginForm = ({ onSuccess }) => {
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [error, setError] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const { login } = (0, MockAuthProvider_1.useMockAuth)();
    const handleSubmit = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const result = yield login(email, password);
        if (result.success) {
            onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess();
        }
        else {
            setError(result.error || 'Login failed');
        }
        setIsLoading(false);
    });
    return ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "mockauth-login-form", children: [(0, jsx_runtime_1.jsx)("h2", { children: "Login" }), error && ((0, jsx_runtime_1.jsx)("div", { className: "mockauth-error", children: error })), (0, jsx_runtime_1.jsxs)("div", { className: "mockauth-field", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "email", children: "Email" }), (0, jsx_runtime_1.jsx)("input", { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true, disabled: isLoading })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mockauth-field", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "password", children: "Password" }), (0, jsx_runtime_1.jsx)("input", { id: "password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, disabled: isLoading })] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: isLoading, children: isLoading ? 'Logging in...' : 'Login' })] }));
};
exports.MockAuthLoginForm = MockAuthLoginForm;
// Register Form Component
const MockAuthRegisterForm = ({ onSuccess }) => {
    const [formData, setFormData] = (0, react_1.useState)({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: ''
    });
    const [error, setError] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const { register } = (0, MockAuthProvider_1.useMockAuth)();
    const handleSubmit = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }
        const result = yield register({
            email: formData.email,
            username: formData.username,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName
        });
        if (result.success) {
            onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess();
        }
        else {
            setError(result.error || 'Registration failed');
        }
        setIsLoading(false);
    });
    const handleChange = (e) => {
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [e.target.name]: e.target.value })));
    };
    return ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "mockauth-register-form", children: [(0, jsx_runtime_1.jsx)("h2", { children: "Register" }), error && ((0, jsx_runtime_1.jsx)("div", { className: "mockauth-error", children: error })), (0, jsx_runtime_1.jsxs)("div", { className: "mockauth-field", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "email", children: "Email" }), (0, jsx_runtime_1.jsx)("input", { id: "email", name: "email", type: "email", value: formData.email, onChange: handleChange, required: true, disabled: isLoading })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mockauth-field", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "username", children: "Username" }), (0, jsx_runtime_1.jsx)("input", { id: "username", name: "username", type: "text", value: formData.username, onChange: handleChange, required: true, disabled: isLoading })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mockauth-field", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "firstName", children: "First Name" }), (0, jsx_runtime_1.jsx)("input", { id: "firstName", name: "firstName", type: "text", value: formData.firstName, onChange: handleChange, disabled: isLoading })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mockauth-field", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "lastName", children: "Last Name" }), (0, jsx_runtime_1.jsx)("input", { id: "lastName", name: "lastName", type: "text", value: formData.lastName, onChange: handleChange, disabled: isLoading })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mockauth-field", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "password", children: "Password" }), (0, jsx_runtime_1.jsx)("input", { id: "password", name: "password", type: "password", value: formData.password, onChange: handleChange, required: true, disabled: isLoading })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mockauth-field", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "confirmPassword", children: "Confirm Password" }), (0, jsx_runtime_1.jsx)("input", { id: "confirmPassword", name: "confirmPassword", type: "password", value: formData.confirmPassword, onChange: handleChange, required: true, disabled: isLoading })] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: isLoading, children: isLoading ? 'Registering...' : 'Register' })] }));
};
exports.MockAuthRegisterForm = MockAuthRegisterForm;
// User Profile Component
const MockAuthUserProfile = () => {
    const { user, logout, updateProfile } = (0, MockAuthProvider_1.useMockAuth)();
    const [isEditing, setIsEditing] = (0, react_1.useState)(false);
    const [profile, setProfile] = (0, react_1.useState)((user === null || user === void 0 ? void 0 : user.profile) || {});
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const handleSave = () => __awaiter(void 0, void 0, void 0, function* () {
        setIsLoading(true);
        const success = yield updateProfile(profile);
        if (success) {
            setIsEditing(false);
        }
        setIsLoading(false);
    });
    const handleLogout = () => __awaiter(void 0, void 0, void 0, function* () {
        yield logout();
    });
    if (!user)
        return null;
    return ((0, jsx_runtime_1.jsxs)("div", { className: "mockauth-user-profile", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mockauth-profile-header", children: [(0, jsx_runtime_1.jsx)("h3", { children: "Profile" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleLogout, className: "mockauth-logout-btn", children: "Logout" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mockauth-profile-info", children: [(0, jsx_runtime_1.jsxs)("div", { className: "mockauth-field", children: [(0, jsx_runtime_1.jsx)("label", { children: "Email" }), (0, jsx_runtime_1.jsx)("span", { children: user.email })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mockauth-field", children: [(0, jsx_runtime_1.jsx)("label", { children: "Username" }), (0, jsx_runtime_1.jsx)("span", { children: user.username })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mockauth-field", children: [(0, jsx_runtime_1.jsx)("label", { children: "Roles" }), (0, jsx_runtime_1.jsx)("span", { children: user.roles.join(', ') })] }), isEditing ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "mockauth-field", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "firstName", children: "First Name" }), (0, jsx_runtime_1.jsx)("input", { id: "firstName", type: "text", value: profile.firstName || '', onChange: (e) => setProfile(prev => (Object.assign(Object.assign({}, prev), { firstName: e.target.value }))), disabled: isLoading })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mockauth-field", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "lastName", children: "Last Name" }), (0, jsx_runtime_1.jsx)("input", { id: "lastName", type: "text", value: profile.lastName || '', onChange: (e) => setProfile(prev => (Object.assign(Object.assign({}, prev), { lastName: e.target.value }))), disabled: isLoading })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mockauth-field", children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "avatar", children: "Avatar URL" }), (0, jsx_runtime_1.jsx)("input", { id: "avatar", type: "url", value: profile.avatar || '', onChange: (e) => setProfile(prev => (Object.assign(Object.assign({}, prev), { avatar: e.target.value }))), disabled: isLoading })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mockauth-actions", children: [(0, jsx_runtime_1.jsx)("button", { onClick: handleSave, disabled: isLoading, children: isLoading ? 'Saving...' : 'Save' }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsEditing(false), disabled: isLoading, children: "Cancel" })] })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "mockauth-field", children: [(0, jsx_runtime_1.jsx)("label", { children: "First Name" }), (0, jsx_runtime_1.jsx)("span", { children: profile.firstName || 'Not set' })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mockauth-field", children: [(0, jsx_runtime_1.jsx)("label", { children: "Last Name" }), (0, jsx_runtime_1.jsx)("span", { children: profile.lastName || 'Not set' })] }), profile.avatar && ((0, jsx_runtime_1.jsxs)("div", { className: "mockauth-field", children: [(0, jsx_runtime_1.jsx)("label", { children: "Avatar" }), (0, jsx_runtime_1.jsx)("img", { src: profile.avatar, alt: "Avatar", className: "mockauth-avatar" })] })), (0, jsx_runtime_1.jsx)("button", { onClick: () => setIsEditing(true), children: "Edit Profile" })] }))] })] }));
};
exports.MockAuthUserProfile = MockAuthUserProfile;
// Protected Route Component
const MockAuthProtectedRoute = ({ children, requiredRoles, requiredPermissions, fallback }) => {
    const { isAuthenticated, user, isLoading } = (0, MockAuthProvider_1.useMockAuth)();
    if (isLoading) {
        return (0, jsx_runtime_1.jsx)("div", { className: "mockauth-loading", children: "Loading..." });
    }
    if (!isAuthenticated) {
        return fallback || (0, jsx_runtime_1.jsx)("div", { className: "mockauth-unauthorized", children: "Please log in to access this page." });
    }
    if (requiredRoles && !requiredRoles.some(role => user === null || user === void 0 ? void 0 : user.roles.includes(role))) {
        return fallback || (0, jsx_runtime_1.jsx)("div", { className: "mockauth-forbidden", children: "You don't have permission to access this page." });
    }
    if (requiredPermissions && !requiredPermissions.every(permission => user === null || user === void 0 ? void 0 : user.permissions.includes(permission))) {
        return fallback || (0, jsx_runtime_1.jsx)("div", { className: "mockauth-forbidden", children: "You don't have the required permissions." });
    }
    return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children });
};
exports.MockAuthProtectedRoute = MockAuthProtectedRoute;
// Auth Status Component
const MockAuthStatus = () => {
    var _a;
    const { isAuthenticated, user, isLoading } = (0, MockAuthProvider_1.useMockAuth)();
    if (isLoading) {
        return (0, jsx_runtime_1.jsx)("div", { className: "mockauth-status loading", children: "Loading..." });
    }
    if (!isAuthenticated) {
        return (0, jsx_runtime_1.jsx)("div", { className: "mockauth-status not-authenticated", children: "Not logged in" });
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "mockauth-status authenticated", children: ["Welcome, ", ((_a = user === null || user === void 0 ? void 0 : user.profile) === null || _a === void 0 ? void 0 : _a.firstName) || (user === null || user === void 0 ? void 0 : user.username), "!"] }));
};
exports.MockAuthStatus = MockAuthStatus;
// Default CSS styles
const MockAuthStyles = () => ((0, jsx_runtime_1.jsx)("style", { children: `
    .mockauth-login-form,
    .mockauth-register-form {
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
    }

    .mockauth-field {
      margin-bottom: 15px;
    }

    .mockauth-field label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
    }

    .mockauth-field input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .mockauth-field input:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }

    .mockauth-error {
      background-color: #fee;
      color: #c33;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 15px;
      border: 1px solid #fcc;
    }

    .mockauth-user-profile {
      max-width: 500px;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
    }

    .mockauth-profile-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .mockauth-logout-btn {
      background-color: #dc3545;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    }

    .mockauth-profile-info .mockauth-field {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }

    .mockauth-profile-info .mockauth-field:last-child {
      border-bottom: none;
    }

    .mockauth-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
    }

    .mockauth-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .mockauth-actions button {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;
    }

    .mockauth-actions button:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }

    .mockauth-status {
      padding: 10px;
      border-radius: 4px;
      text-align: center;
    }

    .mockauth-status.loading {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .mockauth-status.not-authenticated {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .mockauth-status.authenticated {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .mockauth-loading,
    .mockauth-unauthorized,
    .mockauth-forbidden {
      padding: 20px;
      text-align: center;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #f9f9f9;
    }

    .mockauth-unauthorized {
      border-color: #ffc107;
      background: #fff8e1;
    }

    .mockauth-forbidden {
      border-color: #dc3545;
      background: #f8d7da;
    }
  ` }));
exports.MockAuthStyles = MockAuthStyles;
//# sourceMappingURL=MockAuthComponents.js.map