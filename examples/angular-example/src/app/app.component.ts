import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { MockAuthService, MockAuthUser } from 'mockauth/components/angular/mock-auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `
    <div class="app">
      <header class="app-header">
        <h1>MockAuth Angular Example</h1>
        <div class="auth-status">
          <div *ngIf="isLoading$ | async" class="loading">Loading...</div>
          <div *ngIf="!(isAuthenticated$ | async) && !(isLoading$ | async)" class="not-authenticated">
            Not logged in
          </div>
          <div *ngIf="isAuthenticated$ | async" class="authenticated">
            Welcome, {{ (user$ | async)?.profile?.firstName || (user$ | async)?.username }}!
          </div>
        </div>
      </header>

      <main class="app-main">
        <router-outlet></router-outlet>
      </main>

      <footer class="app-footer">
        <p>Powered by <a href="https://github.com/mockilo/mockauth" target="_blank" rel="noopener noreferrer">MockAuth</a></p>
      </footer>
    </div>
  `,
  styles: [`
    .app {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      text-align: center;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .app-header {
      background-color: #282c34;
      padding: 20px;
      color: white;
    }

    .app-header h1 {
      margin: 0 0 20px 0;
      font-size: 2.5rem;
    }

    .auth-status {
      padding: 10px;
      border-radius: 4px;
      text-align: center;
    }

    .auth-status .loading {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .auth-status .not-authenticated {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .auth-status .authenticated {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .app-main {
      flex: 1;
      padding: 40px 20px;
      max-width: 800px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }

    .app-footer {
      background-color: #f8f9fa;
      padding: 20px;
      border-top: 1px solid #dee2e6;
    }

    .app-footer a {
      color: #007bff;
      text-decoration: none;
    }

    .app-footer a:hover {
      text-decoration: underline;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .app-header h1 {
        font-size: 2rem;
      }
      
      .app-main {
        padding: 20px 15px;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  user$: Observable<MockAuthUser | null>;
  isAuthenticated$: Observable<boolean>;
  isLoading$: Observable<boolean>;

  constructor(
    private mockAuthService: MockAuthService,
    private router: Router
  ) {
    this.user$ = this.mockAuthService.user$;
    this.isAuthenticated$ = this.mockAuthService.user$.pipe(
      map(user => !!user)
    );
    this.isLoading$ = this.mockAuthService.loading$;
  }

  ngOnInit(): void {
    // Initialize MockAuth service
    this.mockAuthService.initialize({
      baseUrl: 'http://localhost:3001',
      autoRefresh: true,
      refreshInterval: 300000
    });
  }
}
