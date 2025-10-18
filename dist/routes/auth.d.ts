import { Router } from 'express';
import { AuthService } from '../services/AuthService';
import { UserService } from '../services/UserService';
import { WebhookService, AuditService } from '../types';
export declare function createAuthRoutes(authService: AuthService, userService: UserService, webhookService: WebhookService | null, auditService: AuditService | null): Router;
//# sourceMappingURL=auth.d.ts.map