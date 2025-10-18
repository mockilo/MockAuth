import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { MockAuthService } from '../mock-auth.service';

@Injectable({
  providedIn: 'root',
})
export class MockAuthGuard implements CanActivate {
  constructor(
    private mockAuthService: MockAuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.mockAuthService.user$.pipe(
      take(1),
      map((user) => {
        if (user) {
          return true;
        } else {
          // Redirect to login page with return url
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url },
          });
          return false;
        }
      })
    );
  }
}

@Injectable({
  providedIn: 'root',
})
export class MockAuthRoleGuard implements CanActivate {
  constructor(
    private mockAuthService: MockAuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiredRoles = route.data['roles'] as string[];

    return this.mockAuthService.user$.pipe(
      take(1),
      map((user) => {
        if (!user) {
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url },
          });
          return false;
        }

        if (!requiredRoles || requiredRoles.length === 0) {
          return true;
        }

        const hasRequiredRole = requiredRoles.some((role) =>
          this.mockAuthService.hasRole(role)
        );

        if (!hasRequiredRole) {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    );
  }
}

@Injectable({
  providedIn: 'root',
})
export class MockAuthPermissionGuard implements CanActivate {
  constructor(
    private mockAuthService: MockAuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiredPermissions = route.data['permissions'] as string[];

    return this.mockAuthService.user$.pipe(
      take(1),
      map((user) => {
        if (!user) {
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url },
          });
          return false;
        }

        if (!requiredPermissions || requiredPermissions.length === 0) {
          return true;
        }

        const hasRequiredPermissions = requiredPermissions.every((permission) =>
          this.mockAuthService.hasPermission(permission)
        );

        if (!hasRequiredPermissions) {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    );
  }
}
