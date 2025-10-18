import { v4 as uuidv4 } from 'uuid';
import { AuditLog, AuditService } from '../types';

export function createAuditService(
  enabled: boolean = false
): AuditService | null {
  if (!enabled) {
    return null;
  }

  const auditLogs: AuditLog[] = [];

  return {
    async log(logData: {
      action: string;
      resource: string;
      details: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
      success: boolean;
      error?: string;
      userId?: string;
    }): Promise<void> {
      const auditLog: AuditLog = {
        id: uuidv4(),
        userId: logData.userId,
        action: logData.action,
        resource: logData.resource,
        details: logData.details,
        ipAddress: logData.ipAddress,
        userAgent: logData.userAgent,
        timestamp: new Date(),
        success: logData.success,
        error: logData.error,
      };

      auditLogs.push(auditLog);
      console.log('Audit log:', auditLog);
    },

    async getLogs(filters?: {
      userId?: string;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
      success?: boolean;
    }): Promise<AuditLog[]> {
      let filteredLogs = [...auditLogs];

      if (filters) {
        if (filters.userId) {
          filteredLogs = filteredLogs.filter(
            (log) => log.userId === filters.userId
          );
        }
        if (filters.action) {
          filteredLogs = filteredLogs.filter(
            (log) => log.action === filters.action
          );
        }
        if (filters.resource) {
          filteredLogs = filteredLogs.filter(
            (log) => log.resource === filters.resource
          );
        }
        if (filters.startDate) {
          filteredLogs = filteredLogs.filter(
            (log) => log.timestamp >= filters.startDate!
          );
        }
        if (filters.endDate) {
          filteredLogs = filteredLogs.filter(
            (log) => log.timestamp <= filters.endDate!
          );
        }
        if (filters.success !== undefined) {
          filteredLogs = filteredLogs.filter(
            (log) => log.success === filters.success
          );
        }
      }

      return filteredLogs.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
    },

    async getStats(): Promise<{
      total: number;
      byAction: Record<string, number>;
      byResource: Record<string, number>;
      successRate: number;
      recentActivity: number;
    }> {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const stats = {
        total: auditLogs.length,
        byAction: {} as Record<string, number>,
        byResource: {} as Record<string, number>,
        successRate: 0,
        recentActivity: 0,
      };

      let successCount = 0;

      for (const log of auditLogs) {
        // Count by action
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

        // Count by resource
        stats.byResource[log.resource] =
          (stats.byResource[log.resource] || 0) + 1;

        // Count successes
        if (log.success) {
          successCount++;
        }

        // Count recent activity
        if (log.timestamp >= oneHourAgo) {
          stats.recentActivity++;
        }
      }

      stats.successRate =
        auditLogs.length > 0 ? (successCount / auditLogs.length) * 100 : 0;

      return stats;
    },
  };
}
