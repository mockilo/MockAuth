import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { MockAuthService } from '../mock-auth.service';
export declare class MockAuthGuard implements CanActivate {
    private mockAuthService;
    private router;
    constructor(mockAuthService: MockAuthService, router: Router);
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>;
}
export declare class MockAuthRoleGuard implements CanActivate {
    private mockAuthService;
    private router;
    constructor(mockAuthService: MockAuthService, router: Router);
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>;
}
export declare class MockAuthPermissionGuard implements CanActivate {
    private mockAuthService;
    private router;
    constructor(mockAuthService: MockAuthService, router: Router);
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>;
}
//# sourceMappingURL=mock-auth.guard.d.ts.map