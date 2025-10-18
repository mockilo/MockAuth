import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
export declare class MockAuthPermissionGuard implements CanActivate {
    private router;
    constructor(router: Router);
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>;
}
//# sourceMappingURL=mock-auth-permission.guard.d.ts.map