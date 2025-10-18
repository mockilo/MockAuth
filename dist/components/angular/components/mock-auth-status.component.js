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
exports.MockAuthStatusComponent = void 0;
const core_1 = require("@angular/core");
let MockAuthStatusComponent = (() => {
    let _classDecorators = [(0, core_1.Component)({
            selector: 'mock-auth-status',
            template: `
    <div class="mockauth-status" [ngClass]="statusClass">
      <div *ngIf="isLoading">Loading...</div>
      <div *ngIf="!isAuthenticated && !isLoading">Not logged in</div>
      <div *ngIf="isAuthenticated">Welcome, {{ user?.profile?.firstName || user?.username }}!</div>
    </div>
  `,
            styles: [`
    .mockauth-status {
      padding: 10px;
      border-radius: 4px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
  `]
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var MockAuthStatusComponent = _classThis = class {
        constructor() {
            this.user = null;
            this.isLoading = false;
            this.isAuthenticated = false;
        }
        get statusClass() {
            if (this.isLoading)
                return 'loading';
            if (!this.isAuthenticated)
                return 'not-authenticated';
            return 'authenticated';
        }
        ngOnInit() {
            // Mock auth state
            this.isLoading = true;
            setTimeout(() => {
                this.user = {
                    id: '1',
                    email: 'user@example.com',
                    username: 'testuser',
                    profile: {
                        firstName: 'Test',
                        lastName: 'User'
                    }
                };
                this.isAuthenticated = true;
                this.isLoading = false;
            }, 1000);
        }
    };
    __setFunctionName(_classThis, "MockAuthStatusComponent");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MockAuthStatusComponent = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MockAuthStatusComponent = _classThis;
})();
exports.MockAuthStatusComponent = MockAuthStatusComponent;
//# sourceMappingURL=mock-auth-status.component.js.map