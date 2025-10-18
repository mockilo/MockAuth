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
exports.MockAuthProfileComponent = void 0;
const core_1 = require("@angular/core");
let MockAuthProfileComponent = (() => {
    let _classDecorators = [(0, core_1.Component)({
            selector: 'mock-auth-profile',
            template: `
    <div class="mockauth-user-profile">
      <div class="mockauth-profile-header">
        <h3>Profile</h3>
        <button (click)="logout()" class="mockauth-logout-btn">
          Logout
        </button>
      </div>
      
      <div class="mockauth-profile-info">
        <div class="mockauth-field">
          <label>Email</label>
          <span>{{ user?.email }}</span>
        </div>
        
        <div class="mockauth-field">
          <label>Username</label>
          <span>{{ user?.username }}</span>
        </div>
        
        <div class="mockauth-field">
          <label>Roles</label>
          <span>{{ user?.roles?.join(', ') }}</span>
        </div>
        
        <div *ngIf="!isEditing" class="mockauth-field">
          <label>First Name</label>
          <span>{{ user?.profile?.firstName || 'Not set' }}</span>
        </div>
        
        <div *ngIf="!isEditing" class="mockauth-field">
          <label>Last Name</label>
          <span>{{ user?.profile?.lastName || 'Not set' }}</span>
        </div>
        
        <div *ngIf="!isEditing && user?.profile?.avatar" class="mockauth-field">
          <label>Avatar</label>
          <img [src]="user.profile.avatar" alt="Avatar" class="mockauth-avatar" />
        </div>
        
        <!-- Edit Form -->
        <div *ngIf="isEditing">
          <form [formGroup]="editForm" (ngSubmit)="saveProfile()">
            <div class="mockauth-field">
              <label for="edit-firstName">First Name</label>
              <input
                id="edit-firstName"
                type="text"
                formControlName="firstName"
                [disabled]="isLoading"
              />
            </div>
            
            <div class="mockauth-field">
              <label for="edit-lastName">Last Name</label>
              <input
                id="edit-lastName"
                type="text"
                formControlName="lastName"
                [disabled]="isLoading"
              />
            </div>
            
            <div class="mockauth-field">
              <label for="edit-avatar">Avatar URL</label>
              <input
                id="edit-avatar"
                type="url"
                formControlName="avatar"
                [disabled]="isLoading"
              />
            </div>
            
            <div class="mockauth-actions">
              <button type="submit" [disabled]="isLoading">
                {{ isLoading ? 'Saving...' : 'Save' }}
              </button>
              <button type="button" (click)="cancelEdit()" [disabled]="isLoading">
                Cancel
              </button>
            </div>
          </form>
        </div>
        
        <button *ngIf="!isEditing" (click)="startEdit()">
          Edit Profile
        </button>
      </div>
    </div>
  `,
            styles: [`
    .mockauth-user-profile {
      max-width: 500px;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

    .mockauth-field input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .mockauth-field input:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }

    button {
      padding: 10px 20px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 14px;
    }

    button:hover:not(:disabled) {
      background-color: #f5f5f5;
    }

    button:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
      opacity: 0.6;
    }
  `]
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var MockAuthProfileComponent = _classThis = class {
        constructor(fb) {
            this.fb = fb;
            this.user = null;
            this.isEditing = false;
            this.isLoading = false;
            this.editForm = this.fb.group({
                firstName: [''],
                lastName: [''],
                avatar: ['']
            });
        }
        ngOnInit() {
            // Mock user data
            this.user = {
                id: '1',
                email: 'user@example.com',
                username: 'testuser',
                roles: ['user'],
                profile: {
                    firstName: 'Test',
                    lastName: 'User',
                    avatar: 'https://i.pravatar.cc/150?img=1'
                }
            };
        }
        startEdit() {
            var _a, _b, _c, _d, _e, _f;
            this.editForm.patchValue({
                firstName: ((_b = (_a = this.user) === null || _a === void 0 ? void 0 : _a.profile) === null || _b === void 0 ? void 0 : _b.firstName) || '',
                lastName: ((_d = (_c = this.user) === null || _c === void 0 ? void 0 : _c.profile) === null || _d === void 0 ? void 0 : _d.lastName) || '',
                avatar: ((_f = (_e = this.user) === null || _e === void 0 ? void 0 : _e.profile) === null || _f === void 0 ? void 0 : _f.avatar) || ''
            });
            this.isEditing = true;
        }
        cancelEdit() {
            this.isEditing = false;
            this.editForm.reset();
        }
        saveProfile() {
            if (this.editForm.valid) {
                this.isLoading = true;
                // Mock save logic
                setTimeout(() => {
                    this.user.profile = Object.assign(Object.assign({}, this.user.profile), this.editForm.value);
                    this.isEditing = false;
                    this.isLoading = false;
                }, 1000);
            }
        }
        logout() {
            // Mock logout logic
            console.log('Logout clicked');
        }
    };
    __setFunctionName(_classThis, "MockAuthProfileComponent");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MockAuthProfileComponent = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MockAuthProfileComponent = _classThis;
})();
exports.MockAuthProfileComponent = MockAuthProfileComponent;
//# sourceMappingURL=mock-auth-profile.component.js.map