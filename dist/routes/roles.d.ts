import { Router } from 'express';
import { UserService } from '../services/UserService';
import { AuthService } from '../services/AuthService';
import { WebhookService, AuditService } from '../types';
export declare function createRoleRoutes(userService: UserService, authService: AuthService, webhookService: WebhookService | null, auditService: AuditService | null): Router;
//# sourceMappingURL=roles.d.ts.map