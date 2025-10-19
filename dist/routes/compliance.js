"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createComplianceRoutes = void 0;
const express_1 = require("express");
function createComplianceRoutes(complianceService) {
    const router = (0, express_1.Router)();
    /**
     * Log audit event
     */
    router.post('/audit', async (req, res) => {
        try {
            const { userId, action, resource, success, details, ipAddress, userAgent, } = req.body;
            if (!action || !resource) {
                return res.status(400).json({
                    success: false,
                    error: 'Action and resource are required',
                });
            }
            await complianceService.logAuditEvent(userId, action, resource, success !== false, details, ipAddress, userAgent);
            res.json({
                success: true,
                message: 'Audit event logged',
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to log audit event',
            });
        }
    });
    /**
     * Get compliance violations
     */
    router.get('/violations', (req, res) => {
        try {
            const filters = {
                severity: req.query.severity,
                resolved: req.query.resolved
                    ? req.query.resolved === 'true'
                    : undefined,
                userId: req.query.userId,
                ruleId: req.query.ruleId,
            };
            const violations = complianceService.getViolations(filters);
            res.json({
                success: true,
                data: violations,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to get violations',
            });
        }
    });
    /**
     * Resolve violation
     */
    router.post('/violations/:id/resolve', async (req, res) => {
        try {
            const { id } = req.params;
            const { resolvedBy } = req.body;
            if (!resolvedBy) {
                return res.status(400).json({
                    success: false,
                    error: 'ResolvedBy is required',
                });
            }
            const success = await complianceService.resolveViolation(id, resolvedBy);
            if (success) {
                res.json({
                    success: true,
                    message: 'Violation resolved',
                });
            }
            else {
                res.status(404).json({
                    success: false,
                    error: 'Violation not found',
                });
            }
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to resolve violation',
            });
        }
    });
    /**
     * Get audit logs
     */
    router.get('/audit', (req, res) => {
        try {
            const filters = {
                userId: req.query.userId,
                action: req.query.action,
                resource: req.query.resource,
                startDate: req.query.startDate
                    ? new Date(req.query.startDate)
                    : undefined,
                endDate: req.query.endDate
                    ? new Date(req.query.endDate)
                    : undefined,
            };
            const logs = complianceService.getAuditLogs(filters);
            res.json({
                success: true,
                data: logs,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to get audit logs',
            });
        }
    });
    /**
     * Generate compliance report
     */
    router.post('/reports', async (req, res) => {
        try {
            const { type, startDate, endDate } = req.body;
            if (!type || !startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    error: 'Type, startDate, and endDate are required',
                });
            }
            const report = await complianceService.generateComplianceReport(type, new Date(startDate), new Date(endDate));
            res.json({
                success: true,
                data: report,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to generate report',
            });
        }
    });
    /**
     * Create compliance rule
     */
    router.post('/rules', (req, res) => {
        try {
            const rule = complianceService.createRule(req.body);
            res.json({
                success: true,
                data: rule,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: 'Failed to create rule',
            });
        }
    });
    return router;
}
exports.createComplianceRoutes = createComplianceRoutes;
//# sourceMappingURL=compliance.js.map