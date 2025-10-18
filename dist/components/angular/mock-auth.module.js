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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockAuthModule = void 0;
const core_1 = require("@angular/core");
const common_1 = require("@angular/common");
const http_1 = require("@angular/common/http");
const forms_1 = require("@angular/forms");
const mock_auth_service_1 = require("./mock-auth.service");
const mock_auth_login_component_1 = require("./components/mock-auth-login.component");
const mock_auth_register_component_1 = require("./components/mock-auth-register.component");
const mock_auth_profile_component_1 = require("./components/mock-auth-profile.component");
const mock_auth_status_component_1 = require("./components/mock-auth-status.component");
const mock_auth_guard_1 = require("./guards/mock-auth.guard");
const mock_auth_role_guard_1 = require("./guards/mock-auth-role.guard");
const mock_auth_permission_guard_1 = require("./guards/mock-auth-permission.guard");
let MockAuthModule = (() => {
    let _classDecorators = [(0, core_1.NgModule)({
            declarations: [
                mock_auth_login_component_1.MockAuthLoginComponent,
                mock_auth_register_component_1.MockAuthRegisterComponent,
                mock_auth_profile_component_1.MockAuthProfileComponent,
                mock_auth_status_component_1.MockAuthStatusComponent
            ],
            imports: [
                common_1.CommonModule,
                http_1.HttpClientModule,
                forms_1.ReactiveFormsModule,
                forms_1.FormsModule
            ],
            exports: [
                mock_auth_login_component_1.MockAuthLoginComponent,
                mock_auth_register_component_1.MockAuthRegisterComponent,
                mock_auth_profile_component_1.MockAuthProfileComponent,
                mock_auth_status_component_1.MockAuthStatusComponent
            ],
            providers: [
                mock_auth_service_1.MockAuthService,
                mock_auth_guard_1.MockAuthGuard,
                mock_auth_role_guard_1.MockAuthRoleGuard,
                mock_auth_permission_guard_1.MockAuthPermissionGuard
            ]
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var MockAuthModule = _classThis = class {
        static forRoot(config) {
            return {
                ngModule: MockAuthModule,
                providers: [
                    {
                        provide: 'MOCK_AUTH_CONFIG',
                        useValue: config
                    },
                    mock_auth_service_1.MockAuthService
                ]
            };
        }
    };
    __setFunctionName(_classThis, "MockAuthModule");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MockAuthModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MockAuthModule = _classThis;
})();
exports.MockAuthModule = MockAuthModule;
//# sourceMappingURL=mock-auth.module.js.map