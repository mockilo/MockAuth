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
exports.createComplianceService = exports.ComplianceService = void 0;
class ComplianceService {
    constructor(config) {
        this.rules = new Map();
        this.violations = new Map();
        this.auditLogs = [];
        this.reports = new Map();
        this.config = config;
        this.initializeDefaultRules();
    }
    /**
     * Log an audit event
     */
    logAuditEvent(userId, action, resource, success, details, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.config.enableAuditLogging) {
                return;
            }
            const auditLog = {
                id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId,
                action,
                resource,
                timestamp: new Date(),
                ipAddress,
                userAgent,
                success,
                details,
                complianceFlags: [],
            };
            // Check for compliance violations
            const flags = yield this.checkComplianceViolations(auditLog);
            auditLog.complianceFlags = flags;
            this.auditLogs.push(auditLog);
            // Clean up old audit logs
            this.cleanupOldAuditLogs();
        });
    }
    /**
     * Check for compliance violations
     */
    checkComplianceViolations(auditLog) {
        return __awaiter(this, void 0, void 0, function* () {
            const flags = [];
            for (const rule of this.rules.values()) {
                if (!rule.enabled)
                    continue;
                const violation = yield this.evaluateRule(rule, auditLog);
                if (violation) {
                    this.violations.set(violation.id, violation);
                    flags.push(rule.id);
                }
            }
            return flags;
        });
    }
    /**
     * Evaluate a compliance rule
     */
    evaluateRule(rule, auditLog) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (rule.type) {
                case 'password_policy':
                    return this.evaluatePasswordPolicy(rule, auditLog);
                case 'session_timeout':
                    return this.evaluateSessionTimeout(rule, auditLog);
                case 'audit_retention':
                    return this.evaluateAuditRetention(rule, auditLog);
                case 'data_encryption':
                    return this.evaluateDataEncryption(rule, auditLog);
                case 'access_control':
                    return this.evaluateAccessControl(rule, auditLog);
                default:
                    return null;
            }
        });
    }
    /**
     * Evaluate password policy compliance
     */
    evaluatePasswordPolicy(rule, auditLog) {
        var _a;
        if (auditLog.action !== 'password_change' &&
            auditLog.action !== 'user_registration') {
            return null;
        }
        const password = (_a = auditLog.details) === null || _a === void 0 ? void 0 : _a.password;
        if (!password)
            return null;
        const config = rule.config;
        const violations = [];
        if (config.minLength && password.length < config.minLength) {
            violations.push(`Password too short (minimum ${config.minLength} characters)`);
        }
        if (config.requireUppercase && !/[A-Z]/.test(password)) {
            violations.push('Password must contain uppercase letters');
        }
        if (config.requireLowercase && !/[a-z]/.test(password)) {
            violations.push('Password must contain lowercase letters');
        }
        if (config.requireNumbers && !/\d/.test(password)) {
            violations.push('Password must contain numbers');
        }
        if (config.requireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            violations.push('Password must contain special characters');
        }
        if (config.forbiddenPasswords &&
            config.forbiddenPasswords.includes(password.toLowerCase())) {
            violations.push('Password is in the forbidden list');
        }
        if (violations.length > 0) {
            return {
                id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ruleId: rule.id,
                userId: auditLog.userId,
                severity: rule.severity,
                message: `Password policy violation: ${violations.join(', ')}`,
                timestamp: new Date(),
                resolved: false,
                metadata: { violations },
            };
        }
        return null;
    }
    /**
     * Evaluate session timeout compliance
     */
    evaluateSessionTimeout(rule, auditLog) {
        var _a;
        if (auditLog.action !== 'session_timeout') {
            return null;
        }
        const sessionDuration = (_a = auditLog.details) === null || _a === void 0 ? void 0 : _a.sessionDuration;
        const maxDuration = rule.config.maxDuration; // in minutes
        if (sessionDuration && sessionDuration > maxDuration) {
            return {
                id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ruleId: rule.id,
                userId: auditLog.userId,
                severity: rule.severity,
                message: `Session timeout exceeded: ${sessionDuration} minutes (max: ${maxDuration})`,
                timestamp: new Date(),
                resolved: false,
                metadata: { sessionDuration, maxDuration },
            };
        }
        return null;
    }
    /**
     * Evaluate audit retention compliance
     */
    evaluateAuditRetention(rule, auditLog) {
        const retentionDays = rule.config.retentionDays;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const oldLogs = this.auditLogs.filter((log) => log.timestamp < cutoffDate);
        if (oldLogs.length > 0) {
            return {
                id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ruleId: rule.id,
                severity: rule.severity,
                message: `Audit logs older than ${retentionDays} days found: ${oldLogs.length} logs`,
                timestamp: new Date(),
                resolved: false,
                metadata: { oldLogCount: oldLogs.length, retentionDays },
            };
        }
        return null;
    }
    /**
     * Evaluate data encryption compliance
     */
    evaluateDataEncryption(rule, auditLog) {
        var _a;
        if (auditLog.action !== 'data_access' &&
            auditLog.action !== 'data_storage') {
            return null;
        }
        const isEncrypted = (_a = auditLog.details) === null || _a === void 0 ? void 0 : _a.encrypted;
        const requiresEncryption = rule.config.requireEncryption;
        if (requiresEncryption && !isEncrypted) {
            return {
                id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ruleId: rule.id,
                userId: auditLog.userId,
                severity: rule.severity,
                message: 'Data access/storage without encryption detected',
                timestamp: new Date(),
                resolved: false,
                metadata: { requiresEncryption, isEncrypted },
            };
        }
        return null;
    }
    /**
     * Evaluate access control compliance
     */
    evaluateAccessControl(rule, auditLog) {
        if (auditLog.action !== 'access_denied' &&
            auditLog.action !== 'unauthorized_access') {
            return null;
        }
        const maxFailedAttempts = rule.config.maxFailedAttempts;
        const timeWindow = rule.config.timeWindow; // in minutes
        if (auditLog.userId) {
            const cutoffTime = new Date();
            cutoffTime.setMinutes(cutoffTime.getMinutes() - timeWindow);
            const recentFailedAttempts = this.auditLogs.filter((log) => log.userId === auditLog.userId &&
                log.action === 'access_denied' &&
                log.timestamp > cutoffTime);
            if (recentFailedAttempts.length >= maxFailedAttempts) {
                return {
                    id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    ruleId: rule.id,
                    userId: auditLog.userId,
                    severity: rule.severity,
                    message: `Multiple failed access attempts: ${recentFailedAttempts.length} in ${timeWindow} minutes`,
                    timestamp: new Date(),
                    resolved: false,
                    metadata: {
                        failedAttempts: recentFailedAttempts.length,
                        maxFailedAttempts,
                        timeWindow,
                    },
                };
            }
        }
        return null;
    }
    /**
     * Generate compliance report
     */
    generateComplianceReport(type, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const periodViolations = Array.from(this.violations.values()).filter((v) => v.timestamp >= startDate && v.timestamp <= endDate);
            const summary = {
                totalViolations: periodViolations.length,
                criticalViolations: periodViolations.filter((v) => v.severity === 'critical').length,
                highViolations: periodViolations.filter((v) => v.severity === 'high')
                    .length,
                mediumViolations: periodViolations.filter((v) => v.severity === 'medium')
                    .length,
                lowViolations: periodViolations.filter((v) => v.severity === 'low')
                    .length,
            };
            const recommendations = this.generateRecommendations(periodViolations);
            const report = {
                id: reportId,
                name: `${type.charAt(0).toUpperCase() + type.slice(1)} Compliance Report`,
                type,
                generatedAt: new Date(),
                period: { start: startDate, end: endDate },
                summary,
                violations: periodViolations,
                recommendations,
            };
            this.reports.set(reportId, report);
            return report;
        });
    }
    /**
     * Generate compliance recommendations
     */
    generateRecommendations(violations) {
        const recommendations = [];
        const violationTypes = new Set(violations.map((v) => v.ruleId));
        if (violationTypes.has('password_policy')) {
            recommendations.push('Strengthen password policy enforcement');
            recommendations.push('Implement password complexity requirements');
        }
        if (violationTypes.has('session_timeout')) {
            recommendations.push('Review and adjust session timeout settings');
            recommendations.push('Implement automatic session termination');
        }
        if (violationTypes.has('access_control')) {
            recommendations.push('Implement account lockout policies');
            recommendations.push('Add multi-factor authentication');
        }
        if (violationTypes.has('data_encryption')) {
            recommendations.push('Ensure all sensitive data is encrypted');
            recommendations.push('Implement encryption key management');
        }
        if (violations.filter((v) => v.severity === 'critical').length > 0) {
            recommendations.push('Address critical compliance violations immediately');
        }
        return recommendations;
    }
    /**
     * Resolve a compliance violation
     */
    resolveViolation(violationId, resolvedBy) {
        return __awaiter(this, void 0, void 0, function* () {
            const violation = this.violations.get(violationId);
            if (!violation) {
                return false;
            }
            violation.resolved = true;
            violation.resolvedAt = new Date();
            violation.resolvedBy = resolvedBy;
            return true;
        });
    }
    /**
     * Create a new compliance rule
     */
    createRule(rule) {
        const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newRule = Object.assign(Object.assign({}, rule), { id });
        this.rules.set(id, newRule);
        return newRule;
    }
    /**
     * Get all compliance violations
     */
    getViolations(filters) {
        let violations = Array.from(this.violations.values());
        if (filters) {
            if (filters.severity) {
                violations = violations.filter((v) => v.severity === filters.severity);
            }
            if (filters.resolved !== undefined) {
                violations = violations.filter((v) => v.resolved === filters.resolved);
            }
            if (filters.userId) {
                violations = violations.filter((v) => v.userId === filters.userId);
            }
            if (filters.ruleId) {
                violations = violations.filter((v) => v.ruleId === filters.ruleId);
            }
        }
        return violations;
    }
    /**
     * Get audit logs
     */
    getAuditLogs(filters) {
        let logs = [...this.auditLogs];
        if (filters) {
            if (filters.userId) {
                logs = logs.filter((log) => log.userId === filters.userId);
            }
            if (filters.action) {
                logs = logs.filter((log) => log.action === filters.action);
            }
            if (filters.resource) {
                logs = logs.filter((log) => log.resource === filters.resource);
            }
            if (filters.startDate) {
                logs = logs.filter((log) => log.timestamp >= filters.startDate);
            }
            if (filters.endDate) {
                logs = logs.filter((log) => log.timestamp <= filters.endDate);
            }
        }
        return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Clean up old audit logs
     */
    cleanupOldAuditLogs() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.auditRetentionDays);
        this.auditLogs = this.auditLogs.filter((log) => log.timestamp > cutoffDate);
    }
    /**
     * Initialize default compliance rules
     */
    initializeDefaultRules() {
        const defaultRules = [
            {
                name: 'Password Policy',
                type: 'password_policy',
                description: 'Enforce strong password requirements',
                enabled: this.config.enablePasswordPolicy,
                severity: 'high',
                config: {
                    minLength: 8,
                    requireUppercase: true,
                    requireLowercase: true,
                    requireNumbers: true,
                    requireSymbols: true,
                    forbiddenPasswords: ['password', '123456', 'admin', 'qwerty'],
                },
            },
            {
                name: 'Session Timeout',
                type: 'session_timeout',
                description: 'Enforce session timeout limits',
                enabled: this.config.enableSessionMonitoring,
                severity: 'medium',
                config: {
                    maxDuration: 480, // 8 hours in minutes
                },
            },
            {
                name: 'Audit Retention',
                type: 'audit_retention',
                description: 'Ensure audit logs are retained for required period',
                enabled: true,
                severity: 'high',
                config: {
                    retentionDays: this.config.auditRetentionDays,
                },
            },
            {
                name: 'Data Encryption',
                type: 'data_encryption',
                description: 'Ensure sensitive data is encrypted',
                enabled: this.config.enableDataEncryption,
                severity: 'critical',
                config: {
                    requireEncryption: true,
                },
            },
            {
                name: 'Access Control',
                type: 'access_control',
                description: 'Monitor and control access attempts',
                enabled: this.config.enableAccessControl,
                severity: 'high',
                config: {
                    maxFailedAttempts: 5,
                    timeWindow: 15, // minutes
                },
            },
        ];
        defaultRules.forEach((rule) => {
            this.createRule(rule);
        });
    }
}
exports.ComplianceService = ComplianceService;
function createComplianceService(config) {
    return new ComplianceService(config);
}
exports.createComplianceService = createComplianceService;
//# sourceMappingURL=ComplianceService.js.map