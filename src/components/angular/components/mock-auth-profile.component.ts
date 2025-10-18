import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'mock-auth-profile',
  template: `
    <div class="mockauth-user-profile">
      <div class="mockauth-profile-header">
        <h3>Profile</h3>
        <button (click)="logout()" class="mockauth-logout-btn">Logout</button>
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
          <img
            [src]="user.profile.avatar"
            alt="Avatar"
            class="mockauth-avatar"
          />
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
              <button
                type="button"
                (click)="cancelEdit()"
                [disabled]="isLoading"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <button *ngIf="!isEditing" (click)="startEdit()">Edit Profile</button>
      </div>
    </div>
  `,
  styles: [
    `
      .mockauth-user-profile {
        max-width: 500px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background: white;
        font-family:
          -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
    `,
  ],
})
export class MockAuthProfileComponent implements OnInit {
  user: any = null;
  editForm: FormGroup;
  isEditing: boolean = false;
  isLoading: boolean = false;

  constructor(private fb: FormBuilder) {
    this.editForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      avatar: [''],
    });
  }

  ngOnInit(): void {
    // Mock user data
    this.user = {
      id: '1',
      email: 'user@example.com',
      username: 'testuser',
      roles: ['user'],
      profile: {
        firstName: 'Test',
        lastName: 'User',
        avatar: 'https://i.pravatar.cc/150?img=1',
      },
    };
  }

  startEdit(): void {
    this.editForm.patchValue({
      firstName: this.user?.profile?.firstName || '',
      lastName: this.user?.profile?.lastName || '',
      avatar: this.user?.profile?.avatar || '',
    });
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editForm.reset();
  }

  saveProfile(): void {
    if (this.editForm.valid) {
      this.isLoading = true;

      // Mock save logic
      setTimeout(() => {
        this.user.profile = {
          ...this.user.profile,
          ...this.editForm.value,
        };
        this.isEditing = false;
        this.isLoading = false;
      }, 1000);
    }
  }

  logout(): void {
    // Mock logout logic
    console.log('Logout clicked');
  }
}
