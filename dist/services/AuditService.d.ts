import { AuditLog } from '../types';
export declare function createAuditService(enabled?: boolean): {
    log(logData: {
        action: string;
        resource: string;
        details: Record<string, any>;
        ipAddress?: string;
        userAgent?: string;
        success: boolean;
        error?: string;
        userId?: string;
    }): Promise<void>;
    getLogs(filters?: {
        userId?: string;
        action?: string;
        resource?: string;
        startDate?: Date;
        endDate?: Date;
        success?: boolean;
    }): Promise<AuditLog[]>;
    getStats(): Promise<{
        total: number;
        byAction: Record<string, number>;
        byResource: Record<string, number>;
        successRate: number;
        recentActivity: number;
    }>;
} | null;
//# sourceMappingURL=AuditService.d.ts.map