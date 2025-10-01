"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditService = createAuditService;
const uuid_1 = require("uuid");
function createAuditService(enabled = false) {
    if (!enabled) {
        return null;
    }
    const auditLogs = [];
    return {
        log(logData) {
            return __awaiter(this, void 0, void 0, function* () {
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
            });
        },
        getLogs(filters) {
            return __awaiter(this, void 0, void 0, function* () {
                let filteredLogs = [...auditLogs];
                if (filters) {
                    if (filters.userId) {
                        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
                    }
                    if (filters.action) {
                        filteredLogs = filteredLogs.filter(log => log.action === filters.action);
                    }
                    if (filters.resource) {
                        filteredLogs = filteredLogs.filter(log => log.resource === filters.resource);
                    }
                    if (filters.startDate) {
                        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate);
                    }
                    if (filters.endDate) {
                        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate);
                    }
                    if (filters.success !== undefined) {
                        filteredLogs = filteredLogs.filter(log => log.success === filters.success);
                    }
                }
                return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            });
        },
        getStats() {
            return __awaiter(this, void 0, void 0, function* () {
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
                    stats.byResource[log.resource] = (stats.byResource[log.resource] || 0) + 1;
                    // Count successes
                    if (log.success) {
                        successCount++;
                    }
                    // Count recent activity
                    if (log.timestamp >= oneHourAgo) {
                        stats.recentActivity++;
                    }
                }
                stats.successRate = auditLogs.length > 0 ? (successCount / auditLogs.length) * 100 : 0;
                return stats;
            });
        },
    };
}
//# sourceMappingURL=AuditService.js.map