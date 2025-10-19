"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditService = void 0;
const uuid_1 = require("uuid");
function createAuditService(enabled = false) {
    if (!enabled) {
        return null;
    }
    const auditLogs = [];
    return {
        async log(logData) {
            const auditLog = {
                id: (0, uuid_1.v4)(),
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
        async getLogs(filters) {
            let filteredLogs = [...auditLogs];
            if (filters) {
                if (filters.userId) {
                    filteredLogs = filteredLogs.filter((log) => log.userId === filters.userId);
                }
                if (filters.action) {
                    filteredLogs = filteredLogs.filter((log) => log.action === filters.action);
                }
                if (filters.resource) {
                    filteredLogs = filteredLogs.filter((log) => log.resource === filters.resource);
                }
                if (filters.startDate) {
                    filteredLogs = filteredLogs.filter((log) => log.timestamp >= filters.startDate);
                }
                if (filters.endDate) {
                    filteredLogs = filteredLogs.filter((log) => log.timestamp <= filters.endDate);
                }
                if (filters.success !== undefined) {
                    filteredLogs = filteredLogs.filter((log) => log.success === filters.success);
                }
            }
            return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        },
        async getStats() {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            const stats = {
                total: auditLogs.length,
                byAction: {},
                byResource: {},
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
exports.createAuditService = createAuditService;
//# sourceMappingURL=AuditService.js.map