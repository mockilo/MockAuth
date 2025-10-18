import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MockAuthService } from './mock-auth.service';
import { MockAuthConfig } from './mock-auth.service';
import { MockAuthLoginComponent } from './components/mock-auth-login.component';
import { MockAuthRegisterComponent } from './components/mock-auth-register.component';
import { MockAuthProfileComponent } from './components/mock-auth-profile.component';
import { MockAuthStatusComponent } from './components/mock-auth-status.component';
import { MockAuthGuard } from './guards/mock-auth.guard';
import { MockAuthRoleGuard } from './guards/mock-auth-role.guard';
import { MockAuthPermissionGuard } from './guards/mock-auth-permission.guard';

@NgModule({
  declarations: [
    MockAuthLoginComponent,
    MockAuthRegisterComponent,
    MockAuthProfileComponent,
    MockAuthStatusComponent,
  ],
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule, FormsModule],
  exports: [
    MockAuthLoginComponent,
    MockAuthRegisterComponent,
    MockAuthProfileComponent,
    MockAuthStatusComponent,
  ],
  providers: [
    MockAuthService,
    MockAuthGuard,
    MockAuthRoleGuard,
    MockAuthPermissionGuard,
  ],
})
export class MockAuthModule {
  static forRoot(config: MockAuthConfig): ModuleWithProviders<MockAuthModule> {
    return {
      ngModule: MockAuthModule,
      providers: [
        {
          provide: 'MOCK_AUTH_CONFIG',
          useValue: config,
        },
        MockAuthService,
      ],
    };
  }
}
