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
exports.MockAuthLoginComponent = void 0;
const core_1 = require("@angular/core");
const forms_1 = require("@angular/forms");
let MockAuthLoginComponent = (() => {
    let _classDecorators = [(0, core_1.Component)({
            selector: 'mock-auth-login',
            template: `
    <div class="mockauth-login-form">
      <h2>Login</h2>
      
      <div *ngIf="errorMessage" class="mockauth-error">
        {{ errorMessage }}
      </div>
      
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <div class="mockauth-field">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
          />
          <div *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched" class="field-error">
            Please enter a valid email address
          </div>
        </div>
        
        <div class="mockauth-field">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
          />
          <div *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched" class="field-error">
            Password is required
          </div>
        </div>
        
        <button 
          type="submit" 
          [disabled]="loginForm.invalid || isLoading"
          class="mockauth-submit-btn"
        >
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
    </div>
  `,
            styles: [`
    .mockauth-login-form {
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
      box-sizing: border-box;
    }

    .mockauth-field input.error {
      border-color: #dc3545;
    }

    .mockauth-field input:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }

    .field-error {
      color: #dc3545;
      font-size: 12px;
      margin-top: 5px;
    }

    .mockauth-error {
      background-color: #fee;
      color: #c33;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 15px;
      border: 1px solid #fcc;
    }

    .mockauth-submit-btn {
      width: 100%;
      padding: 10px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
    }

    .mockauth-submit-btn:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .mockauth-submit-btn:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }
  `]
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _loginSuccess_decorators;
    let _loginSuccess_initializers = [];
    let _loginSuccess_extraInitializers = [];
    var MockAuthLoginComponent = _classThis = class {
        constructor(fb, mockAuthService) {
            this.fb = fb;
            this.mockAuthService = mockAuthService;
            this.loginSuccess = __runInitializers(this, _loginSuccess_initializers, new core_1.EventEmitter());
            this.loginForm = __runInitializers(this, _loginSuccess_extraInitializers);
            this.errorMessage = '';
            this.isLoading = false;
            this.loginForm = this.fb.group({
                email: ['', [forms_1.Validators.required, forms_1.Validators.email]],
                password: ['', [forms_1.Validators.required]]
            });
        }
        onSubmit() {
            if (this.loginForm.valid) {
                this.isLoading = true;
                this.errorMessage = '';
                const { email, password } = this.loginForm.value;
                this.mockAuthService.login(email, password).subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.loginSuccess.emit();
                            this.loginForm.reset();
                        }
                        else {
                            this.errorMessage = response.error || 'Login failed';
                        }
                        this.isLoading = false;
                    },
                    error: (error) => {
                        this.errorMessage = 'Network error. Please try again.';
                        this.isLoading = false;
                        console.error('Login error:', error);
                    }
                });
            }
        }
    };
    __setFunctionName(_classThis, "MockAuthLoginComponent");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _loginSuccess_decorators = [(0, core_1.Output)()];
        __esDecorate(null, null, _loginSuccess_decorators, { kind: "field", name: "loginSuccess", static: false, private: false, access: { has: obj => "loginSuccess" in obj, get: obj => obj.loginSuccess, set: (obj, value) => { obj.loginSuccess = value; } }, metadata: _metadata }, _loginSuccess_initializers, _loginSuccess_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MockAuthLoginComponent = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MockAuthLoginComponent = _classThis;
})();
exports.MockAuthLoginComponent = MockAuthLoginComponent;
//# sourceMappingURL=mock-auth-login.component.js.map