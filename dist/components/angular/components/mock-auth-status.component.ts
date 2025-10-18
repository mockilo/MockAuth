import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'mock-auth-status',
  template: `
    <div class="mockauth-status" [ngClass]="statusClass">
      <div *ngIf="isLoading">Loading...</div>
      <div *ngIf="!isAuthenticated && !isLoading">Not logged in</div>
      <div *ngIf="isAuthenticated">
        Welcome, {{ user?.profile?.firstName || user?.username }}!
      </div>
    </div>
  `,
  styles: [
    `
      .mockauth-status {
        padding: 10px;
        border-radius: 4px;
        text-align: center;
        font-family:
          -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
    `,
  ],
})
export class MockAuthStatusComponent implements OnInit {
  user: any = null;
  isLoading: boolean = false;
  isAuthenticated: boolean = false;

  get statusClass(): string {
    if (this.isLoading) return 'loading';
    if (!this.isAuthenticated) return 'not-authenticated';
    return 'authenticated';
  }

  ngOnInit(): void {
    // Mock auth state
    this.isLoading = true;

    setTimeout(() => {
      this.user = {
        id: '1',
        email: 'user@example.com',
        username: 'testuser',
        profile: {
          firstName: 'Test',
          lastName: 'User',
        },
      };
      this.isAuthenticated = true;
      this.isLoading = false;
    }, 1000);
  }
}
