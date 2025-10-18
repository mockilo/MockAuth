import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MockAuthPermissionGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiredPermissions = route.data['permissions'] as string[];

    // Mock implementation - in real app, inject MockAuthService
    return new Observable((observer) => {
      // Mock user with permissions
      const mockUser = { permissions: ['read', 'write', 'admin'] };

      if (!requiredPermissions || requiredPermissions.length === 0) {
        observer.next(true);
        observer.complete();
        return;
      }

      const hasRequiredPermissions = requiredPermissions.every((permission) =>
        mockUser.permissions.includes(permission)
      );

      if (!hasRequiredPermissions) {
        this.router.navigate(['/unauthorized']);
        observer.next(false);
      } else {
        observer.next(true);
      }

      observer.complete();
    });
  }
}
