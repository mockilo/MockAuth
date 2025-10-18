import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MockAuthService } from '../mock-auth.service';

@Component({
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
            [class.error]="
              loginForm.get('email')?.invalid && loginForm.get('email')?.touched
            "
          />
          <div
            *ngIf="
              loginForm.get('email')?.invalid && loginForm.get('email')?.touched
            "
            class="field-error"
          >
            Please enter a valid email address
          </div>
        </div>

        <div class="mockauth-field">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            [class.error]="
              loginForm.get('password')?.invalid &&
              loginForm.get('password')?.touched
            "
          />
          <div
            *ngIf="
              loginForm.get('password')?.invalid &&
              loginForm.get('password')?.touched
            "
            class="field-error"
          >
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
  styles: [
    `
      .mockauth-login-form {
        max-width: 400px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background: white;
        font-family:
          -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
    `,
  ],
})
export class MockAuthLoginComponent {
  @Output() loginSuccess = new EventEmitter<void>();

  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private mockAuthService: MockAuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { email, password } = this.loginForm.value;

      this.mockAuthService.login(email, password).subscribe({
        next: (response) => {
          if (response.success) {
            this.loginSuccess.emit();
            this.loginForm.reset();
          } else {
            this.errorMessage = response.error || 'Login failed';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Network error. Please try again.';
          this.isLoading = false;
          console.error('Login error:', error);
        },
      });
    }
  }
}
