import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
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
            [class.error]="
              registerForm.get('email')?.invalid &&
              registerForm.get('email')?.touched
            "
          />
          <div
            *ngIf="
              registerForm.get('email')?.invalid &&
              registerForm.get('email')?.touched
            "
            class="field-error"
          >
            Please enter a valid email address
          </div>
        </div>

        <div class="mockauth-field">
          <label for="username">Username</label>
          <input
            id="username"
            type="text"
            formControlName="username"
            [class.error]="
              registerForm.get('username')?.invalid &&
              registerForm.get('username')?.touched
            "
          />
          <div
            *ngIf="
              registerForm.get('username')?.invalid &&
              registerForm.get('username')?.touched
            "
            class="field-error"
          >
            Username is required
          </div>
        </div>

        <div class="mockauth-field">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            [class.error]="
              registerForm.get('password')?.invalid &&
              registerForm.get('password')?.touched
            "
          />
          <div
            *ngIf="
              registerForm.get('password')?.invalid &&
              registerForm.get('password')?.touched
            "
            class="field-error"
          >
            Password is required
          </div>
        </div>

        <div class="mockauth-field">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            formControlName="confirmPassword"
            [class.error]="
              registerForm.get('confirmPassword')?.invalid &&
              registerForm.get('confirmPassword')?.touched
            "
          />
          <div
            *ngIf="
              registerForm.get('confirmPassword')?.invalid &&
              registerForm.get('confirmPassword')?.touched
            "
            class="field-error"
          >
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
  styles: [
    `
      .mockauth-register-form {
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
export class MockAuthRegisterComponent {
  @Output() registerSuccess = new EventEmitter<void>();

  registerForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private fb: FormBuilder) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { email, username, password, confirmPassword } =
        this.registerForm.value;

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
}
