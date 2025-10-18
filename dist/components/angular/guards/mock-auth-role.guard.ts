import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MockAuthRoleGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiredRoles = route.data['roles'] as string[];

    // Mock implementation - in real app, inject MockAuthService
    return new Observable((observer) => {
      // Mock user with admin role
      const mockUser = { roles: ['admin', 'user'] };

      if (!requiredRoles || requiredRoles.length === 0) {
        observer.next(true);
        observer.complete();
        return;
      }

      const hasRequiredRole = requiredRoles.some((role) =>
        mockUser.roles.includes(role)
      );

      if (!hasRequiredRole) {
        this.router.navigate(['/unauthorized']);
        observer.next(false);
      } else {
        observer.next(true);
      }

      observer.complete();
    });
  }
}
