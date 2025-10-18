export interface ComplianceRule {
    id: string;
    name: string;
    type: 'password_policy' | 'session_timeout' | 'audit_retention' | 'data_encryption' | 'access_control';
    description: string;
    enabled: boolean;
    config: Record<string, any>;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface ComplianceViolation {
    id: string;
    ruleId: string;
    userId?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
    resolved: boolean;
    resolvedAt?: Date;
    resolvedBy?: string;
    metadata?: Record<string, any>;
}
export interface AuditLog {
    id: string;
    userId?: string;
    action: string;
    resource: string;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    details?: Record<string, any>;
    complianceFlags?: string[];
}
export interface ComplianceReport {
    id: string;
    name: string;
    type: 'security' | 'privacy' | 'access' | 'audit';
    generatedAt: Date;
    period: {
        start: Date;
        end: Date;
    };
    summary: {
        totalViolations: number;
        criticalViolations: number;
        highViolations: number;
        mediumViolations: number;
        lowViolations: number;
    };
    violations: ComplianceViolation[];
    recommendations: string[];
}
export interface ComplianceConfig {
    enableAuditLogging: boolean;
    auditRetentionDays: number;
    enablePasswordPolicy: boolean;
    enableSessionMonitoring: boolean;
    enableDataEncryption: boolean;
    enableAccessControl: boolean;
    complianceStandards: string[];
    reportingInterval: number;
}
export declare class ComplianceService {
    private config;
    private rules;
    private violations;
    private auditLogs;
    private reports;
    constructor(config: ComplianceConfig);
    /**
     * Log an audit event
     */
    logAuditEvent(userId: string | undefined, action: string, resource: string, success: boolean, details?: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void>;
    /**
     * Check for compliance violations
     */
    private checkComplianceViolations;
    /**
     * Evaluate a compliance rule
     */
    private evaluateRule;
    /**
     * Evaluate password policy compliance
     */
    private evaluatePasswordPolicy;
    /**
     * Evaluate session timeout compliance
     */
    private evaluateSessionTimeout;
    /**
     * Evaluate audit retention compliance
     */
    private evaluateAuditRetention;
    /**
     * Evaluate data encryption compliance
     */
    private evaluateDataEncryption;
    /**
     * Evaluate access control compliance
     */
    private evaluateAccessControl;
    /**
     * Generate compliance report
     */
    generateComplianceReport(type: 'security' | 'privacy' | 'access' | 'audit', startDate: Date, endDate: Date): Promise<ComplianceReport>;
    /**
     * Generate compliance recommendations
     */
    private generateRecommendations;
    /**
     * Resolve a compliance violation
     */
    resolveViolation(violationId: string, resolvedBy: string): Promise<boolean>;
    /**
     * Create a new compliance rule
     */
    createRule(rule: Omit<ComplianceRule, 'id'>): ComplianceRule;
    /**
     * Get all compliance violations
     */
    getViolations(filters?: {
        severity?: string;
        resolved?: boolean;
        userId?: string;
        ruleId?: string;
    }): ComplianceViolation[];
    /**
     * Get audit logs
     */
    getAuditLogs(filters?: {
        userId?: string;
        action?: string;
        resource?: string;
        startDate?: Date;
        endDate?: Date;
    }): AuditLog[];
    /**
     * Clean up old audit logs
     */
    private cleanupOldAuditLogs;
    /**
     * Initialize default compliance rules
     */
    private initializeDefaultRules;
}
export declare function createComplianceService(config: ComplianceConfig): ComplianceService;
//# sourceMappingURL=ComplianceService.d.ts.map