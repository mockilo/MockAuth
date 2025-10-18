import { Router } from 'express';
import { UserService } from '../services/UserService';
import { AuthService } from '../services/AuthService';
import { WebhookService, AuditService } from '../types';
export declare function createUserRoutes(userService: UserService, authService: AuthService, webhookService: WebhookService | null, auditService: AuditService | null): Router;
//# sourceMappingURL=users.d.ts.map