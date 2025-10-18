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
exports.MockAuthRegisterComponent = void 0;
const core_1 = require("@angular/core");
const forms_1 = require("@angular/forms");
let MockAuthRegisterComponent = (() => {
    let _classDecorators = [(0, core_1.Component)({
            selector: 'mock-auth-register',
            template: `
    <div class="mockauth-register-form">
      <h2>Register</h2>
      
      <div *ngIf="errorMessage" class="mockauth-error">
        {{ errorMessage }}
      </div>
      
      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
        <div class="mockauth-field">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            [class.error]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
          />
          <div *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched" class="field-error">
            Please enter a valid email address
          </div>
        </div>
        
        <div class="mockauth-field">
          <label for="username">Username</label>
          <input
            id="username"
            type="text"
            formControlName="username"
            [class.error]="registerForm.get('username')?.invalid && registerForm.get('username')?.touched"
          />
          <div *ngIf="registerForm.get('username')?.invalid && registerForm.get('username')?.touched" class="field-error">
            Username is required
          </div>
        </div>
        
        <div class="mockauth-field">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            [class.error]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
          />
          <div *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched" class="field-error">
            Password is required
          </div>
        </div>
        
        <div class="mockauth-field">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            formControlName="confirmPassword"
            [class.error]="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched"
          />
          <div *ngIf="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched" class="field-error">
            Please confirm your password
          </div>
        </div>
        
        <button 
          type="submit" 
          [disabled]="registerForm.invalid || isLoading"
          class="mockauth-submit-btn"
        >
          {{ isLoading ? 'Registering...' : 'Register' }}
        </button>
      </form>
    </div>
  `,
            styles: [`
    .mockauth-register-form {
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
    let _registerSuccess_decorators;
    let _registerSuccess_initializers = [];
    let _registerSuccess_extraInitializers = [];
    var MockAuthRegisterComponent = _classThis = class {
        constructor(fb) {
            this.fb = fb;
            this.registerSuccess = __runInitializers(this, _registerSuccess_initializers, new core_1.EventEmitter());
            this.registerForm = __runInitializers(this, _registerSuccess_extraInitializers);
            this.errorMessage = '';
            this.isLoading = false;
            this.registerForm = this.fb.group({
                email: ['', [forms_1.Validators.required, forms_1.Validators.email]],
                username: ['', [forms_1.Validators.required]],
                password: ['', [forms_1.Validators.required]],
                confirmPassword: ['', [forms_1.Validators.required]]
            });
        }
        onSubmit() {
            if (this.registerForm.valid) {
                this.isLoading = true;
                this.errorMessage = '';
                const { email, username, password, confirmPassword } = this.registerForm.value;
                if (password !== confirmPassword) {
                    this.errorMessage = 'Passwords do not match';
                    this.isLoading = false;
                    return;
                }
                // Mock registration logic
                setTimeout(() => {
                    this.registerSuccess.emit();
                    this.registerForm.reset();
                    this.isLoading = false;
                }, 1000);
            }
        }
    };
    __setFunctionName(_classThis, "MockAuthRegisterComponent");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _registerSuccess_decorators = [(0, core_1.Output)()];
        __esDecorate(null, null, _registerSuccess_decorators, { kind: "field", name: "registerSuccess", static: false, private: false, access: { has: obj => "registerSuccess" in obj, get: obj => obj.registerSuccess, set: (obj, value) => { obj.registerSuccess = value; } }, metadata: _metadata }, _registerSuccess_initializers, _registerSuccess_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MockAuthRegisterComponent = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MockAuthRegisterComponent = _classThis;
})();
exports.MockAuthRegisterComponent = MockAuthRegisterComponent;
//# sourceMappingURL=mock-auth-register.component.js.map